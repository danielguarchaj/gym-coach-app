import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { EXERCISES } from './exercises'

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.EXERCISES_TABLE!

export async function handler(event: { RequestType: string }) {
  if (event.RequestType === 'Delete') return { Status: 'SUCCESS' }

  const existing = await dynamo.send(new ScanCommand({ TableName: TABLE, Limit: 1 }))
  if ((existing.Count ?? 0) > 0) {
    console.log('Exercise catalog already seeded, skipping.')
    return { Status: 'SUCCESS' }
  }

  const writes = EXERCISES.map((ex) =>
    dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          pk: `EXERCISE#${ex.exerciseId}`,
          sk: 'METADATA',
          ...ex,
        },
      }),
    ),
  )

  await Promise.all(writes)
  console.log(`Seeded ${EXERCISES.length} exercises.`)
  return { Status: 'SUCCESS' }
}
