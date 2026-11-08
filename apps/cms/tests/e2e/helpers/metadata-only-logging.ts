import type { Page, TestInfo } from '@playwright/test'

/** Opt-in. Never derive safe log fields from URLs, body, DOM, or error messages. */
export function metadataOnlyLogging(): boolean {
  return process.env.E2E_LOG_METADATA_ONLY === '1'
}
export function safeHttpMethod(method: string): string {
  const normalized = method.toUpperCase()
  return /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(normalized) ? normalized : 'OTHER'
}
export async function attachHttpMetadata(testInfo: TestInfo, kind: 'errors' | 'calls', rows: readonly { method: string; httpStatus: number }[]): Promise<void> {
  // No title, URL, exception, trace id, localStorage, filesystem store, or DEV sync.
  const items = rows.map(row => ({
    method: safeHttpMethod(row.method),
    httpStatus: row.httpStatus,
    category: 'api',
    ...(row.httpStatus >= 400 ? { errorCode: `HTTP_${row.httpStatus}` } : {}),
  }))
  await testInfo.attach(`e2e-http-${kind}-metadata.json`, {
    body: JSON.stringify({ count: items.length, errorCount: items.filter(row => row.httpStatus >= 400).length, items }),
    contentType: 'application/json',
  })
}

/** Same fixture, extended to discovery tabs only in opt-in safe mode. */
export function captureContextPages<T extends { dispose: () => void }>(page: Page, install: (page: Page) => T): { captures: T[]; dispose: () => void } {
  const captures: T[] = []
  const seen = new Set<Page>()
  const onPage = (other: Page) => {
    if (seen.has(other)) return
    seen.add(other)
    captures.push(install(other))
  }
  onPage(page)
  if (metadataOnlyLogging()) {
    page.context().pages().forEach(onPage)
    page.context().on('page', onPage)
  }
  return {
    captures,
    dispose: () => {
      page.context().off('page', onPage)
      captures.forEach(capture => capture.dispose())
    },
  }
}

/** Preserve failure status while removing potentially identifying matcher/DOM text. */
export function sanitizeTestErrors(testInfo: TestInfo): void {
  if (!metadataOnlyLogging()) return
  for (const error of testInfo.errors) {
    const text = error.message ?? ''
    const matcher = text.match(/(?:expect[^\n]*\.)?(to[A-Z][A-Za-z]+)/)?.[1]
    const kind = /HTTP API error count/.test(text) ? 'HTTP_API_ERROR' : /Timeout|timeout|timed out/i.test(text) ? 'TIMEOUT' : 'ASSERTION_OR_RUNTIME_ERROR'
    const source = (error.stack ?? '').match(/(?:[/\\])((?:login\.page|auth\.setup|history-stack|history-navigation\.page|[a-z-]+\.spec)\.ts):(\d+):(\d+)/) ?? text.match(/source=([a-z.-]+\.ts):(\d+):(\d+)/)
    const safe = `[metadata-only] ${kind}${matcher ? ` (${matcher})` : ''}${source ? ` source=${source[1]}:${source[2]}:${source[3]}` : ''}`
    error.message = safe
    error.stack = safe
    delete (error as typeof error & { snippet?: string }).snippet
    delete (error as typeof error & { value?: string }).value
    // aria snapshot matcher failures can otherwise create a DOM artifact.
    delete (error as typeof error & { errorContext?: string }).errorContext
  }
}
