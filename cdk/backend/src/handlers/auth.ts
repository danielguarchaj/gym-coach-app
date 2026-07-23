import { APIGatewayProxyHandler } from 'aws-lambda'
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, Tables } from '../services/dynamo'
import { ok, badRequest, gone, serverError } from '../services/response'
import type { Role } from '../types/index'

interface RegisterBody {
  name: string
  role: Role
  inviteToken?: string
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // userId and email come from the Cognito JWT authorizer claims
    const claims = event.requestContext.authorizer?.claims ?? {}
    const userId: string = claims['sub']
    const email: string = claims['email']

    if (!userId || !email) return badRequest('Missing auth claims')

    const body: RegisterBody = JSON.parse(event.body ?? '{}')
    const { name, role, inviteToken } = body

    if (!name || !role) return badRequest('name and role are required')

    let coachId: string | undefined

    if (inviteToken) {
      const inviteRes = await dynamo.send(
        new GetCommand({
          TableName: Tables.invites,
          Key: { pk: `INVITE#${inviteToken}`, sk: 'METADATA' },
        }),
      )

      const invite = inviteRes.Item
      if (!invite) return gone('Invite token not found or expired')
      if (invite.status === 'used') return gone('Invite token already used')
      if (invite.expiresAt < Math.floor(Date.now() / 1000)) return gone('Invite token expired')

      coachId = invite.coachId as string

      // Mark invite as used
      await dynamo.send(
        new UpdateCommand({
          TableName: Tables.invites,
          Key: { pk: `INVITE#${inviteToken}`, sk: 'METADATA' },
          UpdateExpression: 'SET #status = :used',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':used': 'used' },
        }),
      )
    }

    const userRecord = {
      pk: `USER#${userId}`,
      sk: 'PROFILE',
      userId,
      email,
      name,
      role,
      coachId,
      weightUnit: 'kg',
      createdAt: new Date().toISOString(),
    }

    await dynamo.send(
      new PutCommand({
        TableName: Tables.users,
        Item: userRecord,
        ConditionExpression: 'attribute_not_exists(pk)', // idempotent
      }),
    )

    return ok({ userId, email, name, role, coachId })
  } catch (err: unknown) {
    // PutCommand condition failed — user already registered, not an error
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return ok({ message: 'User already registered' })
    }
    console.error(err)
    return serverError()
  }
}
