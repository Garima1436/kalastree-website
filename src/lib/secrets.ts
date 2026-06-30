const SSM_PREFIX = '/amplify/d1frorazzn0fvi/main'
const cache: Record<string, string> = {}

export async function getSecret(name: string): Promise<string> {
  const local = process.env[name]
  if (local) return local
  if (cache[name]) return cache[name]

  try {
    const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm')
    const client = new SSMClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' })
    const result = await client.send(new GetParameterCommand({
      Name: `${SSM_PREFIX}/${name}`,
      WithDecryption: true,
    }))
    const value = result.Parameter?.Value ?? ''
    if (value) cache[name] = value
    console.log(`SSM secret ${name}: ${value ? 'loaded' : 'EMPTY'}`)
    return value
  } catch (err: any) {
    console.error(`SSM getSecret(${name}) failed:`, err?.message ?? err)
    return ''
  }
}
