import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  usersTable: dynamodb.Table;
  workoutsTable: dynamodb.Table;
  exerciseCatalogTable: dynamodb.Table;
  invitesTable: dynamodb.Table;
}

const BACKEND_SRC = path.join(__dirname, '../backend/src');

export class ApiStack extends cdk.Stack {
  readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const sharedEnv = {
      USERS_TABLE: props.usersTable.tableName,
      WORKOUTS_TABLE: props.workoutsTable.tableName,
      EXERCISES_TABLE: props.exerciseCatalogTable.tableName,
      INVITES_TABLE: props.invitesTable.tableName,
      USER_POOL_ID: props.userPool.userPoolId,
      USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
    };

    const bundling = { minify: true, sourceMap: false };

    function fn(scope: Construct, id: string, entry: string, env?: Record<string, string>): NodejsFunction {
      return new NodejsFunction(scope, id, {
        entry: path.join(BACKEND_SRC, entry),
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(30),
        environment: { ...sharedEnv, ...(env ?? {}) },
        bundling,
      });
    }

    // Lambda functions — one per handler group
    const authFn = fn(this, 'AuthFn', 'handlers/auth.ts');
    const invitesFn = fn(this, 'InvitesFn', 'handlers/invites.ts');
    const traineesFn = fn(this, 'TraineesFn', 'handlers/trainees.ts');
    const sessionsFn = fn(this, 'SessionsFn', 'handlers/sessions.ts');
    const exercisesFn = fn(this, 'ExercisesFn', 'handlers/exercises.ts');
    const profileFn = fn(this, 'ProfileFn', 'handlers/profile.ts');

    // DynamoDB permissions — least-privilege per function
    props.usersTable.grantReadWriteData(authFn);
    props.invitesTable.grantReadWriteData(authFn);

    props.invitesTable.grantReadWriteData(invitesFn);
    props.usersTable.grantReadData(invitesFn);

    props.usersTable.grantReadData(traineesFn);
    props.workoutsTable.grantReadData(traineesFn);

    props.workoutsTable.grantReadWriteData(sessionsFn);
    props.exerciseCatalogTable.grantReadData(sessionsFn);

    props.exerciseCatalogTable.grantReadData(exercisesFn);

    props.usersTable.grantReadWriteData(profileFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'GymCoachApi', {
      restApiName: 'gym-coach-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Attach CORS headers to API Gateway-generated responses (auth failures, 5XX, etc.)
    // Without this, preflight OPTIONS errors and Cognito 401s lack Access-Control-Allow-Origin.
    const corsHeaders = {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      'Access-Control-Allow-Methods': "'GET,POST,PATCH,DELETE,OPTIONS'",
    };
    api.addGatewayResponse('Cors4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: corsHeaders,
    });
    api.addGatewayResponse('Cors5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: corsHeaders,
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });

    const authorized = { authorizer: cognitoAuthorizer, authorizationType: apigateway.AuthorizationType.COGNITO };

    const v1 = api.root.addResource('v1');

    // Auth
    const authRes = v1.addResource('auth');
    authRes.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authFn), authorized);

    // Invites
    const invitesRes = v1.addResource('invites');
    invitesRes.addMethod('POST', new apigateway.LambdaIntegration(invitesFn), authorized);
    const inviteToken = invitesRes.addResource('{token}');
    // validate is public — no authorizer
    inviteToken.addResource('validate').addMethod('GET', new apigateway.LambdaIntegration(invitesFn));

    // Trainees (coach only — role enforcement in Lambda)
    const traineesRes = v1.addResource('trainees');
    traineesRes.addMethod('GET', new apigateway.LambdaIntegration(traineesFn), authorized);
    const traineeId = traineesRes.addResource('{id}');
    traineeId.addMethod('GET', new apigateway.LambdaIntegration(traineesFn), authorized);
    traineeId.addResource('sessions').addMethod('GET', new apigateway.LambdaIntegration(traineesFn), authorized);
    traineeId.addResource('progress').addMethod('GET', new apigateway.LambdaIntegration(traineesFn), authorized);

    // Sessions (trainee only)
    const sessionsRes = v1.addResource('sessions');
    sessionsRes.addMethod('POST', new apigateway.LambdaIntegration(sessionsFn), authorized);
    sessionsRes.addMethod('GET', new apigateway.LambdaIntegration(sessionsFn), authorized);
    sessionsRes.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(sessionsFn), authorized);

    // Progress (trainee own)
    v1.addResource('progress').addMethod('GET', new apigateway.LambdaIntegration(traineesFn), authorized);

    // Exercises catalog
    const exercisesRes = v1.addResource('exercises');
    exercisesRes.addMethod('GET', new apigateway.LambdaIntegration(exercisesFn), authorized);
    exercisesRes.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(exercisesFn), authorized);

    // Profile
    const profileRes = v1.addResource('profile');
    profileRes.addMethod('GET', new apigateway.LambdaIntegration(profileFn), authorized);
    profileRes.addMethod('PATCH', new apigateway.LambdaIntegration(profileFn), authorized);

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      exportName: 'GymCoachApiUrl',
    });
  }
}
