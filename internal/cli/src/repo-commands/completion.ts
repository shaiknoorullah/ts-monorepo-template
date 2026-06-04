// `repo completion <bash|zsh>` — emit shell completion script.
//
// We keep this minimal (top-level commands + their immediate subcommands) so
// agents and humans get tab-completion without taking on a runtime-introspection
// dependency.

import { defineCommand } from 'citty'

import { emit, isJsonMode, logRaw } from '../utils/output'

const TOP = [
  'new',
  'env',
  'dev',
  'db',
  'deps',
  'release',
  'lint',
  'format',
  'test',
  'build',
  'type-check',
  'ci',
  'doctor',
  'clean',
  'version',
  'completion',
]

const SUBS: Record<string, string[]> = {
  completion: ['bash', 'zsh'],
  db: ['migrate', 'status', 'diff', 'seed', 'psql'],
  deps: ['check', 'sync', 'audit'],
  dev: ['up', 'down', 'tools', 'logs', 'reset'],
  env: ['render', 'validate', 'show'],
  new: ['app', 'package', 'adr', 'changeset', 'workflow', 'runbook'],
  release: ['changeset', 'version', 'publish'],
}

function bashScript(): string {
  return `# repo bash completion — source this from ~/.bashrc:
#   source <(repo completion bash)

_repo_completion() {
  local cur prev top="${TOP.join(' ')}"
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$top" -- "$cur") )
    return 0
  fi

  case "$prev" in
${Object.entries(SUBS)
  .map(([k, vs]) => `    ${k}) COMPREPLY=( $(compgen -W "${vs.join(' ')}" -- "$cur") ) ;;`)
  .join('\n')}
  esac
}

complete -F _repo_completion repo
`
}

function zshScript(): string {
  return `# repo zsh completion — source from ~/.zshrc:
#   source <(repo completion zsh)

_repo() {
  local -a top
  top=(${TOP.map((t) => `'${t}'`).join(' ')})
  if (( CURRENT == 2 )); then
    _describe 'command' top
    return
  fi
  case "\${words[2]}" in
${Object.entries(SUBS)
  .map(([k, vs]) => `    ${k}) _values 'subcommand' ${vs.map((v) => `'${v}'`).join(' ')} ;;`)
  .join('\n')}
  esac
}

compdef _repo repo
`
}

export const completionCommand = defineCommand({
  args: { shell: { description: 'bash | zsh', required: true, type: 'positional' } },
  meta: { description: 'Emit shell completion script (bash | zsh).', name: 'completion' },
  run({ args }) {
    const shell = String(args.shell)
    if (shell === 'bash') {
      if (isJsonMode())
        emit({ data: { script: bashScript() }, message: 'bash completion', status: 'ok' })
      else logRaw(bashScript())
      return
    }
    if (shell === 'zsh') {
      if (isJsonMode())
        emit({ data: { script: zshScript() }, message: 'zsh completion', status: 'ok' })
      else logRaw(zshScript())
      return
    }
    emit({ message: `Unknown shell: ${shell}. Use bash or zsh.`, status: 'error' })
    process.exit(1)
  },
})
