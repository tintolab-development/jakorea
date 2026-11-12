import { installIsolatedAuthRefreshRoutes } from '../e2e/helpers/isolated-auth-session'
import type { Page, Request, Route } from '@playwright/test'
import {
  mergeServiceDetailForProgramPatch,
  noteRootRegistrationOverlay,
} from './service-detail-overlay-merge'

// Mirrors the established FE region-capacity PUT contract without importing the Vite alias graph
// into the Node-only E2E tsconfig.
type UjatRegionCapacityUpsert = {
  semesterType: 'FIRST_HALF' | 'SECOND_HALF'
  educationRegionCode: string
  maxClassCount: number
  maxVolunteerCount: number
}

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
  createProgramResponse: Record<string, unknown> | null
  formVersionPuts: IsolatedCapturedMutation[]
  formVersionPublishes: IsolatedCapturedMutation[]
  formBindings: unknown[]
  typedDetailPuts: IsolatedCapturedMutation[]
  typedDetailPatches: IsolatedCapturedMutation[]
  programPatches: IsolatedCapturedMutation[]
  recruitmentPatches: IsolatedCapturedMutation[]
  physicalSchedulePuts: IsolatedCapturedMutation[]
  regionCapacityPuts: IsolatedCapturedMutation[]
  regionCapacityPutStatuses: number[]
  regionCapacityGetResponses: Array<{
    programId: string
    status: number
    rows: UjatRegionCapacityUpsert[]
  }>
  rootRegistrationOverlayHits: number
  /** `/api/admin/program-draft` 요청(어떤 메서드든) — 서버 draft 제거 후 0이어야 한다 */
  programDraftRequests: string[]
}

export type IsolatedUjatDetailSeed = {
  program: Record<string, unknown>
  typedDetail?: Record<string, unknown>
}

export type IsolatedRegistrationNetworkOptions = {
  failFirstRegionCapacityPut?: boolean
  seedProgram?: IsolatedUjatDetailSeed
}

function educationRegionRows() {
  return [
    {
      id: 1,
      code: 'SEOUL',
      nameKo: '서울',
      displayName: '서울',
      displayOrder: 1,
      activeYn: true,
    },
    {
      id: 2,
      code: 'GYEONGGI_SOUTH',
      nameKo: '경기남부',
      displayName: '경기남부',
      displayOrder: 2,
      activeYn: true,
    },
  ]
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

/** 격리 Mock 계약 fixture — 화면에서 실제 클릭으로 고를 라벨과 CREATE 직렬화 기대값 */
export const ISOLATED_GENERAL_FIXTURE = {
  sponsorId: String(SPONSOR_ID),
  sponsorName: '격리 후원사',
  contactId: String(CONTACT_ID),
  contactName: '격리 담당자',
  detailedProgramId: String(DETAILED_PROGRAM_ID),
  detailedProgramName: '격리 세부 프로그램',
  paymentItemName: '격리 강사 교통비',
} as const

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
    // SponsorContactResponse 계약: id·sponsorId string, primary boolean
    id: String(CONTACT_ID),
    sponsorId: String(SPONSOR_ID),
    primary: true,
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
    // DetailedProgramResponse 계약(generated schemas/detailedProgramResponse.ts): id number, nameKo/nameEn, useYn
    id: DETAILED_PROGRAM_ID,
    nameKo: '격리 세부 프로그램',
    nameEn: 'Isolated Detailed Program',
    useYn: true,
    inUse: true,
  }
}

