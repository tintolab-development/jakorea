import type { Page, Request, Route } from '@playwright/test'

export type IsolatedCapturedMutation = {
  method: string
  path: string
  body: unknown
}

export type IsolatedNetworkLog = {
  api: Array<{ method: string; path: string }>
  mutations: IsolatedCapturedMutation[]
  continuedApi: string[]
  blockedExternal: string[]
  unexpected: string[]
  createProgram: IsolatedCapturedMutation | null
  formVersionPuts: IsolatedCapturedMutation[]
  formVersionPublishes: IsolatedCapturedMutation[]
  formBindings: unknown[]
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  }
}

function adminMe() {
  return {
    adminAccountId: 171601,
    email: 'isolated-e2e-admin@jakorea.org',
    name: '격리 E2E 관리자',
    roleCode: 'MASTER',
    roleName: '마스터',
    status: 'ACTIVE',
    mfaRequired: false,
    permissionCodes: ['*'],
  }
}

function emptyPage<T>(items: T[] = []) {
  return {
    content: items,
    items,
    page: 0,
    size: 20,
    totalElements: items.length,
    totalPages: 1,
  }
}

const SPONSOR_ID = 163001
const CONTACT_ID = 163101
const DETAILED_PROGRAM_ID = 163006

function sponsorRow() {
  return {
    id: SPONSOR_ID,
    sponsorId: String(SPONSOR_ID),
    sponsorName: '격리 후원사',
    name: '격리 후원사',
    status: 'ACTIVE',
  }
}

function contactRow() {
  return {
    id: CONTACT_ID,
    sponsorContactId: String(CONTACT_ID),
    name: '격리 담당자',
    contactName: '격리 담당자',
    position: '담당',
    phone: '02-000-0000',
    email: 'sponsor@example.invalid',
  }
}

function detailedProgramRow() {
  return {
    id: DETAILED_PROGRAM_ID,
    detailedProgramId: String(DETAILED_PROGRAM_ID),
    name: '격리 세부 프로그램',
    detailedProgramName: '격리 세부 프로그램',
    status: 'ACTIVE',
  }
}

function catalogPayload(templateCode: string, templateId: number, versionId: number) {
  return {
    templateId,
    templateVersionId: versionId,
    templateCode,
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    schemaJson: JSON.stringify({
      schemaVersion: 1,
      formSettings: { titleNumbering: 'none' },
      paragraphs: [],
    }),
    extensionJson: JSON.stringify({ overlay: {} }),
    settingsJson: JSON.stringify({}),
  }
}

function versionResponse(args: {
  templateId: number
  versionId: number
  templateCode?: string
  status?: string
  overlay?: Record<string, unknown>
}) {
  return {
    templateId: args.templateId,
    templateVersionId: args.versionId,
    versionId: args.versionId,
    templateCode: args.templateCode,
    versionNo: 1,
    versionStatus: args.status ?? 'DRAFT',
    schemaJson: JSON.stringify({
      schemaVersion: 1,
      formSettings: { titleNumbering: 'none' },
      paragraphs: [],
    }),
    extensionJson: JSON.stringify({ overlay: args.overlay ?? {} }),
    settingsJson: JSON.stringify({}),
  }
}

