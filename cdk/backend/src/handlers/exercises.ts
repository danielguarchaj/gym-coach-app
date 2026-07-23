import { APIGatewayProxyHandler } from 'aws-lambda'
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, Tables } from '../services/dynamo'
import { ok, notFound, serverError } from '../services/response'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const resource = event.resource
    const id = event.pathParameters?.id

    if (id) return getExercise(id)
    if (resource?.endsWith('/exercises')) return listExercises(event.queryStringParameters)
    return notFound()
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

async function listExercises(params: Record<string, string | undefined> | null) {
  const bodyPart = params?.bodyPart

  if (bodyPart) {
    const res = await dynamo.send(
      new QueryCommand({
        TableName: Tables.exercises,
        IndexName: 'bodyPart-index',
        KeyConditionExpression: 'bodyPart = :bp',
        ExpressionAttributeValues: { ':bp': bodyPart },
      }),
    )
    return ok({ exercises: res.Items ?? [] })
  }

  // No filter — scan via GSI is inefficient at scale; acceptable for MVP catalog size (~60 items)
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb')
  const res = await dynamo.send(new ScanCommand({ TableName: Tables.exercises }))
  return ok({ exercises: res.Items ?? [] })
}

async function getExercise(id: string) {
  const res = await dynamo.send(
    new GetCommand({
      TableName: Tables.exercises,
      Key: { pk: `EXERCISE#${id}`, sk: 'METADATA' },
    }),
  )
  if (!res.Item) return notFound('Exercise not found')
  return ok(res.Item)
}
