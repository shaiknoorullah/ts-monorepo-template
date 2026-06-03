import { describe, it, expect } from 'vitest'
import { UserSchema, CreateUserRequestSchema } from '../gen/ts/user/v1/user_pb.js'
import {
  HealthCheckRequestSchema,
  HealthCheckResponse_ServingStatus,
} from '../gen/ts/health/v1/health_pb.js'

describe('contracts TS bindings', () => {
  it('exports UserSchema with the expected field set', () => {
    const fieldNames = UserSchema.fields.map((f) => f.name).sort()
    expect(fieldNames).toEqual(['created_at', 'display_name', 'email', 'id'])
  })

  it('exports CreateUserRequestSchema', () => {
    expect(CreateUserRequestSchema.typeName).toBe('user.v1.CreateUserRequest')
  })

  it('exports HealthCheckRequestSchema and ServingStatus enum', () => {
    expect(HealthCheckRequestSchema.typeName).toBe('health.v1.HealthCheckRequest')
    expect(HealthCheckResponse_ServingStatus.SERVING).toBe(1)
  })
})
