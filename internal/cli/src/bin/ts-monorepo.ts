#!/usr/bin/env node
// internal/cli/src/bin/ts-monorepo.ts
import { execute } from '@oclif/core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
await execute({ dir: root })
