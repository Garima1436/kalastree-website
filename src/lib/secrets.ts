import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' })
const SSM_PREFIX = '/amplify/d1frorazzn0fvi/main'

const cache: Record<string, string> = {}

export async function getSecret(name: string): Promise<string> {
  const local = process.env[name]
  if (local) return local
  if (cache[name]) return cache[name]

  const result = await client.send(new GetParameterCommand({
    Name: `${SSM_PREFIX}/${name}`,
    WithDecryption: true,
  }))
  const value = result.Parameter?.Value ?? ''
  cache[name] = value
  return value
}
