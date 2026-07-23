import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as path from 'path';
import { Construct } from 'constructs';

interface SeedStackProps extends cdk.StackProps {
  exerciseCatalogTable: dynamodb.Table;
}

export class SeedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SeedStackProps) {
    super(scope, id, props);

    const seedFn = new NodejsFunction(this, 'SeedFunction', {
      entry: path.join(__dirname, '../backend/src/seed/seedHandler.ts'),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      environment: {
        EXERCISES_TABLE: props.exerciseCatalogTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
      },
    });

    seedFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Scan'],
      resources: [props.exerciseCatalogTable.tableArn],
    }));

    const provider = new cr.Provider(this, 'SeedProvider', {
      onEventHandler: seedFn,
    });

    new cdk.CustomResource(this, 'SeedResource', {
      serviceToken: provider.serviceToken,
      // Bump resourceVersion to force a re-seed on explicit request
      properties: { resourceVersion: '1' },
    });
  }
}
