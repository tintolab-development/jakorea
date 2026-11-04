import { Buffer } from 'node:buffer'
import type { Page, Request, Route } from '@playwright/test'
import {
  createProgramApplicationFormEconomyDraft,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
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

export type IsolatedFailMode =
  | 'none'
  | 'put'
  | 'publish'
  | 'create'
  | 'media'
  | 'bind'
  | 'uploadSlow'
  | 'portalPost'
  | 'portalDuplicate'

export type IsolatedNetworkLog = {
  api: Array<{ method: string; path: string }>
  mutations: IsolatedCapturedMutation[]
  blockedExternal: string[]
  unexpected: string[]
  createProgram: IsolatedCapturedMutation | null
  formVersionPuts: IsolatedCapturedMutation[]
  formVersionPublishes: IsolatedCapturedMutation[]
  formBindings: unknown[]
  programPatches: IsolatedCapturedMutation[]
  /** `/api/admin/program-draft` 요청(어떤 메서드든) — 서버 draft 제거 후 0이어야 한다 */
  programDraftPuts: IsolatedCapturedMutation[]
  filePosts: IsolatedCapturedMutation[]
  fileConfirms: IsolatedCapturedMutation[]
  s3Puts: IsolatedCapturedMutation[]
  thumbnailPuts: IsolatedCapturedMutation[]
  attachmentPuts: IsolatedCapturedMutation[]
  programDeletes: IsolatedCapturedMutation[]
  portalDraftPuts: IsolatedCapturedMutation[]
  portalApplicationPosts: IsolatedCapturedMutation[]
  publishedApplicationVersionId: number | null
  publishedApplicationFormSource: 'seed' | 'cms-put' | 'catalog'
  realMutations: number
  rootRegistrationOverlayHits: number
}

export type IsolatedNetworkOptions = {
  failMode?: IsolatedFailMode
  includeRecruitmentRow?: boolean
  portalDraftAnswers?: Record<string, unknown> | null
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])
const STUBBED_EXTERNAL_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
])
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const CS_ISOLATED_IDS = {
  PROGRAM_ID: 91021,
  RECRUITMENT_ID: 92021,
  BINDING_ID: 93021,
  TEMPLATE_VERSION_ID: 94021,
  SPONSOR_ID: 163001,
  CONTACT_ID: 163101,
  DETAILED_PROGRAM_ID: 163006,
  THUMB_FILE_ID: 77001,
  ATTACH_FILE_ID: 77002,
  PAYMENT_B: 166201,
  PAYMENT_B2: 166204,
  PAYMENT_STALE: 166199,
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (isRecord(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
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

function idsFromTemplateCode(templateCode: string) {
  let hash = 0
  for (const char of templateCode) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const templateId = 820000 + (Math.abs(hash) % 10000)
  return { templateId, versionId: templateId + 1000 }
}

function catalogSchemaForTemplate(templateCode: string) {
  if (templateCode.includes('application-economy')) {
    return fillPublishedThirdPartyRecipient(createProgramApplicationFormEconomyDraft())
  }
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs: [],
  }
}

function catalogPayload(templateCode: string, templateId: number, versionId: number) {
  return {
    templateId,
    templateVersionId: versionId,
    templateCode,
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    schemaJson: JSON.stringify(catalogSchemaForTemplate(templateCode)),
    extensionJson: JSON.stringify({ overlay: {} }),
    settingsJson: JSON.stringify({}),
  }
}

const ISOLATED_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

function fileObjectPayload(args: {
  fileObjectId: number
  originalFileName?: string
  contentType?: string
  origin: string
}) {
  return {
    fileObjectId: args.fileObjectId,
    id: args.fileObjectId,
    ownerType: 'PROGRAM',
    ownerDomain: 'PROGRAM_CONTENT',
    originalFileName: args.originalFileName ?? `isolated-${args.fileObjectId}.png`,
    contentType: args.contentType ?? 'image/png',
    fileSize: 80,
    scanStatus: 'CLEAN',
    uploadStatus: 'AVAILABLE',
    contentUrl: `${args.origin}/api/admin/files/downloads/raw/${args.fileObjectId}`,
  }
}

function parseSchemaDocument(raw: unknown): Record<string, unknown> | null {
  if (isRecord(raw) && Array.isArray(raw.paragraphs)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isRecord(parsed) && Array.isArray(parsed.paragraphs) ? parsed : null
  } catch {
    return null
  }
}

function schemaHasEconomyParagraphs(schema: Record<string, unknown> | null): boolean {
  if (schema == null) return false
  const paragraphs = schema.paragraphs
  if (!Array.isArray(paragraphs)) return false
  return paragraphs.some(item => {
    if (!isRecord(item) || typeof item.id !== 'string') return false
    return item.id.includes('program-application-economy-seed')
  })
}

function bindingNumeric(value: unknown, key: string): number | null {
  if (!Array.isArray(value)) return null
  for (const item of value) {
    if (!isRecord(item)) continue
    const raw = item[key]
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
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

function sponsorRow() {
  return {
    id: CS_ISOLATED_IDS.SPONSOR_ID,
    sponsorId: String(CS_ISOLATED_IDS.SPONSOR_ID),
    sponsorName: 'RHF-B-후원사',
    name: 'RHF-B-후원사',
    nameKo: 'RHF-B-후원사',
    status: 'ACTIVE',
    useYn: true,
  }
}

function contactRow() {
  return {
    id: String(CS_ISOLATED_IDS.CONTACT_ID),
    sponsorContactId: String(CS_ISOLATED_IDS.CONTACT_ID),
    name: 'RHF-B-담당자',
    contactName: 'RHF-B-담당자',
    position: '담당',
    phone: '02-000-0000',
    mobilePhone: '02-000-0000',
    email: 'sponsor-b@example.invalid',
    primary: true,
  }
}

function settlementCurrentConfig() {
  return {
    wageItems: [],
    paymentItems: [
      {
        id: CS_ISOLATED_IDS.PAYMENT_B,
        itemName: '강사 교통비 (RHF-B)',
        paymentItemType: 'TRANSPORT_INSTRUCTOR',
        useYn: true,
      },
      {
        id: CS_ISOLATED_IDS.PAYMENT_B2,
        itemName: '숙박비 (1사1교) RHF-B',
        paymentItemType: 'LODGING_1C1S',
        useYn: true,
      },
      {
        id: CS_ISOLATED_IDS.PAYMENT_STALE,
        itemName: '구 Overlay-A 지급항목',
        paymentItemType: 'MEAL',
        useYn: true,
      },
    ],
    deductionItems: [],
  }
}

function fillPublishedThirdPartyRecipient(
  draft: ReturnType<typeof createProgramApplicationFormEconomyDraft>
) {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (
        paragraph.id !== PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent ||
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
  const draft = fillPublishedThirdPartyRecipient(createProgramApplicationFormEconomyDraft())
  return {
    ...draft,
    runtimeContext: {
      applicationType: 'ORGANIZATION',
      showEducationFormChoice: true,
      hiddenQuestionKeys: [],
      educationStructure: 'curriculum',
      sessionRound: 'single',
    },
  }
}

type IsolatedProgramStore = {
  program: Record<string, unknown> | null
  sponsors: Array<Record<string, unknown>>
  includeRecruitmentRow: boolean
}

function persistCreateBody(store: IsolatedProgramStore, body: Record<string, unknown>) {
  if (body.serviceDetailJson != null) {
    body = {
      ...body,
      serviceDetailJson: canonicalizeServiceDetailJson(body.serviceDetailJson),
    }
  }
  store.program = {
    ...body,
    id: CS_ISOLATED_IDS.PROGRAM_ID,
    programType: 'COMPANY_SCHOOL',
    status: body.status ?? 'PENDING',
    lifecycleStatus: body.lifecycleStatus ?? 'RECRUITING_STUDENTS',
    periodStatus: 'RECRUITING',
    recruitments: store.includeRecruitmentRow
      ? [
          {
            id: CS_ISOLATED_IDS.RECRUITMENT_ID,
            recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
            recruitmentType: 'PARTICIPANT',
            targetType: 'ORGANIZATION',
            applicationType: 'ORGANIZATION',
            status: 'OPEN',
            startAt: '2026-02-01T00:00:00',
            endAt: '2026-02-28T23:59:59',
            operationStartDate: '2026-05-01',
            operationEndDate: '2026-11-30',
          },
        ]
      : [],
    ...(store.includeRecruitmentRow
      ? {
          applicationStartDate: '2026-02-01T00:00:00',
          applicationEndDate: '2026-02-28T23:59:59',
        }
      : {}),
  }
  const sponsors = Array.isArray(body.sponsors) ? body.sponsors : []
  store.sponsors = sponsors.map((item, index) => {
    const row = parseJsonObject(item)
    return {
      sponsorId: String(row.sponsorId ?? CS_ISOLATED_IDS.SPONSOR_ID),
      sponsorName: 'RHF-B-후원사',
      sponsorContactId:
        row.sponsorContactId != null
          ? String(row.sponsorContactId)
          : String(CS_ISOLATED_IDS.CONTACT_ID),
      sponsorContactName: 'RHF-B-담당자',
      displayOrder: index,
    }
  })
}

/** PATCH: 컬럼 키 교체 + envelope 키 병합. nested registration.overlay는 키 단위 병합. 루트 registrationOverlay는 저장하지 않음. */
function persistProgramPatch(store: IsolatedProgramStore, body: Record<string, unknown>) {
  const prev = store.program ?? {}
  const next: Record<string, unknown> = { ...prev }
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || key === 'serviceDetailJson') continue
    next[key] = value
  }
  if (body.serviceDetailJson != null) {
    next.serviceDetailJson = mergeServiceDetailForProgramPatch(
      prev.serviceDetailJson,
      body.serviceDetailJson
    )
  }
  store.program = {
    ...next,
    id: CS_ISOLATED_IDS.PROGRAM_ID,
    programType: 'COMPANY_SCHOOL',
  }
}

function isAllowedGet(pathname: string): boolean {
  if (
    pathname === '/api/admin/me' ||
    pathname === '/api/admin/applications/counts' ||
    pathname === '/api/admin/programs' ||
    pathname === '/api/admin/programs/overview-stages' ||
    pathname === '/api/admin/sponsors' ||
    pathname === '/api/admin/detailed-programs' ||
    pathname === '/api/admin/form-templates' ||
    pathname === '/api/admin/form-templates/create-options' ||
    pathname === '/api/admin/notifications' ||
    pathname === '/api/admin/me/dashboard-preferences' ||
    pathname === '/api/admin/me/dashboard-shortcut-badges' ||
    pathname === '/api/admin/settlement-configs/current' ||
    pathname === '/api/portal/me'
  ) {
    return true
  }
  return (
    pathname.startsWith('/api/admin/sponsors/') ||
    pathname.startsWith('/api/admin/form-templates/') ||
    pathname.startsWith('/api/admin/form-template-versions/') ||
    pathname.startsWith('/api/admin/programs/') ||
    pathname.startsWith('/api/admin/detailed-programs/') ||
    pathname.startsWith('/api/admin/notifications/') ||
    pathname.startsWith('/api/admin/dashboard') ||
    pathname.startsWith('/api/admin/settlement-configs') ||
    pathname.startsWith('/api/admin/files/') ||
    pathname.startsWith('/api/admin/common-codes') ||
    pathname.startsWith('/api/admin/codes') ||
    pathname.startsWith('/api/portal/') ||
    pathname.startsWith('/api/public/')
  )
}

function isAllowedMutation(method: string, pathname: string): boolean {
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
  if (method === 'POST' && pathname.startsWith('/api/admin/files')) return true
  if (method === 'PUT' && pathname.startsWith('/api/admin/files/uploads/raw/')) return true
  if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/thumbnail$/.test(pathname)) return true
  if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/attachments$/.test(pathname)) return true
  if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/inline-images$/.test(pathname)) return true
  if (method === 'DELETE' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) return true
  if (method === 'PUT' && /\/api\/portal\/programs\/\d+\/applications\/draft$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && /\/api\/portal\/programs\/\d+\/applications$/.test(pathname)) return true
  return false
}

