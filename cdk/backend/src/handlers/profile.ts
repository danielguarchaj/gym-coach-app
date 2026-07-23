import { APIGatewayProxyHandler } from 'aws-lambda'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, Tables } from '../services/dynamo'
import { ok, notFound, badRequest, serverError } from '../services/response'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const method = event.httpMethod
    const claims = event.requestContext.authorizer?.claims ?? {}
    const userId: string = claims['sub']

    if (method === 'GET') return getProfile(userId)
    if (method === 'PATCH') return updateProfile(event, userId)
    return notFound()
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

async function getProfile(userId: string) {
  const res = await dynamo.send(
    new GetCommand({ TableName: Tables.users, Key: { pk: `USER#${userId}`, sk: 'PROFILE' } }),
  )
  if (!res.Item) return notFound('Profile not found')
  const { pk: _pk, sk: _sk, ...profile } = res.Item
  return ok(profile)
}

async function updateProfile(event: Parameters<APIGatewayProxyHandler>[0], userId: string) {
  const body = JSON.parse(event.body ?? '{}')
  const { name, weightUnit } = body

  if (weightUnit && !['kg', 'lb'].includes(weightUnit)) return badRequest('Invalid weight unit')

  const updates: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (name) { updates.push('#name = :name'); names['#name'] = 'name'; values[':name'] = name }
  if (weightUnit) { updates.push('weightUnit = :wu'); values[':wu'] = weightUnit }

  if (updates.length === 0) return badRequest('No fields to update')

  const res = await dynamo.send(
    new UpdateCommand({
      TableName: Tables.users,
      Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  )

  const { pk: _pk, sk: _sk, ...profile } = res.Attributes ?? {}
  return ok(profile)
}
