import { installIsolatedAuthRefreshRoutes } from '../e2e/helpers/isolated-auth-session'
import type { Page, Request, Route } from '@playwright/test'
import {
  createProgramApplicationFormTrainedTeachersDraft,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import {
  canonicalizeServiceDetailJson,
  mergeServiceDetailForProgramPatch,
  noteRootRegistrationOverlay,
} from '../e2e-isolated/service-detail-overlay-merge'

export type IsolatedCapturedMutation = {
  method: string
  path: string
  body: unknown
}

export type IsolatedNetworkLog = {
  api: Array<{ method: string; path: string }>
  mutations: IsolatedCapturedMutation[]
  blockedExternal: string[]
  unexpected: string[]
  createProgram: IsolatedCapturedMutation | null
  formVersionPuts: IsolatedCapturedMutation[]
  formVersionPublishes: IsolatedCapturedMutation[]
  formBindings: unknown[]
  portalDraftPuts: IsolatedCapturedMutation[]
  portalApplicationPosts: IsolatedCapturedMutation[]
  programPatches: IsolatedCapturedMutation[]
  infoDetailPatches: IsolatedCapturedMutation[]
  realMutations: number
  rootRegistrationOverlayHits: number
  /** `/api/admin/program-draft` 요청(어떤 메서드든) — 서버 draft 제거 후 0이어야 한다 */
  programDraftRequests: string[]
}

export type IsolatedFailMode = 'none' | 'put' | 'publish' | 'create' | 'portalPost' | 'infoDetail'

export type IsolatedTtSeed = {
  program: Record<string, unknown>
  infoDetail?: Record<string, unknown>
  sponsors?: Array<Record<string, unknown>>
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])
const STUBBED_EXTERNAL_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
])
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const PROGRAM_ID = 91011
const RECRUITMENT_ID = 92011
const BINDING_ID = 93011
const TEMPLATE_VERSION_ID = 94011

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
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
  return !url.pathname.startsWith('/api/')
}

function idsFromTemplateCode(templateCode: string) {
  let hash = 0
  for (const char of templateCode) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const templateId = 810000 + (Math.abs(hash) % 10000)
  return { templateId, versionId: templateId + 1000 }
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
  schemaJson?: string
}) {
  return {
    templateId: args.templateId,
    templateVersionId: args.versionId,
    versionId: args.versionId,
    templateCode: args.templateCode,
    versionNo: 1,
    versionStatus: args.status ?? 'DRAFT',
    schemaJson:
      args.schemaJson ??
      JSON.stringify({
        schemaVersion: 1,
        formSettings: { titleNumbering: 'none' },
        paragraphs: [],
      }),
    extensionJson: JSON.stringify({ overlay: args.overlay ?? {} }),
    settingsJson: JSON.stringify({}),
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

/** 격리 E2E에서 세션 경고 모달이 클릭을 가로채지 않도록 유휴·절대 만료를 충분히 남긴다. */
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

const PORTAL_SCHEDULE_OPTIONS = [
  {
    id: 'tt-sched-1',
    value: 'tt-sched-1',
    label: '2026년 4월 1일',
    date: '2026-04-01',
  },
  {
    id: 'tt-sched-2',
    value: 'tt-sched-2',
    label: '2026년 4월 8일',
    date: '2026-04-08',
  },
] as const

function fillPublishedThirdPartyRecipient(
  draft: ReturnType<typeof createProgramApplicationFormTrainedTeachersDraft>
) {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (
        paragraph.id !== PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent ||
        paragraph.variant !== 'horizontal_table'
      ) {
        return paragraph
      }
      const fieldDataRows = (paragraph.fieldDataRows ?? []).map((row, rowIndex) =>
        row.map((cell, columnIndex) =>
          rowIndex === 0 && columnIndex === 0 && 'value' in cell
            ? { ...cell, value: 'JA코리아' }
            : cell
        )
      )
      const dataRows = paragraph.dataRows.map((row, rowIndex) =>
        row.map((cell, columnIndex) => (rowIndex === 0 && columnIndex === 0 ? 'JA코리아' : cell))
      )
      return { ...paragraph, fieldDataRows, dataRows }
    }),
  }
}

