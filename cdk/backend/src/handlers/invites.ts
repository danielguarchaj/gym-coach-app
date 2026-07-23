import { APIGatewayProxyHandler } from 'aws-lambda'
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamo, Tables } from '../services/dynamo'
import { ok, created, badRequest, forbidden, notFound, gone, serverError } from '../services/response'

const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://example.github.io/gym-coach-app'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const method = event.httpMethod
    const token = event.pathParameters?.token
    const resource = event.resource ?? ''

    if (method === 'POST' && resource.endsWith('/invites')) return createInvite(event)
    if (method === 'GET' && token) return validateInvite(token)
    return notFound()
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

async function createInvite(event: Parameters<APIGatewayProxyHandler>[0]) {
  const claims = event.requestContext.authorizer?.claims ?? {}
  const coachId: string = claims['sub']
  const role: string = claims['custom:role']
  const coachName: string = claims['name'] ?? 'Tu entrenador'

  if (role !== 'COACH') return forbidden('Only coaches can create invite links')

  const token = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + INVITE_TTL_SECONDS

  await dynamo.send(
    new PutCommand({
      TableName: Tables.invites,
      Item: {
        pk: `INVITE#${token}`,
        sk: 'METADATA',
        token,
        coachId,
        coachName,
        status: 'pending',
        expiresAt,
        createdAt: new Date().toISOString(),
      },
    }),
  )

  const inviteUrl = `${APP_BASE_URL}/#/invite/${token}`
  return created({ token, inviteUrl, expiresAt })
}

async function validateInvite(token: string) {
  const res = await dynamo.send(
    new GetCommand({
      TableName: Tables.invites,
      Key: { pk: `INVITE#${token}`, sk: 'METADATA' },
    }),
  )

  const invite = res.Item
  if (!invite) return notFound('Invite not found')
  if (invite['status'] === 'used') return gone('Invite already used')

  const now = Math.floor(Date.now() / 1000)
  if (invite['expiresAt'] < now) return gone('Invite expired')

  return ok({
    valid: true,
    coachName: invite['coachName'],
    coachId: invite['coachId'],
  })
}
