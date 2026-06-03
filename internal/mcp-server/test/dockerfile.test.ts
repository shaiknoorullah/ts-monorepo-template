import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DF = readFileSync(join(__dirname, '..', 'Dockerfile'), 'utf8')

describe('mcp-server Dockerfile', () => {
  it('declares docker syntax 1.10 (spec Section 5.3)', () => {
    expect(DF.split('\n')[0]).toBe('# syntax=docker/dockerfile:1.10')
  })

  it('uses multi-stage build (builder + runtime)', () => {
    expect(DF).toMatch(/FROM\s+node:20\.\d+\.\d+-bookworm\s+AS\s+builder/)
    expect(DF).toMatch(/FROM\s+gcr\.io\/distroless\/nodejs20-debian12:nonroot\s+AS\s+runtime/)
  })

  it('pins pnpm via corepack (no global install)', () => {
    expect(DF).toMatch(/RUN corepack enable && corepack prepare pnpm@\d+\.\d+\.\d+/)
  })

  it('runs as a non-root user in the runtime stage', () => {
    expect(DF).toMatch(/USER\s+nonroot/)
  })

  it('entrypoint runs the compiled stdio server', () => {
    expect(DF).toMatch(/ENTRYPOINT\s+\["node",\s*"\/app\/dist\/server\.js"\]/)
  })

  it('LABELs declare OCI source + revision (spec Section 5.6)', () => {
    expect(DF).toMatch(/LABEL org\.opencontainers\.image\.source/)
    expect(DF).toMatch(/LABEL org\.opencontainers\.image\.licenses="Apache-2\.0"/)
  })
})
