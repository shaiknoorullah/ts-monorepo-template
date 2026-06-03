import { execFileSync } from 'node:child_process'

export interface Endpoint {
  name: 'go-hello' | 'py-hello' | 'rs-hello'
  http: string
  grpc: string
  metrics: string
}

const base = process.env.SMOKE_BASE ?? 'svc.cluster.local:dev'
const [host, ns] = base.split(':')

export const endpoints: Endpoint[] = (['go-hello', 'py-hello', 'rs-hello'] as const).map(
  (name) => ({
    name,
    http: `http://${name}.${ns}.${host}:8080`,
    grpc: `http://${name}.${ns}.${host}:9000`,
    metrics: `http://${name}.${ns}.${host}:9090`,
  }),
)

// Test helper. PATH-resolved kubectl is the expected on-runner convention for
// smoke tests in this repo, and the input is a constant per-app name from the
// fixed `endpoints` table — not user-controlled — so the PATH-resolution
// warning is a false positive.
export async function fetchPodLogs(app: string): Promise<string> {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    return execFileSync('kubectl', ['-n', 'dev', 'logs', `deploy/${app}`, '--tail=200'], {
      encoding: 'utf8',
    })
  } catch {
    return ''
  }
}
