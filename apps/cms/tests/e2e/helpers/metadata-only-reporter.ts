import type { FullConfig, FullResult, Reporter, TestCase, TestResult, Suite, TestStep } from '@playwright/test/reporter'
import fs from 'node:fs'
import path from 'node:path'

/** Safe reports only: no raw errors, attachments, output chunks, DOM, URL, or annotations. */
export default class MetadataOnlyReporter implements Reporter {
  private results: object[] = []
  private outputDir = ''
  private suite?: Suite
  private seen = new Set<string>()
  private stepLocations = new Map<string, string[]>()
  onBegin(config: FullConfig, suite: Suite) { this.outputDir = config.projects[0].outputDir; this.suite = suite }
  onStepEnd(test: TestCase, _result: TestResult, step: TestStep) {
    if (!step.error || !step.location) return
    const file = path.basename(step.location.file)
    if (!/^(?:login\.page|auth\.setup|test|history-stack|history-navigation\.page|[a-z-]+\.spec)\.ts$/.test(file)) return
    const locations = this.stepLocations.get(test.id) ?? []
    locations.push(`${file}:${step.location.line}:${step.location.column}`)
    this.stepLocations.set(test.id, [...new Set(locations)])
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.seen.add(test.id)
    const notes = test.annotations.filter(note => note.type === 'note')
    const status = result.status === 'passed' && notes.length ? 'UNVERIFIED' : result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIP' : 'FAIL'
    const row = { file: path.basename(test.location.file), line: test.location.line, title: test.title, status, runnerStatus: result.status, durationMs: result.duration, noteCount: notes.length,
      errorLocations: [...new Set([...result.errors.map(error => error.message?.match(/source=([a-z.-]+\.ts:\d+:\d+)/)?.[1]).filter(Boolean), ...(this.stepLocations.get(test.id) ?? [])])],
      errorCategories: result.errors.map(error => error.message?.includes('HTTP_API_ERROR') ? 'HTTP_API_ERROR' : error.message?.includes('TIMEOUT') ? 'TIMEOUT' : 'ASSERTION_OR_RUNTIME_ERROR') }
    this.results.push(row)
    console.log(`[${status}] ${row.file}:${row.line} ${row.title}`)
  }
  onError() { console.error('[metadata-only] RUNNER_ERROR') }
  onEnd(result: FullResult) {
    for (const test of this.suite?.allTests() ?? []) {
      if (!this.seen.has(test.id)) this.results.push({ file: path.basename(test.location.file), line: test.location.line, title: test.title, status: 'NOT_RUN', runnerStatus: 'notRun', durationMs: 0, noteCount: 0, errorCategories: [] })
    }
    fs.mkdirSync(this.outputDir, { recursive: true })
    const counts = this.results.reduce<Record<string, number>>((acc, row) => { const key = (row as { status: string }).status; acc[key] = (acc[key] ?? 0) + 1; return acc }, {})
    fs.writeFileSync(path.join(this.outputDir, 'history-safe-summary.json'), JSON.stringify({ status: result.status, counts, tests: this.results }, null, 2))
    console.log(`[metadata-only] ${result.status} ${JSON.stringify(counts)}`)
  }
  printsToStdio() { return true }
}
