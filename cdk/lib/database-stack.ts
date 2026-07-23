import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  readonly usersTable: dynamodb.Table;
  readonly workoutsTable: dynamodb.Table;
  readonly exerciseCatalogTable: dynamodb.Table;
  readonly invitesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'gym-coach-users',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Allows coach to list all their trainees: query where coachId = COACH#{id}
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'coachId-index',
      partitionKey: { name: 'coachId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.workoutsTable = new dynamodb.Table(this, 'WorkoutsTable', {
      tableName: 'gym-coach-workouts',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.exerciseCatalogTable = new dynamodb.Table(this, 'ExerciseCatalogTable', {
      tableName: 'gym-coach-exercises',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Allows listing all exercises for a given body part
    this.exerciseCatalogTable.addGlobalSecondaryIndex({
      indexName: 'bodyPart-index',
      partitionKey: { name: 'bodyPart', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // TTL on expiresAt — DynamoDB auto-deletes expired invite tokens
    this.invitesTable = new dynamodb.Table(this, 'InvitesTable', {
      tableName: 'gym-coach-invites',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'UsersTableName', { value: this.usersTable.tableName });
    new cdk.CfnOutput(this, 'WorkoutsTableName', { value: this.workoutsTable.tableName });
    new cdk.CfnOutput(this, 'ExercisesTableName', { value: this.exerciseCatalogTable.tableName });
    new cdk.CfnOutput(this, 'InvitesTableName', { value: this.invitesTable.tableName });
  }
}