function catalogPayload(templateCode: string, templateId: number, versionId: number) {
  return {
    templateId,
    templateVersionId: versionId,
    templateCode,
    templateScope: 'CATALOG',
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
  templateScope?: string
  ownerProgramId?: number
}) {
  return {
    templateId: args.templateId,
    templateVersionId: args.versionId,
    versionId: args.versionId,
    templateCode: args.templateCode,
    templateScope: args.templateScope ?? (args.status === 'PUBLISHED' ? 'PROGRAM' : 'CATALOG'),
    ownerProgramId: args.ownerProgramId,
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

function regionCapacityProgramId(pathname: string): string {
  const match = pathname.match(
    /^\/api\/admin\/program-execution\/programs\/([^/]+)\/ujat\/region-capacities$/
  )
  return match?.[1] ?? ''
}

function regionCapacityRowsFromBody(body: unknown): UjatRegionCapacityUpsert[] {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return []
  const rows = (body as { capacities?: unknown }).capacities
  if (!Array.isArray(rows)) return []
  return rows.filter(
    (row): row is UjatRegionCapacityUpsert =>
      row != null &&
      typeof row === 'object' &&
      !Array.isArray(row) &&
      typeof (row as { semesterType?: unknown }).semesterType === 'string' &&
      typeof (row as { educationRegionCode?: unknown }).educationRegionCode === 'string' &&
      typeof (row as { maxClassCount?: unknown }).maxClassCount === 'number' &&
      typeof (row as { maxVolunteerCount?: unknown }).maxVolunteerCount === 'number'
  )
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
  '/api/admin/sponsors',
  '/api/admin/detailed-programs',
  '/api/admin/form-templates',
  '/api/admin/form-templates/create-options',
  '/api/admin/notifications',
  '/api/admin/dashboard/notifications/count',
  '/api/admin/me/dashboard-preferences',
  '/api/admin/me/dashboard-shortcut-badges',
])

const ALLOWED_GET_PREFIXES = [
  '/api/admin/sponsors/',
  '/api/admin/form-templates/',
  '/api/admin/form-template-versions/',
  '/api/admin/programs/',
  '/api/admin/program-execution/',
  '/api/admin/detailed-programs/',
  '/api/admin/notifications/',
]

function isAllowedGet(pathname: string): boolean {
  if (pathname.startsWith('/api/admin/')) return true
  if (ALLOWED_GET_EXACT.has(pathname)) return true
  return ALLOWED_GET_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function adminAuthSessionStatus() {
  const nowMs = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString()
  return {
    sessionStartedAt: iso(nowMs - 60_000),
    lastUserActivityAt: iso(nowMs),
    serverNow: iso(nowMs),
    absoluteExpiresAt: iso(nowMs + 12 * 60 * 60 * 1000),
    idleExpiresAt: iso(nowMs + 30 * 60 * 1000),
    refreshIdleExpiresAt: iso(nowMs + 30 * 60 * 1000),
    idlePolicyEnforced: true,
  }
}

function adminAuthActivityStatus() {
  return {
    lastUserActivityAt: new Date().toISOString(),
    updated: true,
  }
}

function isAllowedMutation(method: string, pathname: string): boolean {
  if (method === 'POST' && pathname === '/api/admin/auth/activity') return true
  if (method === 'PUT' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) return true
  if (method === 'POST' && /^\/api\/admin\/form-template-versions\/\d+\/publish$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && /^\/api\/admin\/form-templates\/\d+\/versions(\/copy)?$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && pathname === '/api/admin/programs') return true
  if (method === 'POST' && /^\/api\/admin\/programs\/\d+\/form-bindings$/.test(pathname)) return true
  if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+\/form-bindings\/\d+$/.test(pathname)) return true
  if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) return true
  if (method === 'POST' && pathname.startsWith('/api/admin/files')) return true
  if (method === 'PUT' && pathname.includes('/ujat/typed-detail')) return true
  if (method === 'PATCH' && pathname.includes('/ujat/typed-detail')) return true
  if (method === 'PUT' && pathname.includes('/ujat/region-capacities')) return true
  if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) return true
  if (method === 'PUT' && /\/(thumbnail|attachments)$/.test(pathname)) return true
  if (method === 'PATCH' && /\/recruitments\/\d+$/.test(pathname)) return true
  if (method === 'POST' && /\/recruitments$/.test(pathname)) return true
  if (method === 'DELETE' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) return true
  if (method === 'DELETE' && pathname === '/api/admin/program-draft') return true
  return false
}