function applicationSeedForm() {
  const draft = fillPublishedThirdPartyRecipient(createProgramApplicationFormTrainedTeachersDraft())
  return {
    ...draft,
    runtimeContext: {
      applicationType: 'ORGANIZATION',
      showEducationFormChoice: true,
      hiddenQuestionKeys: [],
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: ['2026년 4월 1일', '2026년 4월 8일'],
      scheduleInputMode: 'fixed_schedule_options',
      scheduleOptions: [...PORTAL_SCHEDULE_OPTIONS],
    },
  }
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

type IsolatedProgramStore = {
  program: Record<string, unknown> | null
  infoDetail: Record<string, unknown>
  sponsors: Array<Record<string, unknown>>
}

function emptyInfoDetail() {
  return {
    teacherTrainingEnabled: false,
    educationJournalEnabled: false,
    teacherTrainingScheduleName: '',
    configJson: JSON.stringify({ schemaVersion: 1, generalCommonInfo: {} }),
  }
}

function normalizeCourseDeliveredBy(raw: unknown): 'JA' | 'Jointly' | 'Partner' | undefined {
  const value = String(raw ?? '').trim()
  if (value === 'JA' || value.toUpperCase() === 'JA') return 'JA'
  if (value === 'Jointly' || value.toUpperCase() === 'JOINTLY') return 'Jointly'
  if (value === 'Partner' || value.toUpperCase() === 'PARTNER') return 'Partner'
  return undefined
}

function persistCreateBody(store: IsolatedProgramStore, body: Record<string, unknown>) {
  const service = parseJsonObject(body.serviceDetailJson)
  const nestedProgram = parseJsonObject(service.program)
  const common = parseJsonObject(nestedProgram.generalCommonInfo)
  const training = common.teacherTrainingEnabled === true
  const journal = common.educationJournalEnabled === true
  const registration = parseJsonObject(service.registration)
  const overlay = parseJsonObject(registration.overlay)
  const courseDeliveredBy =
    normalizeCourseDeliveredBy(body.courseDeliveredBy) ??
    normalizeCourseDeliveredBy(overlay['trainedTeachersRegistration.basicInfo.courseDeliveredBy'])
  if (courseDeliveredBy) {
    overlay['trainedTeachersRegistration.basicInfo.courseDeliveredBy'] = courseDeliveredBy
    service.registration = { ...registration, overlay }
    body = {
      ...body,
      courseDeliveredBy,
      serviceDetailJson: JSON.stringify(service),
    }
  }
  if (body.serviceDetailJson != null) {
    body = {
      ...body,
      serviceDetailJson: canonicalizeServiceDetailJson(body.serviceDetailJson),
    }
  }
  store.program = {
    ...body,
    id: PROGRAM_ID,
    programType: 'TRAINED_TEACHER',
    status: body.status ?? 'PENDING',
    lifecycleStatus: body.lifecycleStatus ?? 'RECRUITING_STUDENTS',
    periodStatus: 'RECRUITING',
    recruitments: [
      {
        id: RECRUITMENT_ID,
        recruitmentId: RECRUITMENT_ID,
        targetType: 'ORGANIZATION',
        status: 'OPEN',
      },
    ],
  }
  store.infoDetail = {
    teacherTrainingEnabled: training,
    educationJournalEnabled: journal,
    teacherTrainingScheduleName: training ? '교육 연수' : '',
    configJson: JSON.stringify({
      schemaVersion: 1,
      generalCommonInfo: {
        educationJournalEnabled: journal,
        teacherTrainingEnabled: training,
        teacherTrainingScheduleName: training ? '교육 연수' : '',
        curriculumSessions: common.curriculumSessions,
        scheduleDetails: common.scheduleDetails,
        educationScheduleLines: common.educationScheduleLines,
        educationScheduleMode: common.educationScheduleMode,
      },
    }),
    updatedAt: new Date().toISOString(),
  }
  const sponsors = Array.isArray(body.sponsors) ? body.sponsors : []
  store.sponsors = sponsors.map((item, index) => {
    const row = parseJsonObject(item)
    return {
      sponsorId: String(row.sponsorId ?? SPONSOR_ID),
      sponsorName: '격리 후원사',
      sponsorContactId:
        row.sponsorContactId != null ? String(row.sponsorContactId) : String(CONTACT_ID),
      sponsorContactName: '격리 담당자',
      displayOrder: index,
    }
  })
}

function persistProgramPatch(store: IsolatedProgramStore, body: Record<string, unknown>) {
  const prev = store.program ?? {}
  const next: Record<string, unknown> = {
    ...prev,
    ...body,
    id: PROGRAM_ID,
    programType: 'TRAINED_TEACHER',
  }
  if (body.serviceDetailJson != null) {
    next.serviceDetailJson = mergeServiceDetailForProgramPatch(
      prev.serviceDetailJson,
      body.serviceDetailJson
    )
  }
  store.program = next
}

function overlayInfoConfigJson(prevRaw: unknown, incomingRaw: unknown): string {
  const prev = parseJsonObject(prevRaw)
  const incoming = parseJsonObject(incomingRaw)
  const prevCommon = parseJsonObject(prev.generalCommonInfo)
  const nextCommon = parseJsonObject(incoming.generalCommonInfo)
  return JSON.stringify({
    ...prev,
    ...incoming,
    generalCommonInfo: { ...prevCommon, ...nextCommon },
  })
}

function persistInfoDetailPatch(store: IsolatedProgramStore, body: Record<string, unknown>) {
  store.infoDetail = {
    ...store.infoDetail,
    ...body,
    teacherTrainingEnabled:
      'teacherTrainingEnabled' in body
        ? body.teacherTrainingEnabled === true
        : store.infoDetail.teacherTrainingEnabled === true,
    educationJournalEnabled:
      'educationJournalEnabled' in body
        ? body.educationJournalEnabled === true
        : store.infoDetail.educationJournalEnabled === true,
    teacherTrainingScheduleName:
      typeof body.teacherTrainingScheduleName === 'string'
        ? body.teacherTrainingScheduleName
        : store.infoDetail.teacherTrainingScheduleName,
    configJson:
      typeof body.configJson === 'string'
        ? overlayInfoConfigJson(store.infoDetail.configJson, body.configJson)
        : store.infoDetail.configJson,
    updatedAt: new Date().toISOString(),
  }
}

function isAllowedGet(pathname: string): boolean {
  if (pathname === '/api/admin/me') return true
  if (pathname === '/api/admin/auth/session') return true
  if (pathname === '/api/admin/programs') return true
  if (pathname === '/api/admin/programs/overview-stages') return true
  if (pathname === '/api/admin/sponsors') return true
  if (pathname === '/api/admin/detailed-programs') return true
  if (pathname === '/api/admin/form-templates') return true
  if (pathname === '/api/admin/applications/counts') return true
  if (pathname === '/api/admin/form-templates/create-options') return true
  if (pathname === '/api/admin/notifications') return true
  if (pathname === '/api/admin/me/dashboard-preferences') return true
  if (pathname === '/api/admin/me/dashboard-shortcut-badges') return true
  if (pathname === '/api/portal/me') return true
  // QA-0137: 새로고침 복원 refresh 뒤 Platform이 세션 회원(auth/me)을 다시 읽는다
  if (pathname === '/api/portal/auth/me') return true
  if (pathname === '/api/portal/programs') return true
  if (pathname.startsWith('/api/admin/sponsors/')) return true
  if (pathname.startsWith('/api/admin/form-templates/')) return true
  if (pathname.startsWith('/api/admin/form-template-versions/')) return true
  if (pathname.startsWith('/api/admin/programs/')) return true
  if (pathname.startsWith('/api/admin/detailed-programs/')) return true
  if (pathname.startsWith('/api/admin/notifications/')) return true
  if (pathname.startsWith('/api/admin/dashboard')) return true
  if (pathname.startsWith('/api/admin/settlement-configs')) return true
  if (pathname.startsWith('/api/admin/files/')) return true
  if (pathname.startsWith('/api/admin/common-codes')) return true
  if (pathname.startsWith('/api/admin/codes')) return true
  if (pathname.startsWith('/api/portal/programs/')) return true
  if (pathname.startsWith('/api/portal/me/')) return true
  if (pathname.startsWith('/api/public/')) return true
  return false
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
  if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) return true
  if (
    (method === 'PUT' || method === 'POST') &&
    /^\/api\/admin\/programs\/\d+\/inline-images$/.test(pathname)
  ) {
    return true
  }
  if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+\/trained-teacher\/detail$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && pathname.startsWith('/api/admin/files')) return true
  if (method === 'PUT' && /\/api\/portal\/programs\/\d+\/applications\/draft$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && /\/api\/portal\/programs\/\d+\/applications$/.test(pathname)) return true
  return false
}

