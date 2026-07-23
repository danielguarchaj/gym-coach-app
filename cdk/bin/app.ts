import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { SeedStack } from '../lib/seed-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const authStack = new AuthStack(app, 'GymCoachAuthStack', { env });
const dbStack = new DatabaseStack(app, 'GymCoachDatabaseStack', { env });
const apiStack = new ApiStack(app, 'GymCoachApiStack', {
  env,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  usersTable: dbStack.usersTable,
  workoutsTable: dbStack.workoutsTable,
  exerciseCatalogTable: dbStack.exerciseCatalogTable,
  invitesTable: dbStack.invitesTable,
  appBaseUrl: process.env.APP_BASE_URL ?? "",
});
new SeedStack(app, 'GymCoachSeedStack', {
  env,
  exerciseCatalogTable: dbStack.exerciseCatalogTable,
});