export async function installIsolatedRegistrationNetwork(
  page: Page,
  options: IsolatedRegistrationNetworkOptions = {}
): Promise<IsolatedNetworkLog> {
  const log: IsolatedNetworkLog = {
    api: [],
    mutations: [],
    continuedApi: [],
    blockedExternal: [],
    unexpected: [],
    createProgram: null,
    createProgramResponse: null,
    formVersionPuts: [],
    formVersionPublishes: [],
    formBindings: [],
    typedDetailPuts: [],
    typedDetailPatches: [],
    programPatches: [],
    recruitmentPatches: [],
    physicalSchedulePuts: [],
    regionCapacityPuts: [],
    regionCapacityPutStatuses: [],
    regionCapacityGetResponses: [],
    rootRegistrationOverlayHits: 0,
    programDraftRequests: [],
  }

  const copiedVersions = new Map<number, ReturnType<typeof versionResponse>>()
  let nextCopiedVersionId = 900001
  let createdProgram: Record<string, unknown> | null = options.seedProgram?.program
    ? { ...options.seedProgram.program }
    : null
  let typedDetail: Record<string, unknown> = {
    schemaVersion: 1,
    revision: 1,
    common: {},
    halfPlans: [],
    ...(options.seedProgram?.typedDetail ?? {}),
  }
  let failedFirstRegionCapacityPut = false
  const regionCapacityRowsByProgramId = new Map<string, UjatRegionCapacityUpsert[]>()
  let nextBindingId = 93001
  let programFormBindings: Record<string, unknown>[] = []

  function catalogBinding(
    templateCode: string,
    extras: {
      formType: string
      targetType: string
      targetRole: string
      targetScopeId: number
    }
  ) {
    const ids = idsFromTemplateCode(templateCode)
    nextBindingId += 1
    return {
      bindingId: nextBindingId,
      programId: Number(createdProgram?.id ?? 91001),
      formType: extras.formType,
      templateId: ids.templateId,
      templateVersionId: ids.versionId,
      templateName: templateCode,
      targetType: extras.targetType,
      targetRole: extras.targetRole,
      targetScope: 'RECRUITMENT',
      targetScopeId: extras.targetScopeId,
      active: true,
    }
  }

  await page.addInitScript(() => {
    void navigator.serviceWorker?.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        void registration.unregister()
      })
    })
    // QA-0137: access token은 메모리 전용 — refresh token만 넣고 복원 refresh는 mock이 답한다
    localStorage.setItem('auth_refresh_token', 'e2e.mock.refresh')
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

    // 서버 program-draft는 모든 유형에서 제거됨 — 어떤 메서드든 회귀로 기록하고 차단한다.
    if (pathname === '/api/admin/program-draft') {
      log.programDraftRequests.push(method)
      await route.fulfill(json({ success: false }, 410))
      return
    }

    if (method === 'GET' && pathname === '/api/admin/auth/session') {
      await route.fulfill(json(adminAuthSessionStatus()))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/me') {
      await route.fulfill(json(adminMe()))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/dashboard/notifications/count') {
      await route.fulfill(json({ count: 0, unreadCount: 0 }))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/programs') {
      await route.fulfill(json(emptyPage(createdProgram ? [createdProgram] : [])))
      return
    }
    if (method === 'GET' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
      await route.fulfill(
        json(createdProgram ?? { id: Number(pathname.split('/').at(-1)), title: '격리 등록 프로그램' })
      )
      return
    }
    if (method === 'GET' && /^\/api\/admin\/programs\/\d+\/sponsors$/.test(pathname)) {
      await route.fulfill(
        json([
          {
            id: '1',
            sponsorId: String(SPONSOR_ID),
            sponsorName: '격리 후원사',
            sponsorContactId: String(CONTACT_ID),
            sponsorContactName: '격리 담당자',
            sponsorContacts: [
              {
                sponsorContactId: String(CONTACT_ID),
                sponsorContactName: '격리 담당자',
                displayOrder: 1,
              },
            ],
            displayOrder: 1,
          },
        ])
      )
      return
    }
    if (method === 'GET' && /^\/api\/admin\/programs\/\d+\/navigation$/.test(pathname)) {
      const programId = Number(pathname.split('/')[4])
      const programType = String(createdProgram?.programType ?? 'UJAT')
      await route.fulfill(
        json({
          programId,
          rawProgramType: programType,
          canonicalProgramType: programType,
          allowedApplicationTargets: ['ORGANIZATION', 'VOLUNTEER'],
          disabledApplicationTargets: [],
        })
      )
      return
    }
    if (method === 'GET' && pathname.includes('/ujat/typed-detail')) {
      await route.fulfill(json(typedDetail))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/ujat/education-regions') {
      await route.fulfill(json(emptyPage(educationRegionRows())))
      return
    }
    if (method === 'GET' && /^\/api\/admin\/programs\/\d+\/form-bindings$/.test(pathname)) {
      await route.fulfill(json(programFormBindings))
      return
    }
    if (method === 'GET' && pathname.includes('/ujat/region-capacities')) {
      const programId = regionCapacityProgramId(pathname)
      const rows = regionCapacityRowsByProgramId.get(programId) ?? []
      log.regionCapacityGetResponses.push({
        programId,
        status: 200,
        rows: rows.map(row => ({ ...row })),
      })
      await route.fulfill(json({ capacities: rows }))
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
    // 지급항목 카탈로그(정산 설정) — 앱이 등록 위저드 진입 시 읽는다. 빈 설정으로 응답한다.
    if (method === 'GET' && pathname === '/api/admin/settlement-configs/current') {
      // 일반 등록 필수 「지급 항목」(registration-required-fields.ts:265-269) 선택용 — PaymentItemResponse 계약 fixture 1건
      await route.fulfill(
        json({
          configId: 163200,
          useYn: true,
          wageItems: [],
          paymentItems: [
            {
              id: 163201,
              paymentItemType: 'TRANSPORT_INSTRUCTOR',
              itemName: ISOLATED_GENERAL_FIXTURE.paymentItemName,
              maxAmount: 50000,
              taxableYn: false,
              evidenceRequiredYn: false,
              useYn: true,
            },
          ],
          deductionItems: [],
        })
      )
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
    if (method === 'GET' && pathname === '/api/admin/applications/counts') {
      // 계약: ApplicationCountResponse[] (application-counts-api-client.ts:26). 신규 프로그램은 신청 0건.
      await route.fulfill(json([]))
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

      if (method === 'POST' && pathname === '/api/admin/auth/activity') {
        await route.fulfill(json(adminAuthActivityStatus()))
        return
      }
      if (method === 'POST' && pathname.endsWith('/versions/copy')) {
        const templateId = Number(pathname.split('/')[4])
        const versionId = nextCopiedVersionId
        nextCopiedVersionId += 1
        const copied = versionResponse({
          templateId,
          versionId,
          status: 'DRAFT',
          templateScope: 'PROGRAM',
          ownerProgramId: Number(createdProgram?.id ?? 91001),
        })
        copiedVersions.set(versionId, copied)
        await route.fulfill(json(copied))
        return
      }
      if (method === 'POST' && /\/form-templates\/\d+\/versions$/.test(pathname)) {
        const templateId = Number(pathname.split('/')[4])
        const versionId = nextCopiedVersionId
        nextCopiedVersionId += 1
        const created = versionResponse({
          templateId,
          versionId,
          status: 'DRAFT',
          templateScope: 'PROGRAM',
          ownerProgramId: Number(createdProgram?.id ?? 91001),
        })
        copiedVersions.set(versionId, created)
        await route.fulfill(json(created))
        return
      }
      if (method === 'PUT' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) {
        log.formVersionPuts.push(mutation)
        const versionId = Number(pathname.split('/').at(-1))
        const existing = copiedVersions.get(versionId)
        const body = mutation.body as Record<string, unknown> | null
        let overlay: Record<string, unknown> = {}
        const extensionJson = body?.extensionJson
        if (typeof extensionJson === 'string') {
          try {
            const parsed = JSON.parse(extensionJson) as { overlay?: Record<string, unknown> }
            overlay = parsed.overlay ?? {}
          } catch {
            overlay = {}
          }
        } else if (body?.overlay && typeof body.overlay === 'object') {
          overlay = body.overlay as Record<string, unknown>
        }
        const saved = versionResponse({
          templateId: Number(existing?.templateId ?? 800000),
          versionId,
          templateCode: existing?.templateCode,
          status: 'DRAFT',
          overlay,
        })
        copiedVersions.set(versionId, saved)
        await route.fulfill(json(saved))
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
        const body = mutation.body as {
          title?: string
          formBindings?: unknown[]
          programType?: string
        } | null
        noteRootRegistrationOverlay(log, mutation.body)
        if (Array.isArray(body?.formBindings)) {
          log.formBindings = body.formBindings
        }
        const incomingRecruitments = Array.isArray(
          (body as { recruitments?: unknown })?.recruitments
        )
          ? ((body as { recruitments: Array<Record<string, unknown>> }).recruitments)
          : []
        const recruitments = incomingRecruitments.map((row, index) => ({
          ...row,
          id: typeof row.id === 'number' ? row.id : 92001 + index,
        }))
        createdProgram = {
          id: 91001,
          title: body?.title ?? '격리 등록 프로그램',
          programType: body?.programType ?? 'GENERAL',
          status: 'PENDING',
          lifecycleStatus: 'RECRUITING_STUDENTS',
          recruitments,
        }
        const participantId = Number(
          recruitments.find(row => row.recruitmentType === 'PARTICIPANT')?.id ?? 92001
        )
        const volunteerIds = recruitments
          .filter(row => row.recruitmentType === 'VOLUNTEER')
          .map(row => Number(row.id))
        programFormBindings = [
          catalogBinding('recruitment-ujat-school', {
            formType: 'RECRUITMENT',
            targetType: 'ORGANIZATION',
            targetRole: 'ORGANIZATION',
            targetScopeId: participantId,
          }),
          ...volunteerIds.map(id =>
            catalogBinding('recruitment-ujat-volunteer', {
              formType: 'RECRUITMENT',
              targetType: 'VOLUNTEER',
              targetRole: 'VOLUNTEER',
              targetScopeId: id,
            })
          ),
          catalogBinding('application-ujat-school', {
            formType: 'APPLICATION',
            targetType: 'ORGANIZATION',
            targetRole: 'ORGANIZATION',
            targetScopeId: participantId,
          }),
        ]
        log.createProgramResponse = createdProgram
        await route.fulfill(json(createdProgram))
        return
      }
      if (
        (method === 'PUT' || method === 'PATCH') &&
        pathname.includes('/ujat/typed-detail')
      ) {
        if (pathname.endsWith('/schedules')) {
          log.physicalSchedulePuts.push(mutation)
        } else if (method === 'PATCH') {
          log.typedDetailPatches.push(mutation)
        } else {
          log.typedDetailPuts.push(mutation)
        }
        const body =
          typeof mutation.body === 'object' && mutation.body != null
            ? (mutation.body as Record<string, unknown>)
            : {}
        const halfMatch = pathname.match(/\/ujat\/typed-detail\/halves\/([^/]+)(?:\/|$)/)
        const halfPlan =
          body.halfPlan && typeof body.halfPlan === 'object'
            ? (body.halfPlan as Record<string, unknown>)
            : null
        const prevPlans = Array.isArray(typedDetail.halfPlans)
          ? (typedDetail.halfPlans as Array<Record<string, unknown>>)
          : []
        let nextPlans = Array.isArray(body.halfPlans)
          ? (body.halfPlans as Array<Record<string, unknown>>)
          : prevPlans
        if (halfMatch && halfPlan) {
          const semesterType = halfMatch[1]
          const nextPlan = { ...halfPlan, semesterType }
          const index = nextPlans.findIndex(item => item.semesterType === semesterType)
          nextPlans =
            index >= 0
              ? nextPlans.map((item, i) => (i === index ? nextPlan : item))
              : [...nextPlans, nextPlan]
        }
        typedDetail = {
          ...typedDetail,
          ...body,
          schemaVersion: 1,
          revision: Number(typedDetail.revision ?? 0) + 1,
          expectedUpdatedAt: new Date().toISOString(),
          common: body.common ?? typedDetail.common ?? {},
          halfPlans: nextPlans,
        }
        await route.fulfill(json(typedDetail))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
        log.programPatches.push(mutation)
        noteRootRegistrationOverlay(log, mutation.body)
        const patchBody =
          typeof mutation.body === 'object' && mutation.body != null
            ? (mutation.body as Record<string, unknown>)
            : {}
        const prev = createdProgram ?? { id: Number(pathname.split('/').at(-1)) }
        const { serviceDetailJson: incomingJson, ...rest } = patchBody
        createdProgram = {
          ...prev,
          ...rest,
          serviceDetailJson: mergeServiceDetailForProgramPatch(
            prev.serviceDetailJson,
            incomingJson
          ),
          updatedAt: new Date().toISOString(),
        }
        await route.fulfill(json(createdProgram))
        return
      }
      if (method === 'PATCH' && /\/recruitments\/\d+$/.test(pathname)) {
        log.recruitmentPatches.push(mutation)
        const recruitmentId = Number(pathname.split('/').at(-1))
        const patchBody =
          typeof mutation.body === 'object' && mutation.body != null
            ? (mutation.body as Record<string, unknown>)
            : {}
        if (createdProgram && Array.isArray(createdProgram.recruitments)) {
          createdProgram = {
            ...createdProgram,
            recruitments: createdProgram.recruitments.map(row =>
              row != null &&
              typeof row === 'object' &&
              Number((row as { id?: unknown }).id) === recruitmentId
                ? { ...(row as Record<string, unknown>), ...patchBody, id: recruitmentId }
                : row
            ),
          }
        }
        await route.fulfill(json({ id: recruitmentId, ...patchBody }))
        return
      }
      if (method === 'DELETE' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
        await route.fulfill(json({ success: true }))
        return
      }
      if (method === 'POST' && /\/recruitments$/.test(pathname)) {
        await route.fulfill(json({ id: 92001, ...(typeof mutation.body === 'object' ? mutation.body : {}) }))
        return
      }
      if (method === 'PUT' && pathname.includes('/ujat/region-capacities')) {
        log.regionCapacityPuts.push(mutation)
        if (options.failFirstRegionCapacityPut && !failedFirstRegionCapacityPut) {
          failedFirstRegionCapacityPut = true
          log.regionCapacityPutStatuses.push(500)
          await route.fulfill(json({ message: 'isolated region capacity failure' }, 500))
          return
        }
        const programId = regionCapacityProgramId(pathname)
        const rows = regionCapacityRowsFromBody(mutation.body)
        regionCapacityRowsByProgramId.set(
          programId,
          rows.map(row => ({ ...row }))
        )
        log.regionCapacityPutStatuses.push(200)
        await route.fulfill(json({ capacities: rows }))
        return
      }
      if (method === 'PATCH' && /\/form-bindings\/\d+$/.test(pathname)) {
        log.formBindings = [...log.formBindings, mutation.body]
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
        return
      }
      if (method === 'POST' && pathname.endsWith('/form-bindings')) {
        // 역할별 바인딩 POST가 여러 번 나가므로 누적한다(마지막 요청만 남던 캡처 결함 수정)
        log.formBindings = [
          ...log.formBindings,
          ...(Array.isArray(mutation.body) ? mutation.body : [mutation.body]),
        ]
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

  await installIsolatedAuthRefreshRoutes(page)
  return log
}

/** index.html이 로드하는 웹폰트 CSS(차단은 유지, API 누출이 아니므로 실패 사유에서만 제외) */
const BLOCKED_STATIC_FONT_ASSET =
  /^GET https:\/\/(fonts\.googleapis\.com\/css2?|fonts\.gstatic\.com\/|cdn\.jsdelivr\.net\/gh\/toss\/tossface\/)/

export function assertIsolatedNetwork(log: IsolatedNetworkLog) {
  const blockedNonFont = log.blockedExternal.filter(item => !BLOCKED_STATIC_FONT_ASSET.test(item))
  if (blockedNonFont.length > 0) {
    throw new Error(`외부 origin 요청이 차단됨: ${blockedNonFont.join(', ')}`)
  }
  if (log.continuedApi.length > 0) {
    throw new Error(`API continue 발생: ${log.continuedApi.join(', ')}`)
  }
  if (log.unexpected.length > 0) {
    throw new Error(`허용하지 않은 API: ${log.unexpected.join(', ')}`)
  }
  if (log.programDraftRequests.length > 0) {
    throw new Error(`program-draft 요청이 발생함: ${log.programDraftRequests.join(', ')}`)
  }
  if (log.createProgram != null) {
    const body = log.createProgram.body as Record<string, unknown> | null
    if (body != null && ('programDraftId' in body || 'formBindings' in body)) {
      throw new Error('CREATE에 programDraftId/formBindings가 실렸습니다')
    }
  }
}