export async function installTtIsolatedNetwork(
  page: Page,
  options?: { failMode?: IsolatedFailMode; seed?: IsolatedTtSeed }
): Promise<IsolatedNetworkLog> {
  const failMode = options?.failMode ?? 'none'
  const log: IsolatedNetworkLog = {
    api: [],
    mutations: [],
    blockedExternal: [],
    unexpected: [],
    createProgram: null,
    formVersionPuts: [],
    formVersionPublishes: [],
    formBindings: [],
    portalDraftPuts: [],
    portalApplicationPosts: [],
    programPatches: [],
    infoDetailPatches: [],
    realMutations: 0,
    rootRegistrationOverlayHits: 0,
    programDraftRequests: [],
  }

  const copiedVersions = new Map<number, ReturnType<typeof versionResponse>>()
  const templateCodeByVersion = new Map<number, string>()
  let nextCopiedVersionId = 900101
  const defaultSeedSponsors = [
    {
      sponsorId: String(SPONSOR_ID),
      sponsorName: '격리 후원사',
      sponsorContactId: String(CONTACT_ID),
      sponsorContactName: '격리 담당자',
      displayOrder: 0,
    },
  ]
  const store: IsolatedProgramStore = {
    program: options?.seed?.program
      ? { ...options.seed.program, id: PROGRAM_ID, programType: 'TRAINED_TEACHER' }
      : null,
    infoDetail: options?.seed
      ? (options.seed.infoDetail ?? emptyInfoDetail())
      : emptyInfoDetail(),
    sponsors: options?.seed?.sponsors ?? (options?.seed?.program ? defaultSeedSponsors : []),
  }
  let createdBindings: unknown[] = []

  await page.addInitScript(() => {
    // QA-0137: access token은 메모리 전용 — refresh token만 넣고 복원 refresh는 mock이 답한다
    localStorage.setItem('auth_refresh_token', 'e2e.mock.refresh')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'isolated-tt-e2e-admin',
        email: 'isolated-tt-e2e-admin@jakorea.org',
        name: '격리 TT E2E 관리자',
        role: 'ADMIN',
        adminLevel: 'MASTER',
        roleCode: 'MASTER',
        isActive: true,
        programRoles: {},
      })
    )
    localStorage.setItem('platform_auth_refresh_token', 'e2e.mock.refresh')
    localStorage.setItem(
      'platform_auth_expires_at',
      new Date(Date.now() + 60 * 60 * 1000).toISOString()
    )
  })

  await page.route('**/*', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url
    const method = request.method()

    if (!LOCAL_HOSTS.has(url.hostname)) {
      log.blockedExternal.push(`${method} ${url.origin}${pathname}`)
      if (STUBBED_EXTERNAL_HOSTS.has(url.hostname)) {
        await route.fulfill({
          status: 200,
          contentType: pathname.endsWith('.css') || pathname.includes('css')
            ? 'text/css'
            : 'text/plain',
          body: '',
        })
        return
      }
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
      await route.fulfill(
        json({
          adminAccountId: 171611,
          email: 'isolated-tt-e2e-admin@jakorea.org',
          name: '격리 TT E2E 관리자',
          roleCode: 'MASTER',
          roleName: '마스터',
          status: 'ACTIVE',
          mfaRequired: false,
          permissionCodes: ['*'],
        })
      )
      return
    }
    if (
      method === 'GET' &&
      (pathname === '/api/portal/me' ||
        pathname === '/api/portal/me/profile' ||
        pathname === '/api/portal/auth/me')
    ) {
      await route.fulfill(
        json({
          memberId: 171701,
          email: 'isolated-tt-teacher@example.invalid',
          name: '격리 교사',
          phone: '010-1234-5678',
          memberType: 'TEACHER',
          teacher: true,
          teacherOrganization: {
            organizationId: 171801,
            organizationName: '격리 학교',
            address: '서울 중구',
            addressDetail: '격리로 1',
            affiliationStatus: 'ACTIVE',
            employmentStatus: 'EMPLOYED',
          },
        })
      )
      return
    }
    if (method === 'GET' && pathname === '/api/admin/programs') {
      await route.fulfill(
        json(
          emptyPage(
            store.program
              ? [
                  {
                    id: PROGRAM_ID,
                    title: store.program.title,
                    programType: 'TRAINED_TEACHER',
                    status: 'PENDING',
                    educationStructure: store.program.educationStructure,
                  },
                ]
              : []
          )
        )
      )
      return
    }
    if (method === 'GET' && pathname === '/api/admin/programs/overview-stages') {
      await route.fulfill(
        json({ total: store.program ? 1 : 0, scheduled: 0, inProgress: 0, completed: 0 })
      )
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
      await route.fulfill(
        json(
          emptyPage([
            {
              id: DETAILED_PROGRAM_ID,
              detailedProgramId: String(DETAILED_PROGRAM_ID),
              name: '격리 세부 프로그램',
              detailedProgramName: '격리 세부 프로그램',
              status: 'ACTIVE',
            },
          ])
        )
      )
      return
    }
    if (method === 'GET' && pathname === '/api/admin/applications/counts') {
      // ApplicationCountResponse[] — 신규·격리 프로그램은 신청 0건.
      await route.fulfill(json([]))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/form-templates') {
      await route.fulfill(json(emptyPage()))
      return
    }
    if (method === 'GET' && pathname.startsWith('/api/admin/form-templates/by-code/')) {
      const templateCode = decodeURIComponent(pathname.split('/by-code/')[1]?.split('/')[0] ?? '')
      const ids = idsFromTemplateCode(templateCode)
      templateCodeByVersion.set(ids.versionId, templateCode)
      await route.fulfill(json(catalogPayload(templateCode, ids.templateId, ids.versionId)))
      return
    }
    if (method === 'GET' && /^\/api\/admin\/form-template-versions\/\d+$/.test(pathname)) {
      const versionId = Number(pathname.split('/').at(-1))
      const copied = copiedVersions.get(versionId)
      await route.fulfill(json(copied ?? versionResponse({ templateId: 810000, versionId })))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${PROGRAM_ID}`) {
      await route.fulfill(
        json(
          store.program ?? {
            id: PROGRAM_ID,
            title: '격리 TT 프로그램',
            programType: 'TRAINED_TEACHER',
          }
        )
      )
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${PROGRAM_ID}/sponsors`) {
      await route.fulfill(json(store.sponsors))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${PROGRAM_ID}/trained-teacher/detail`) {
      await route.fulfill(json(store.program ? store.infoDetail : {}))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${PROGRAM_ID}/form-bindings`) {
      await route.fulfill(json(createdBindings))
      return
    }
    if (method === 'GET' && pathname === `/api/portal/programs/${PROGRAM_ID}`) {
      await route.fulfill(
        json({
          programId: PROGRAM_ID,
          title: store.program?.title ?? '격리 TT 프로그램',
          programType: 'TRAINED_TEACHER',
          portalCategories: ['ORGANIZATION'],
          recruitmentStatus: 'OPEN',
          periodStatus: 'RECRUITING',
          applicationTargetMode: 'ORGANIZATION',
          educationStructure: 'curriculum',
          sessionRound: 'SINGLE',
          educationScheduleMode: 'date',
          educationScheduleLines: ['2026년 4월 1일', '2026년 4월 8일'],
          scheduleInputMode: 'fixed_schedule_options',
          scheduleOptions: [...PORTAL_SCHEDULE_OPTIONS],
          recruitments: [
            {
              recruitmentId: RECRUITMENT_ID,
              recruitmentType: 'PARTICIPANT',
              targetType: 'ORGANIZATION',
              status: 'OPEN',
              open: true,
              applicationTypes: ['ORGANIZATION'],
              startAt: '2026-01-01T00:00:00',
              endAt: '2026-12-31T23:59:59',
            },
          ],
        })
      )
      return
    }
    if (method === 'GET' && pathname === `/api/portal/programs/${PROGRAM_ID}/application-options`) {
      await route.fulfill(
        json([
          {
            recruitmentId: RECRUITMENT_ID,
            recruitmentType: 'PARTICIPANT',
            targetType: 'ORGANIZATION',
            applicationType: 'ORGANIZATION',
            formBindingId: BINDING_ID,
            formTemplateVersionId: TEMPLATE_VERSION_ID,
            startAt: '2026-01-01T00:00:00',
            endAt: '2026-12-31T23:59:59',
            canApply: true,
          },
        ])
      )
      return
    }
    if (
      method === 'GET' &&
      pathname === `/api/portal/programs/${PROGRAM_ID}/form-bindings/${BINDING_ID}`
    ) {
      await route.fulfill(
        json({
          programId: PROGRAM_ID,
          recruitmentId: RECRUITMENT_ID,
          applicationType: 'ORGANIZATION',
          formBindingId: BINDING_ID,
          templateVersionId: TEMPLATE_VERSION_ID,
          form: applicationSeedForm(),
          draftAnswers: null,
        })
      )
      return
    }
    if (method === 'GET' && isAllowedGet(pathname)) {
      if (pathname.includes('dashboard') || pathname.startsWith('/api/public/')) {
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
      if (failMode === 'put' && method === 'PUT' && pathname.includes('/form-template-versions/')) {
        log.formVersionPuts.push(mutation)
        await route.fulfill(json({ error: { code: 'PUT_FAILED', message: 'mock put fail' } }, 500))
        return
      }
      if (failMode === 'publish' && method === 'POST' && pathname.endsWith('/publish')) {
        log.formVersionPublishes.push(mutation)
        await route.fulfill(
          json({ error: { code: 'PUBLISH_FAILED', message: 'mock publish fail' } }, 500)
        )
        return
      }
      if (failMode === 'create' && method === 'POST' && pathname === '/api/admin/programs') {
        log.createProgram = mutation
        await route.fulfill(
          json({ error: { code: 'CREATE_FAILED', message: 'mock create fail' } }, 500)
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
          json(existing ?? versionResponse({ templateId: 810000, versionId, overlay: {} }))
        )
        return
      }
      if (method === 'POST' && pathname.endsWith('/publish')) {
        log.formVersionPublishes.push(mutation)
        const versionId = Number(pathname.split('/')[4])
        await route.fulfill(
          json(versionResponse({ templateId: 810000, versionId, status: 'PUBLISHED' }))
        )
        return
      }
      if (method === 'POST' && pathname === '/api/admin/programs') {
        log.createProgram = mutation
        const body = (mutation.body ?? {}) as Record<string, unknown>
        noteRootRegistrationOverlay(log, body)
        if (Array.isArray(body.formBindings)) {
          log.formBindings = body.formBindings
          createdBindings = body.formBindings
        }
        persistCreateBody(store, body)
        await route.fulfill(json(store.program))
        return
      }
      if (method === 'PATCH' && /\/form-bindings\/\d+$/.test(pathname)) {
        log.formBindings = [...log.formBindings, mutation.body]
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
        return
      }
      if (method === 'POST' && pathname.endsWith('/form-bindings')) {
        log.formBindings = Array.isArray(mutation.body) ? mutation.body : [mutation.body]
        createdBindings = log.formBindings
        await route.fulfill(json({ id: BINDING_ID }))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
        log.programPatches.push(mutation)
        const patchBody = (mutation.body ?? {}) as Record<string, unknown>
        noteRootRegistrationOverlay(log, patchBody)
        persistProgramPatch(store, patchBody)
        await route.fulfill(json(store.program))
        return
      }
      if (method === 'PATCH' && pathname.endsWith('/trained-teacher/detail')) {
        log.infoDetailPatches.push(mutation)
        if (failMode === 'infoDetail') {
          await route.fulfill(
            json({ error: { code: 'DETAIL_PATCH_FAILED', message: 'mock B fail' } }, 500)
          )
          return
        }
        persistInfoDetailPatch(store, (mutation.body ?? {}) as Record<string, unknown>)
        await route.fulfill(json(store.infoDetail))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) {
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
        return
      }
      if (method === 'POST' && pathname.startsWith('/api/admin/files')) {
        await route.fulfill(json({ fileObjectId: 71011, contentUrl: '/files/isolated-tt' }))
        return
      }
      if (
        (method === 'PUT' || method === 'POST') &&
        /\/programs\/\d+\/inline-images$/.test(pathname)
      ) {
        await route.fulfill(json({ bound: true }))
        return
      }
      if (method === 'PUT' && pathname.endsWith('/applications/draft')) {
        log.portalDraftPuts.push(mutation)
        await route.fulfill(json({ applicationId: 95011, status: 'DRAFT' }))
        return
      }
      if (method === 'POST' && /\/applications$/.test(pathname)) {
        log.portalApplicationPosts.push(mutation)
        if (failMode === 'portalPost') {
          await route.fulfill(
            json({ error: { code: 'CREATE_FAILED', message: 'mock portal post fail' } }, 500)
          )
          return
        }
        await route.fulfill(json({ applicationId: 95012, status: 'SUBMITTED' }))
        return
      }
    }

    log.unexpected.push(`${method} ${pathname}`)
    console.error(`[tt-isolated] unexpected ${method} ${pathname}`)
    await route.abort('blockedbyclient')
  })

  page.on('request', request => {
    const url = new URL(request.url())
    if (!LOCAL_HOSTS.has(url.hostname) && url.protocol.startsWith('http')) {
      log.blockedExternal.push(`${request.method()} ${url.origin}${url.pathname}`)
    }
  })

  await installIsolatedAuthRefreshRoutes(page)
  return log
}

export function assertIsolatedNetwork(log: IsolatedNetworkLog) {
  if (log.unexpected.length > 0) {
    throw new Error(`허용하지 않은 API: ${log.unexpected.join(', ')}`)
  }
  if (log.realMutations !== 0) {
    throw new Error(`실제 네트워크 mutation 발생: ${log.realMutations}`)
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

export function overlayFromFormVersionPut(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') return {}
  const extensionJson = (body as { extensionJson?: unknown }).extensionJson
  if (typeof extensionJson !== 'string' || extensionJson.trim() === '') return {}
  try {
    const parsed = JSON.parse(extensionJson) as { overlay?: Record<string, unknown> }
    return parsed.overlay ?? {}
  } catch {
    return {}
  }
}

export function schemaFromFormVersionPut(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') return {}
  const schemaJson = (body as { schemaJson?: unknown }).schemaJson
  if (typeof schemaJson !== 'string' || schemaJson.trim() === '') return {}
  try {
    return JSON.parse(schemaJson) as Record<string, unknown>
  } catch {
    return {}
  }
}

export const TT_ISOLATED_IDS = {
  PROGRAM_ID,
  RECRUITMENT_ID,
  BINDING_ID,
  TEMPLATE_VERSION_ID,
}
