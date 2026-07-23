import { APIGatewayProxyHandler } from 'aws-lambda'
import { PutCommand, QueryCommand, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { dynamo, Tables } from '../services/dynamo'
import { ok, created, badRequest, forbidden, notFound, serverError } from '../services/response'
import type { ExerciseRecord, SetRecord } from '../types/index'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const method = event.httpMethod
    const id = event.pathParameters?.id
    const claims = event.requestContext.authorizer?.claims ?? {}
    const userId: string = claims['sub']
    const role: string = claims['custom:role']

    if (method === 'POST') return createSession(event, userId, role)
    if (method === 'GET' && id) return getSession(id, userId, role)
    if (method === 'GET') return listSessions(event, userId, role)
    return notFound()
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

async function createSession(event: Parameters<APIGatewayProxyHandler>[0], traineeId: string, role: string) {
  if (role !== 'TRAINEE') return forbidden('Only trainees can log sessions')

  const body = JSON.parse(event.body ?? '{}')
  const { date, durationMin, notes, exercises } = body

  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return badRequest('exercises array is required')
  }

  // Validate and normalize all weights to kg
  const normalizedExercises: ExerciseRecord[] = exercises.map((ex: ExerciseRecord & { weightUnit?: string }) => ({
    catalogId: ex.catalogId,
    name: ex.name,
    bodyPart: ex.bodyPart,
    sets: (ex.sets ?? []).map((s: SetRecord & { weightLb?: number }) => ({
      reps: s.reps,
      weightKg: s.weightKg ?? (s.weightLb ? +(s.weightLb / 2.20462).toFixed(2) : 0),
      restSeconds: s.restSeconds ?? 0,
    })),
  }))

  const sessionId = randomUUID()
  const sessionDate = date ?? new Date().toISOString().split('T')[0]
  const sk = `SESSION#${sessionDate}#${sessionId}`

  const item = {
    pk: `TRAINEE#${traineeId}`,
    sk,
    sessionId,
    traineeId,
    date: sessionDate,
    durationMin: durationMin ?? null,
    notes: notes ?? null,
    exercises: normalizedExercises,
    createdAt: new Date().toISOString(),
  }

  await dynamo.send(new PutCommand({ TableName: Tables.workouts, Item: item }))
  return created(item)
}

async function listSessions(
  event: Parameters<APIGatewayProxyHandler>[0],
  userId: string,
  _role: string,
) {
  const params = event.queryStringParameters ?? {}
  const from = params.from
  const to = params.to
  const limit = Math.min(parseInt(params.limit ?? '20', 10), 50)

  let keyCondition = 'pk = :pk'
  const expressionValues: Record<string, string | number> = { ':pk': `TRAINEE#${userId}` }

  if (from && to) {
    keyCondition += ' AND sk BETWEEN :from AND :to'
    expressionValues[':from'] = `SESSION#${from}`
    expressionValues[':to'] = `SESSION#${to}~` // '~' sorts after all UUIDs
  } else {
    keyCondition += ' AND begins_with(sk, :prefix)'
    expressionValues[':prefix'] = 'SESSION#'
  }

  const res = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: false, // newest first
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

async function getSession(sessionId: string, userId: string, _role: string) {
  // sk is not directly the sessionId — we need to query by trainee and filter
  const res = await dynamo.send(
    new QueryCommand({
      TableName: Tables.workouts,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `TRAINEE#${userId}`,
        ':prefix': 'SESSION#',
      },
      FilterExpression: 'sessionId = :sid',
      ExpressionAttributeNames: undefined,
    }),
  )
  const session = (res.Items ?? []).find((i) => i['sessionId'] === sessionId)
  if (!session) return notFound('Session not found')
  return ok(session)
}

// Re-export individual function names to match api-stack references
export const createSession_ = handler
export const listSessions_ = handler
export const getSession_ = handler
