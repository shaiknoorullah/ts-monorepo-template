// `repo env ...` — YAML config rendering / validation / inspection.

import { defineCommand } from 'citty'

import { envRender } from './env/render'
import { envShow } from './env/show'
import { envValidate } from './env/validate'

export const envCommand = defineCommand({
  meta: {
    description: 'Render, validate, and inspect YAML configs in config/.',
    name: 'env',
  },
  subCommands: {
    render: envRender,
    show: envShow,
    validate: envValidate,
  },
})
