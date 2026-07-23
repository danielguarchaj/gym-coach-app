import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'gym-coach-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: false }),
        coachId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'gym-coach-app-client',
      authFlows: { userSrp: true },
      generateSecret: false,
      preventUserExistenceErrors: true,
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, fullname: true })
        .withCustomAttributes('role', 'coachId'),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, fullname: true })
        .withCustomAttributes('role', 'coachId'),
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'GymCoachUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'GymCoachUserPoolClientId',
    });
  }
}