export async function installCsIsolatedNetwork(
  page: Page,
  options?: IsolatedNetworkOptions
): Promise<IsolatedNetworkLog> {
  const failMode = options?.failMode ?? 'none'
  let createFailCount = 0
  const log: IsolatedNetworkLog = {
    api: [],
    mutations: [],
    blockedExternal: [],
    unexpected: [],
    createProgram: null,
    formVersionPuts: [],
    formVersionPublishes: [],
    formBindings: [],
    programPatches: [],
    programDraftPuts: [],
    filePosts: [],
    fileConfirms: [],
    s3Puts: [],
    thumbnailPuts: [],
    attachmentPuts: [],
    programDeletes: [],
    portalDraftPuts: [],
    portalApplicationPosts: [],
    publishedApplicationVersionId: null,
    publishedApplicationFormSource: 'seed',
    realMutations: 0,
    rootRegistrationOverlayHits: 0,
  }

  const copiedVersions = new Map<number, ReturnType<typeof versionResponse>>()
  const templateCodeByVersion = new Map<number, string>()
  let nextCopiedVersionId = 900201
  let nextFileId = CS_ISOLATED_IDS.THUMB_FILE_ID
  const store: IsolatedProgramStore = {
    program: null,
    sponsors: [],
    includeRecruitmentRow: options?.includeRecruitmentRow === true,
  }
  let createdBindings: unknown[] = []
  const fileRecords = new Map<number, { originalFileName: string; contentType: string }>()
  let boundThumbnail: Record<string, unknown> | null = null
  let boundAttachments: Array<Record<string, unknown>> = []
  let publishedApplicationForm: ReturnType<typeof applicationSeedForm> | Record<string, unknown> =
    applicationSeedForm()
  let portalDraftStore: Record<string, unknown> | null = options?.portalDraftAnswers ?? null
  let portalSubmitted = false

  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'e2e.mock.header.payload')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'isolated-cs-e2e-admin',
        email: 'isolated-cs-e2e-admin@jakorea.org',
        name: '격리 CS E2E 관리자',
        role: 'ADMIN',
        adminLevel: 'MASTER',
        roleCode: 'MASTER',
        isActive: true,
        programRoles: {},
      })
    )
    localStorage.setItem('platform_auth_token', 'e2e.mock.header.payload')
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
          contentType:
            pathname.endsWith('.css') || pathname.includes('css') ? 'text/css' : 'text/plain',
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
      log.programDraftPuts.push({ method, path: pathname, body: parseBody(request) })
      await route.fulfill(json({ success: false }, 410))
      return
    }

    if (method === 'GET' && pathname === '/api/admin/me') {
      await route.fulfill(
        json({
          adminAccountId: 171621,
          email: 'isolated-cs-e2e-admin@jakorea.org',
          name: '격리 CS E2E 관리자',
          roleCode: 'MASTER',
          roleName: '마스터',
          status: 'ACTIVE',
          mfaRequired: false,
          permissionCodes: ['*'],
        })
      )
      return
    }
    if (method === 'GET' && (pathname === '/api/portal/me' || pathname === '/api/portal/me/profile')) {
      await route.fulfill(
        json({
          memberId: 171721,
          email: 'isolated-cs-teacher@example.invalid',
          name: '격리 교사',
          phone: '010-1234-5678',
          memberType: 'TEACHER',
          teacher: true,
          teacherOrganization: {
            organizationId: 171821,
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
                    id: CS_ISOLATED_IDS.PROGRAM_ID,
                    title: store.program.title,
                    programType: 'COMPANY_SCHOOL',
                    status: 'PENDING',
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
    if (method === 'GET' && pathname === `/api/admin/sponsors/${CS_ISOLATED_IDS.SPONSOR_ID}/contacts`) {
      await route.fulfill(json(emptyPage([contactRow()])))
      return
    }
    if (method === 'GET' && pathname === `/api/admin/sponsors/${CS_ISOLATED_IDS.SPONSOR_ID}`) {
      await route.fulfill(json({ ...sponsorRow(), contacts: [contactRow()] }))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/detailed-programs') {
      await route.fulfill(
        json(
          emptyPage([
            {
              id: CS_ISOLATED_IDS.DETAILED_PROGRAM_ID,
              detailedProgramId: String(CS_ISOLATED_IDS.DETAILED_PROGRAM_ID),
              name: 'RHF-B-세부프로그램',
              nameKo: 'RHF-B-세부프로그램',
              detailedProgramName: 'RHF-B-세부프로그램',
              status: 'ACTIVE',
              useYn: true,
              inUse: false,
            },
          ])
        )
      )
      return
    }
    if (method === 'GET' && pathname === '/api/admin/settlement-configs/current') {
      await route.fulfill(json(settlementCurrentConfig()))
      return
    }
    if (method === 'GET' && pathname === '/api/admin/applications/counts') {
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
      const templateCode = templateCodeByVersion.get(versionId) ?? ''
      await route.fulfill(
        json(
          copied ??
            versionResponse({
              templateId: 820000,
              versionId,
              templateCode,
              schemaJson: JSON.stringify(catalogSchemaForTemplate(templateCode)),
            })
        )
      )
      return
    }
    if (
      method === 'GET' &&
      pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/navigation`
    ) {
      await route.fulfill(
        json({
          programId: CS_ISOLATED_IDS.PROGRAM_ID,
          canonicalProgramType: 'COMPANY_SCHOOL',
          rawProgramType: 'COMPANY_SCHOOL',
        })
      )
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}`) {
      await route.fulfill(
        json(
          store.program ?? {
            id: CS_ISOLATED_IDS.PROGRAM_ID,
            title: 'RHF-B-일사일교',
            programType: 'COMPANY_SCHOOL',
          }
        )
      )
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/thumbnail`) {
      await route.fulfill(
        json(
          boundThumbnail ?? {
            fileObjectId: null,
            originalFileName: null,
            contentType: null,
            fileSize: null,
            downloadPath: null,
          }
        )
      )
      return
    }
    if (
      method === 'GET' &&
      pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/attachments`
    ) {
      await route.fulfill(json(boundAttachments))
      return
    }
    if (method === 'GET' && /^\/api\/admin\/files\/\d+\/download$/.test(pathname)) {
      const fileObjectId = Number(pathname.split('/')[4])
      const origin = url.origin
      const record = fileRecords.get(fileObjectId)
      await route.fulfill(
        json({
          fileObjectId,
          downloadUrl: `${origin}/api/admin/files/downloads/raw/${fileObjectId}`,
          originalFileName: record?.originalFileName ?? `isolated-${fileObjectId}.png`,
        })
      )
      return
    }
    if (method === 'GET' && pathname.startsWith('/api/admin/files/downloads/raw/')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: ISOLATED_PNG_BYTES,
      })
      return
    }
    if (method === 'GET' && /^\/api\/admin\/files\/\d+$/.test(pathname)) {
      const fileObjectId = Number(pathname.split('/').at(-1))
      const record = fileRecords.get(fileObjectId)
      await route.fulfill(
        json(
          fileObjectPayload({
            fileObjectId,
            originalFileName: record?.originalFileName,
            contentType: record?.contentType,
            origin: url.origin,
          })
        )
      )
      return
    }
    if (method === 'GET' && pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/sponsors`) {
      await route.fulfill(json(store.sponsors))
      return
    }
    if (
      method === 'GET' &&
      pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/form-bindings`
    ) {
      await route.fulfill(json(createdBindings))
      return
    }
    if (method === 'GET' && pathname === `/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}`) {
      await route.fulfill(
        json({
          programId: CS_ISOLATED_IDS.PROGRAM_ID,
          title: store.program?.title ?? 'RHF-B-일사일교',
          programType: 'COMPANY_SCHOOL',
          portalCategories: ['ORGANIZATION'],
          recruitmentStatus: 'OPEN',
          periodStatus: 'RECRUITING',
          applicationTargetMode: 'ORGANIZATION',
          educationScheduleRange: {
            start: '2026-01-01',
            end: '2026-12-31',
          },
          recruitments: [
            {
              recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
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
    if (
      method === 'GET' &&
      pathname === `/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/application-options`
    ) {
      const versionId =
        log.publishedApplicationVersionId ??
        bindingNumeric(createdBindings, 'templateVersionId') ??
        CS_ISOLATED_IDS.TEMPLATE_VERSION_ID
      const bindingId =
        bindingNumeric(createdBindings, 'formBindingId') ??
        bindingNumeric(createdBindings, 'id') ??
        CS_ISOLATED_IDS.BINDING_ID
      await route.fulfill(
        json([
          {
            recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
            recruitmentType: 'PARTICIPANT',
            targetType: 'ORGANIZATION',
            applicationType: 'ORGANIZATION',
            formBindingId: bindingId,
            formTemplateVersionId: versionId,
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
      /^\/api\/portal\/programs\/\d+\/form-bindings\/\d+$/.test(pathname)
    ) {
      const versionId =
        log.publishedApplicationVersionId ??
        bindingNumeric(createdBindings, 'templateVersionId') ??
        CS_ISOLATED_IDS.TEMPLATE_VERSION_ID
      const bindingId = Number(pathname.split('/').at(-1))
      await route.fulfill(
        json({
          programId: CS_ISOLATED_IDS.PROGRAM_ID,
          recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
          applicationType: 'ORGANIZATION',
          formBindingId: Number.isFinite(bindingId) ? bindingId : CS_ISOLATED_IDS.BINDING_ID,
          templateVersionId: versionId,
          form: publishedApplicationForm,
          draftAnswers: portalDraftStore,
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

      try {

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
        if (createFailCount === 0) {
          createFailCount += 1
          log.createProgram = mutation
          await route.fulfill(
            json({ error: { code: 'CREATE_FAILED', message: 'mock create fail' } }, 500)
          )
          return
        }
      }
      if (failMode === 'media' && method === 'POST' && pathname.startsWith('/api/admin/files')) {
        log.filePosts.push(mutation)
        await route.fulfill(
          json({ error: { code: 'UPLOAD_FAILED', message: 'mock media fail' } }, 500)
        )
        return
      }
      if (
        failMode === 'bind' &&
        method === 'PUT' &&
        /^\/api\/admin\/programs\/\d+\/(thumbnail|attachments)$/.test(pathname)
      ) {
        if (pathname.endsWith('/thumbnail')) log.thumbnailPuts.push(mutation)
        else log.attachmentPuts.push(mutation)
        await route.fulfill(
          json({ error: { code: 'BIND_FAILED', message: 'mock media bind fail' } }, 500)
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
        const body = isRecord(mutation.body) ? mutation.body : {}
        const overlay = overlayFromFormVersionPut(body)
        const schema = parseSchemaDocument(body.schemaJson)
        if (schemaHasEconomyParagraphs(schema) && schema != null) {
          publishedApplicationForm = schema
          log.publishedApplicationFormSource = 'cms-put'
          log.publishedApplicationVersionId = versionId
        } else if (Object.keys(overlay).some(key => key.startsWith('application.economy.'))) {
          log.publishedApplicationVersionId = versionId
        }
        const saved = versionResponse({
          templateId: existing?.templateId ?? 820000,
          versionId,
          overlay,
          schemaJson:
            schemaHasEconomyParagraphs(schema) && schema != null
              ? JSON.stringify(schema)
              : existing?.schemaJson,
        })
        copiedVersions.set(versionId, saved)
        await route.fulfill(
          json(
            versionResponse({
              templateId: saved.templateId,
              versionId,
              overlay,
              status: 'DRAFT',
            })
          )
        )
        return
      }
      if (method === 'POST' && pathname.endsWith('/publish')) {
        log.formVersionPublishes.push(mutation)
        const versionId = Number(pathname.split('/')[4])
        await route.fulfill(
          json(versionResponse({ templateId: 820000, versionId, status: 'PUBLISHED' }))
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
        const incoming = Array.isArray(mutation.body) ? mutation.body : [mutation.body]
        log.formBindings = [...log.formBindings, ...incoming]
        createdBindings = [...createdBindings, ...incoming]
        await route.fulfill(json({ id: CS_ISOLATED_IDS.BINDING_ID }))
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
      if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) {
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
        return
      }
      if (method === 'POST' && pathname === '/api/admin/files/upload-requests') {
        log.filePosts.push(mutation)
        const fileObjectId = nextFileId
        nextFileId += 1
        const body = isRecord(mutation.body) ? mutation.body : {}
        const originalFileName =
          typeof body.originalFileName === 'string' && body.originalFileName.trim()
            ? body.originalFileName
            : `isolated-${fileObjectId}.png`
        const contentType =
          typeof body.contentType === 'string' && body.contentType.trim()
            ? body.contentType
            : 'image/png'
        fileRecords.set(fileObjectId, { originalFileName, contentType })
        await route.fulfill(
          json({
            fileObjectId,
            uploadUrl: `${url.origin}/api/admin/files/uploads/raw/${fileObjectId}`,
            method: 'PUT',
            confirmPath: `/api/admin/files/${fileObjectId}/confirm`,
            requiredHeaders: { 'Content-Type': contentType },
          })
        )
        return
      }
      if (method === 'POST' && /^\/api\/admin\/files\/\d+\/confirm$/.test(pathname)) {
        log.fileConfirms.push(mutation)
        const fileObjectId = Number(pathname.split('/')[4])
        const record = fileRecords.get(fileObjectId)
        await route.fulfill(
          json(
            fileObjectPayload({
              fileObjectId,
              originalFileName: record?.originalFileName,
              contentType: record?.contentType,
              origin: url.origin,
            })
          )
        )
        return
      }
      if (method === 'PUT' && pathname.startsWith('/api/admin/files/uploads/raw/')) {
        log.s3Puts.push(mutation)
        if (failMode === 'uploadSlow') {
          await new Promise(resolve => {
            setTimeout(resolve, 8_000)
          })
        }
        await route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
        return
      }
      if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/thumbnail$/.test(pathname)) {
        log.thumbnailPuts.push(mutation)
        const body = isRecord(mutation.body) ? mutation.body : {}
        const fileObjectId =
          typeof body.fileObjectId === 'number' ? body.fileObjectId : Number(body.fileObjectId)
        const record = Number.isFinite(fileObjectId) ? fileRecords.get(fileObjectId) : undefined
        boundThumbnail =
          Number.isFinite(fileObjectId) && fileObjectId > 0
            ? {
                fileObjectId,
                originalFileName: record?.originalFileName ?? `isolated-${fileObjectId}.png`,
                contentType: record?.contentType ?? 'image/png',
                fileSize: 80,
                downloadPath: `/api/admin/files/${fileObjectId}/download`,
              }
            : {
                fileObjectId: null,
                originalFileName: null,
                contentType: null,
                fileSize: null,
                downloadPath: null,
              }
        await route.fulfill(json(boundThumbnail))
        return
      }
      if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/inline-images$/.test(pathname)) {
        await route.fulfill(json({ fileObjectIds: [] }))
        return
      }
      if (method === 'PUT' && /^\/api\/admin\/programs\/\d+\/attachments$/.test(pathname)) {
        log.attachmentPuts.push(mutation)
        const body = isRecord(mutation.body) ? mutation.body : {}
        const ids = Array.isArray(body.fileObjectIds)
          ? body.fileObjectIds.map(item => Number(item)).filter(id => Number.isFinite(id) && id > 0)
          : []
        boundAttachments = ids.map((fileObjectId, index) => {
          const record = fileRecords.get(fileObjectId)
          return {
            fileObjectId,
            originalFileName: record?.originalFileName ?? `isolated-${fileObjectId}.bin`,
            contentType: record?.contentType ?? 'application/octet-stream',
            displayOrder: index,
            downloadPath: `/api/admin/files/${fileObjectId}/download`,
          }
        })
        await route.fulfill(json(boundAttachments))
        return
      }
      if (method === 'DELETE' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
        log.programDeletes.push(mutation)
        store.program = null
        boundThumbnail = null
        boundAttachments = []
        await route.fulfill(json({ deleted: true }))
        return
      }
      if (method === 'POST' && pathname.startsWith('/api/admin/files')) {
        log.filePosts.push(mutation)
        const fileObjectId = nextFileId
        nextFileId += 1
        await route.fulfill(
          json({
            fileObjectId,
            id: fileObjectId,
            contentUrl: `/files/isolated-cs-${fileObjectId}`,
            originalFileName: 'thumb.png',
          })
        )
        return
      }
      if (method === 'PUT' && pathname.endsWith('/applications/draft')) {
        log.portalDraftPuts.push(mutation)
        const body = isRecord(mutation.body) ? mutation.body : {}
        if (isRecord(body.answers)) portalDraftStore = body.answers
        await route.fulfill(json({ applicationId: 95021, status: 'DRAFT', applicationStatus: 'DRAFT' }))
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
        if (failMode === 'portalDuplicate' && portalSubmitted) {
          await route.fulfill(
            json(
              {
                error: {
                  code: 'APPLICATION_ALREADY_SUBMITTED',
                  message: '이미 제출한 신청이 있습니다.',
                },
              },
              409
            )
          )
          return
        }
        portalSubmitted = true
        await route.fulfill(
          json({ applicationId: 95022, status: 'SUBMITTED', applicationStatus: 'SUBMITTED' })
        )
        return
      }
      } catch (error) {
        console.error(`[cs-isolated] mutation handler ${method} ${pathname}`, error)
        await route.fulfill(
          json({ error: { code: 'MOCK_HANDLER', message: String(error) } }, 500)
        )
        return
      }
    }

    log.unexpected.push(`${method} ${pathname}`)
    console.error(`[cs-isolated] unexpected ${method} ${pathname}`)
    await route.abort('blockedbyclient')
  })

  page.on('request', request => {
    const url = new URL(request.url())
    if (!LOCAL_HOSTS.has(url.hostname) && url.protocol.startsWith('http')) {
      log.blockedExternal.push(`${request.method()} ${url.origin}${url.pathname}`)
    }
  })

  void templateCodeByVersion
  return log
}

export function assertIsolatedNetwork(log: IsolatedNetworkLog) {
  if (log.unexpected.length > 0) {
    throw new Error(`허용하지 않은 API: ${log.unexpected.join(', ')}`)
  }
  if (log.realMutations !== 0) {
    throw new Error(`실제 네트워크 mutation 발생: ${log.realMutations}`)
  }
  if (log.programDraftPuts.length > 0) {
    throw new Error(
      `program-draft 요청이 발생함: ${log.programDraftPuts.map(item => item.method).join(', ')}`
    )
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

export function overlayFromCreateBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) return {}
  const service = parseJsonObject(body.serviceDetailJson)
  const registration = parseJsonObject(service.registration)
  return parseJsonObject(registration.overlay)
}