function parseBody(request: Request): unknown {
  const raw = request.postData()
  if (raw == null || raw === '') return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

function isLocalAsset(url: URL): boolean {
  if (!LOCAL_HOSTS.has(url.hostname)) return false
  if (url.pathname.startsWith('/api/')) return false
  return true
}

function idsFromTemplateCode(templateCode: string) {
  let hash = 0
  for (const char of templateCode) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const templateId = 800000 + (Math.abs(hash) % 10000)
  return { templateId, versionId: templateId + 1000 }
}

const ALLOWED_GET_EXACT = new Set([
  '/api/admin/me',
  '/api/admin/programs',
  '/api/admin/program-draft',
  '/api/admin/sponsors',
  '/api/admin/detailed-programs',
  '/api/admin/form-templates',
  '/api/admin/form-templates/create-options',
  '/api/admin/notifications',
  '/api/admin/me/dashboard-preferences',
  '/api/admin/me/dashboard-shortcut-badges',
])

const ALLOWED_GET_PREFIXES = [
  '/api/admin/sponsors/',
  '/api/admin/form-templates/',
  '/api/admin/form-template-versions/',
  '/api/admin/programs/',
  '/api/admin/detailed-programs/',
  '/api/admin/notifications/',
]

function isAllowedGet(pathname: string): boolean {
  if (ALLOWED_GET_EXACT.has(pathname)) return true
  return ALLOWED_GET_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function isAllowedMutation(method: string, pathname: string): boolean {
  if (method === 'PUT' && pathname === '/api/admin/program-draft') return true
  if (method === 'PUT' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) return true
  if (method === 'POST' && /^\/api\/admin\/form-template-versions\/\d+\/publish$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && /^\/api\/admin\/form-templates\/\d+\/versions(\/copy)?$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && pathname === '/api/admin/programs') return true
  if (method === 'POST' && /^\/api\/admin\/programs\/\d+\/form-bindings$/.test(pathname)) return true
  if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) return true
  if (method === 'POST' && pathname.startsWith('/api/admin/files')) return true
  return false
}

export async function installIsolatedRegistrationNetwork(page: Page): Promise<IsolatedNetworkLog> {
  const log: IsolatedNetworkLog = {
    api: [],
    mutations: [],
    continuedApi: [],
    blockedExternal: [],
    unexpected: [],
    createProgram: null,
    formVersionPuts: [],
    formVersionPublishes: [],
    formBindings: [],
  }

  const copiedVersions = new Map<number, ReturnType<typeof versionResponse>>()
  let nextCopiedVersionId = 900001

  await page.addInitScript(() => {
    void navigator.serviceWorker?.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        void registration.unregister()
      })
    })
    localStorage.setItem('auth_token', 'e2e.mock.header.payload')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'isolated-e2e-admin',
        email: 'isolated-e2e-admin@jakorea.org',
        name: '격리 E2E 관리자',
        role: 'ADMIN',
        adminLevel: 'MASTER',
        roleCode: 'MASTER',
        isActive: true,
        programRoles: {},
      })
    )
  })

  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url
    const method = request.method()

    if (!LOCAL_HOSTS.has(url.hostname)) {
      log.blockedExternal.push(`${method} ${url.origin}${pathname}`)
      await route.abort('blockedbyclient')
      return
    }

    if (isLocalAsset(url) || pathname.startsWith('/__dev__/')) {
      await route.continue()
      return
    }

    if (!pathname.startsWith('/api/')) {
      await route.continue()
      return
    }

    log.api.push({ method, path: pathname })

    if (method === 'GET' && pathname === '/api/admin/me') {
      await route.fulfill(json(adminMe()))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/programs') {
      await route.fulfill(json(emptyPage()))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/program-draft') {
      await route.fulfill(json({ success: false }, 404))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/sponsors') {
      await route.fulfill(json(emptyPage([sponsorRow()])))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/sponsors/${SPONSOR_ID}/contacts`) {
      await route.fulfill(json(emptyPage([contactRow()])))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/sponsors/${SPONSOR_ID}`) {
      await route.fulfill(json({ ...sponsorRow(), contacts: [contactRow()] }))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/detailed-programs') {
      await route.fulfill(json(emptyPage([detailedProgramRow()])))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/form-templates') {
      await route.fulfill(json(emptyPage()))
      return
    }
    if (method === 'GET' && pathname.startsWith('/api/admin/form-templates/by-code/')) {
      const templateCode = decodeURIComponent(pathname.split('/by-code/')[1]?.split('/')[0] ?? '')
      const ids = idsFromTemplateCode(templateCode)
      await route.fulfill(json(catalogPayload(templateCode, ids.templateId, ids.versionId)))
      return
    }
    if (method === 'GET' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) {
      const versionId = Number(pathname.split('/').at(-1))
      const copied = copiedVersions.get(versionId)
      await route.fulfill(json(copied ?? versionResponse({ templateId: 800000, versionId })))
      return
    }
    if (method === 'GET' && isAllowedGet(pathname)) {
      if (pathname.includes('dashboard')) {
        await route.fulfill(json({}))
        return
      }
      if (pathname.includes('notifications')) {
        await route.fulfill(json(emptyPage()))
        return
      }
      await route.fulfill(json(emptyPage()))
      return
    }

    if (MUTATION_METHODS.has(method)) {
      const mutation: IsolatedCapturedMutation = {
        method,
        path: pathname,
        body: parseBody(request),
      }
      if (!isAllowedMutation(method, pathname)) {
        log.unexpected.push(`${method} ${pathname}`)
        await route.abort('blockedbyclient')
        return
      }
      log.mutations.push(mutation)

      if (method === 'PUT' && pathname === '/api/admin/program-draft') {
        await route.fulfill(
          json({
            draftId: 99001,
            programType: 'GENERAL',
            saved: true,
          })
        )
        return
      }
      if (method === 'POST' && pathname.endsWith('/versions/copy')) {
        const templateId = Number(pathname.split('/')[4])
        const versionId = nextCopiedVersionId
        nextCopiedVersionId += 1
        const copied = versionResponse({ templateId, versionId, status: 'DRAFT' })
        copiedVersions.set(versionId, copied)
        await route.fulfill(json(copied))
        return
      }
      if (method === 'POST' && /\/form-templates\/\d+\/versions$/.test(pathname)) {
        const templateId = Number(pathname.split('/')[4])
        const versionId = nextCopiedVersionId
        nextCopiedVersionId += 1
        const created = versionResponse({ templateId, versionId, status: 'DRAFT' })
        copiedVersions.set(versionId, created)
        await route.fulfill(json(created))
        return
      }
      if (method === 'PUT' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) {
        log.formVersionPuts.push(mutation)
        const versionId = Number(pathname.split('/').at(-1))
        const existing = copiedVersions.get(versionId)
        await route.fulfill(
          json(
            existing ??
              versionResponse({
                templateId: 800000,
                versionId,
                overlay: {},
              })
          )
        )
        return
      }
      if (method === 'POST' && pathname.endsWith('/publish')) {
        log.formVersionPublishes.push(mutation)
        const versionId = Number(pathname.split('/')[4])
        await route.fulfill(
          json(versionResponse({ templateId: 800000, versionId, status: 'PUBLISHED' }))
        )
        return
      }
      if (method === 'POST' && pathname === '/api/admin/programs') {
        log.createProgram = mutation
        const body = mutation.body as { title?: string; formBindings?: unknown[] } | null
        if (Array.isArray(body?.formBindings)) {
          log.formBindings = body.formBindings
        }
        await route.fulfill(
          json({
            id: 91001,
            title: body?.title ?? '격리 등록 프로그램',
            programType: 'GENERAL',
            status: 'PENDING',
            lifecycleStatus: 'RECRUITING_STUDENTS',
          })
        )
        return
      }
      if (method === 'POST' && pathname.endsWith('/form-bindings')) {
        log.formBindings = Array.isArray(mutation.body)
          ? mutation.body
          : [mutation.body]
        await route.fulfill(json({ id: 1 }))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) {
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
        return
      }
      if (method === 'POST' && pathname.startsWith('/api/admin/files')) {
        await route.fulfill(json({ fileObjectId: 'file-isolated-1' }))
        return
      }
    }

    log.unexpected.push(`${method} ${pathname}`)
    await route.abort('blockedbyclient')
  })

  page.on('request', request => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) return
    if (!LOCAL_HOSTS.has(url.hostname)) {
      log.blockedExternal.push(`${request.method()} ${url.origin}${url.pathname}`)
    }
  })

  return log
}

export function assertIsolatedNetwork(log: IsolatedNetworkLog) {
  if (log.blockedExternal.length > 0) {
    throw new Error(`외부 origin 요청이 차단됨: ${log.blockedExternal.join(', ')}`)
  }
  if (log.continuedApi.length > 0) {
    throw new Error(`API continue 발생: ${log.continuedApi.join(', ')}`)
  }
  if (log.unexpected.length > 0) {
    throw new Error(`허용하지 않은 API: ${log.unexpected.join(', ')}`)
  }
}
