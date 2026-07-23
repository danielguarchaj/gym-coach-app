import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const dynamo = DynamoDBDocumentClient.from(client);

export const Tables = {
  users: process.env.USERS_TABLE!,
  workouts: process.env.WORKOUTS_TABLE!,
  exercises: process.env.EXERCISES_TABLE!,
  invites: process.env.INVITES_TABLE!,
};
