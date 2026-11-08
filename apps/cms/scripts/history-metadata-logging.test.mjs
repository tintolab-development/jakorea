import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { installApiErrorCapture, dumpE2eErrorLogs } from '../tests/e2e/helpers/attach-e2e-error-logs'
import { installApiCallCapture, dumpE2eTestLogs, recordE2eTestLogNotes } from '../tests/e2e/helpers/attach-e2e-test-logs'
import { metadataOnlyLogging, captureContextPages, sanitizeTestErrors } from '../tests/e2e/helpers/metadata-only-logging'

const canary = 'SYNTHETIC_PRIVATE_CANARY'
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('opt-in metadata-only logging', () => {
  it('OFF is the default and only exact 1 enables it', () => {
    vi.stubEnv('E2E_LOG_METADATA_ONLY', '')
    expect(metadataOnlyLogging()).toBe(false)
    vi.stubEnv('E2E_LOG_METADATA_ONLY', 'true')
    expect(metadataOnlyLogging()).toBe(false)
  })
  it('context capture includes new tabs exactly once and disposes listeners', () => {
    vi.stubEnv('E2E_LOG_METADATA_ONLY', '1')
    const context = new EventEmitter()
    const first = { context: () => context }
    const second = { context: () => context }
    context.pages = () => [first]
    const dispose = vi.fn()
    const install = vi.fn(() => ({ dispose }))
    const group = captureContextPages(first, install)
    context.emit('page', first)
    context.emit('page', second)
    context.emit('page', second)
    expect(install).toHaveBeenCalledTimes(2)
    expect(group.captures).toHaveLength(2)
    group.dispose()
    expect(dispose).toHaveBeenCalledTimes(2)
    expect(context.listenerCount('page')).toBe(0)
  })
  it('failure sanitization keeps errors but removes canary DOM/error context', () => {
    vi.stubEnv('E2E_LOG_METADATA_ONLY', '1')
    const info = { errors: [{ message: `expect(locator).toBeVisible() ${canary}`, stack: `at action (/safe/tests/e2e/pages/login.page.ts:26:11) ${canary}`, snippet: canary, value: canary, errorContext: canary }] }
    sanitizeTestErrors(info)
    expect(info.errors).toHaveLength(1)
    expect(JSON.stringify(info)).not.toContain(canary)
    expect(info.errors[0].message).toContain('toBeVisible')
    expect(info.errors[0].message).toContain('source=login.page.ts:26:11')
    sanitizeTestErrors(info)
    expect(info.errors[0].message).toContain('source=login.page.ts:26:11')
  })
  it('GET/POST/error/non-JSON: no text/postData; exports no raw values; no storage/DEV access', async () => {
    vi.stubEnv('E2E_LOG_METADATA_ONLY', '1')
    const page = new EventEmitter()
    page.evaluate = vi.fn(() => { throw new Error(canary) })
    page.goto = vi.fn(() => { throw new Error(canary) })
    const fetch = vi.fn(() => { throw new Error(canary) })
    vi.stubGlobal('fetch', fetch)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errorCapture = installApiErrorCapture(page)
    const callCapture = installApiCallCapture(page)
    const text = vi.fn(async () => `not-json ${canary}`)
    const postData = vi.fn(() => canary)
    for (const [method, status] of [['GET', 200], ['POST', 201], ['GET', 400], ['POST', 500]]) {
      page.emit('response', { status: () => status, url: () => `https://qa.test/api/${canary}?secret=${canary}`, text,
        request: () => ({ method: () => method, postData }) })
    }
    const calls = await callCapture.getCalls()
    const errors = await errorCapture.getErrors()
    expect(calls).toHaveLength(4)
    expect(errors.map(e => e.errorCode)).toEqual(['HTTP_400', 'HTTP_500'])
    expect(calls.filter(c => c.isError)).toHaveLength(2)
    expect(text).not.toHaveBeenCalled()
    expect(postData).not.toHaveBeenCalled()
    const exported = []
    const testInfo = { title: canary, titlePath: [canary], errors: [{ message: canary }], status: 'failed',
      project: { name: canary, use: { baseURL: `https://${canary}.test` } },
      attach: vi.fn(async (_name, data) => exported.push(data.body)) }
    // Malicious existing objects cannot be exported through safe dump branches either.
    const polluted = errors.map(e => ({ ...e, url: canary, message: canary, traceId: canary, responseBodyPreview: canary }))
    await dumpE2eErrorLogs({ page, testInfo, captured: polluted })
    await dumpE2eTestLogs({ testInfo, calls: calls.map(c => ({ ...c, requestPayload: canary, responsePreview: canary })), startedAtIso: canary })
    await recordE2eTestLogNotes({ page, title: canary, notes: [{ phase: canary, message: canary, detail: canary }] })
    expect(JSON.stringify(exported)).not.toContain(canary)
    expect(JSON.stringify(exported)).toContain('HTTP_400')
    expect(testInfo.attach).toHaveBeenCalledTimes(2)
    expect(page.evaluate).not.toHaveBeenCalled()
    expect(page.goto).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    errorCapture.dispose(); callCapture.dispose()
    expect(page.listenerCount('response')).toBe(0)
  })
})
