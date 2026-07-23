import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const cognitoClient = new CognitoIdentityProviderClient({});
export const USER_POOL_ID = process.env.USER_POOL_ID!;
export const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
