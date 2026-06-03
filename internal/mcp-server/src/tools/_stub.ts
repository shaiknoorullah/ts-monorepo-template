export interface StubResponse {
  status: 'not_yet_implemented'
  tracking_issue: string
  expected_milestone: 'v0.2' | 'v0.3'
  schema_stable: true
}

export function stub(issueNumber: number, milestone: 'v0.2' | 'v0.3' = 'v0.2'): StubResponse {
  return {
    status: 'not_yet_implemented',
    tracking_issue: `https://github.com/ts-monorepo-template/platform/issues/${issueNumber}`,
    expected_milestone: milestone,
    schema_stable: true,
  }
}
