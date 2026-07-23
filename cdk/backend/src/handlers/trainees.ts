import { APIGatewayProxyHandler } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, Tables } from '../services/dynamo'
import { ok, forbidden, notFound, badRequest, serverError } from '../services/response'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const resource = event.resource ?? ''
    const id = event.pathParameters?.id
    const claims = event.requestContext.authorizer?.claims ?? {}
    const userId: string = claims['sub']
    const role: string = claims['custom:role']

    if (role !== 'COACH') return forbidden('Only coaches can access this resource')

    if (resource.endsWith('/trainees') && !id) return listTrainees(userId)
    if (resource.endsWith('/{id}') && id) return getTrainee(userId, id)
    if (resource.endsWith('/sessions') && id) return getTraineeSessions(event, userId, id)
    if (resource.endsWith('/progress') && id) return getTraineeProgress(event, userId, id)
    if (resource.endsWith('/progress') && !id) return getOwnProgress(event, userId)
    return notFound()
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

async function listTrainees(coachId: string) {
  const res = await dynamo.send(
    new QueryCommand({
      TableName: Tables.users,
      IndexName: 'coachId-index',
      KeyConditionExpression: 'coachId = :cid',
      ExpressionAttributeValues: { ':cid': coachId },
    }),
  )

  const trainees = (res.Items ?? []).map((t) => ({
    userId: t['userId'],
    name: t['name'],
    email: t['email'],
    createdAt: t['createdAt'],
  }))

  return ok({ trainees })
}

async function getTrainee(coachId: string, traineeId: string) {
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb')
  const res = await dynamo.send(
    new GetCommand({
      TableName: Tables.users,
      Key: { pk: `USER#${traineeId}`, sk: 'PROFILE' },
    }),
  )

  const trainee = res.Item
  if (!trainee || trainee['coachId'] !== coachId) return notFound('Trainee not found')

  const sessionsRes = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': `TRAINEE#${traineeId}`, ':prefix': 'SESSION#' },
      ScanIndexForward: false,
      Limit: 1,
      Select: 'SPECIFIC_ATTRIBUTES',
      ProjectionExpression: '#d',
      ExpressionAttributeNames: { '#d': 'date' },
    }),
  )

  const lastSession = sessionsRes.Items?.[0]?.['date'] ?? null

  const totalRes = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': `TRAINEE#${traineeId}`, ':prefix': 'SESSION#' },
      Select: 'COUNT',
    }),
  )

  return ok({
    userId: trainee['userId'],
    name: trainee['name'],
    email: trainee['email'],
    lastSession,
    totalSessions: totalRes.Count ?? 0,
  })
}

async function getTraineeSessions(
  event: Parameters<APIGatewayProxyHandler>[0],
  coachId: string,
  traineeId: string,
) {
  // Verify trainee belongs to this coach
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb')
  const userRes = await dynamo.send(
    new GetCommand({ TableName: Tables.users, Key: { pk: `USER#${traineeId}`, sk: 'PROFILE' } }),
  )
  if (!userRes.Item || userRes.Item['coachId'] !== coachId) return notFound('Trainee not found')

  const params = event.queryStringParameters ?? {}
  const limit = Math.min(parseInt(params.limit ?? '20', 10), 50)

  const res = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': `TRAINEE#${traineeId}`, ':prefix': 'SESSION#' },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: params.cursor
        ? JSON.parse(Buffer.from(params.cursor, 'base64').toString())
        : undefined,
    }),
  )

  const nextCursor = res.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
    : null

  return ok({ sessions: res.Items ?? [], nextCursor })
}

async function getTraineeProgress(
  event: Parameters<APIGatewayProxyHandler>[0],
  coachId: string,
  traineeId: string,
) {
  const params = event.queryStringParameters ?? {}
  const exerciseId = params.exerciseId
  if (!exerciseId) return badRequest('exerciseId is required')

  // Verify ownership
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb')
  const userRes = await dynamo.send(
    new GetCommand({ TableName: Tables.users, Key: { pk: `USER#${traineeId}`, sk: 'PROFILE' } }),
  )
  if (!userRes.Item || userRes.Item['coachId'] !== coachId) return notFound('Trainee not found')

  return buildProgressResponse(traineeId, exerciseId, params.from, params.to)
}

async function getOwnProgress(
  event: Parameters<APIGatewayProxyHandler>[0],
  traineeId: string,
) {
  const params = event.queryStringParameters ?? {}
  const exerciseId = params.exerciseId
  if (!exerciseId) return badRequest('exerciseId is required')
  return buildProgressResponse(traineeId, exerciseId, params.from, params.to)
}

async function buildProgressResponse(
  traineeId: string,
  exerciseId: string,
  from?: string,
  to?: string,
) {
  let keyCondition = 'pk = :pk AND begins_with(sk, :prefix)'
  const expressionValues: Record<string, unknown> = {
    ':pk': `TRAINEE#${traineeId}`,
    ':prefix': 'SESSION#',
  }

  if (from && to) {
    keyCondition = 'pk = :pk AND sk BETWEEN :from AND :to'
    expressionValues[':from'] = `SESSION#${from}`
    expressionValues[':to'] = `SESSION#${to}~`
    delete expressionValues[':prefix']
  }

  const res = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: true,
    }),
  )

  interface DataPoint { date: string; maxWeightKg: number; totalVolume: number; reps: number }
  const dataPoints: DataPoint[] = []

  for (const session of res.Items ?? []) {
    const exercises = (session['exercises'] as Array<{ catalogId: string; sets: Array<{ weightKg: number; reps: number }> }>) ?? []
    const match = exercises.find((ex) => ex.catalogId === exerciseId)
    if (!match) continue

    const maxWeightKg = Math.max(...match.sets.map((s) => s.weightKg))
    const totalVolume = match.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    const reps = match.sets[0]?.reps ?? 0

    dataPoints.push({ date: session['date'] as string, maxWeightKg, totalVolume, reps })
  }

  return ok({ exerciseId, dataPoints })
}
