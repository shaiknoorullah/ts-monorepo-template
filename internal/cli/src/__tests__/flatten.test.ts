import { describe, expect, it } from 'vitest'
import { flattenToEnv, formatEnvFile, toEnvKey } from '../utils/flatten'

describe('toEnvKey', () => {
  it('converts camelCase dotted paths to SCREAMING_SNAKE', () => {
    expect(toEnvKey(['database', 'host'])).toBe('DATABASE_HOST')
    expect(toEnvKey(['kafka', 'bootstrapServers'])).toBe('KAFKA_BOOTSTRAP_SERVERS')
    expect(toEnvKey(['saas', 'lago', 'apiUrl'])).toBe('SAAS_LAGO_API_URL')
  })
  it('strips non-alphanumeric chars', () => {
    expect(toEnvKey(['weird-key', 'x.y'])).toBe('WEIRD_KEY_X_Y')
  })
})

describe('flattenToEnv', () => {
  it('flattens nested objects', () => {
    const out = flattenToEnv({
      app: { name: 'svc', port: 3000 },
      database: { host: 'localhost', ssl: false },
    })
    expect(out.APP_NAME).toBe('svc')
    expect(out.APP_PORT).toBe('3000')
    expect(out.DATABASE_HOST).toBe('localhost')
    expect(out.DATABASE_SSL).toBe('false')
  })
  it('joins primitive arrays with commas', () => {
    const out = flattenToEnv({ kafka: { bootstrapServers: ['a:9092', 'b:9092'] } })
    expect(out.KAFKA_BOOTSTRAP_SERVERS).toBe('a:9092,b:9092')
  })
  it('skips unresolved SecretRefs', () => {
    const out = flattenToEnv({
      database: {
        host: 'localhost',
        password: { provider: 'vault', path: 'secret/data/x#y' },
      },
    })
    expect(out.DATABASE_HOST).toBe('localhost')
    expect(out.DATABASE_PASSWORD).toBeUndefined()
  })
})

describe('formatEnvFile', () => {
  it('quotes values with spaces or special chars', () => {
    const out = formatEnvFile({ A: 'plain', B: 'has space', C: 'with$dollar' })
    expect(out).toContain('A=plain')
    expect(out).toContain('B="has space"')
    expect(out).toContain('C="with$dollar"')
  })
  it('emits keys sorted', () => {
    const out = formatEnvFile({ Z: '1', A: '2' })
    const lines = out.trim().split('\n')
    expect(lines[0]).toMatch(/^A=/)
    expect(lines[1]).toMatch(/^Z=/)
  })
})
