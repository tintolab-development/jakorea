import type { Page, Request, Route } from '@playwright/test'
import {
  createProgramApplicationFormEconomyDraft,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'

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
  | 'portalPost'
  | 'draft'

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
  programDraftPuts: IsolatedCapturedMutation[]
  filePosts: IsolatedCapturedMutation[]
  portalDraftPuts: IsolatedCapturedMutation[]
  portalApplicationPosts: IsolatedCapturedMutation[]
  realMutations: number
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
  draft: Record<string, unknown> | null
  includeRecruitmentRow: boolean
}

function persistCreateBody(store: IsolatedProgramStore, body: Record<string, unknown>) {
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

/** PATCH: 컬럼 키 교체 + serviceDetail envelope 키 병합. overlay는 deep merge 하지 않고 통째 교체. */
function persistProgramPatch(store: IsolatedProgramStore, body: Record<string, unknown>) {
  const prev = store.program ?? {}
  const next: Record<string, unknown> = { ...prev }
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || key === 'serviceDetailJson') continue
    next[key] = value
  }
  if (body.serviceDetailJson != null) {
    const prevJson = parseJsonObject(prev.serviceDetailJson)
    const incoming = parseJsonObject(body.serviceDetailJson)
    const prevProgram = parseJsonObject(prevJson.program)
    const nextProgram = parseJsonObject(incoming.program)
    const prevCommon = parseJsonObject(prevProgram.generalCommonInfo)
    const incomingCommon = parseJsonObject(nextProgram.generalCommonInfo)
    const registration = Object.prototype.hasOwnProperty.call(incoming, 'registration')
      ? incoming.registration
      : prevJson.registration
    next.serviceDetailJson = JSON.stringify({
      schemaVersion: incoming.schemaVersion ?? prevJson.schemaVersion ?? 1,
      program: {
        ...prevProgram,
        ...nextProgram,
        generalCommonInfo:
          Object.keys(incomingCommon).length > 0
            ? { ...prevCommon, ...incomingCommon }
            : prevCommon,
      },
      ...(registration != null ? { registration } : {}),
    })
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
    pathname === '/api/admin/programs' ||
    pathname === '/api/admin/programs/overview-stages' ||
    pathname === '/api/admin/program-draft' ||
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
  if (method === 'PUT' && pathname === '/api/admin/program-draft') return true
  if (method === 'DELETE' && pathname === '/api/admin/program-draft') return true
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
  if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) return true
  if (method === 'POST' && pathname.startsWith('/api/admin/files')) return true
  if (method === 'PUT' && /\/api\/portal\/programs\/\d+\/applications\/draft$/.test(pathname)) {
    return true
  }
  if (method === 'POST' && /\/api\/portal\/programs\/\d+\/applications$/.test(pathname)) return true
  return false
}

export async function installCsIsolatedNetwork(
  page: Page,
  options?: { failMode?: IsolatedFailMode; includeRecruitmentRow?: boolean }
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
    programPatches: [],
    programDraftPuts: [],
    filePosts: [],
    portalDraftPuts: [],
    portalApplicationPosts: [],
    realMutations: 0,
  }

  const copiedVersions = new Map<number, ReturnType<typeof versionResponse>>()
  const templateCodeByVersion = new Map<number, string>()
  let nextCopiedVersionId = 900201
  let nextFileId = CS_ISOLATED_IDS.THUMB_FILE_ID
  const store: IsolatedProgramStore = {
    program: null,
    sponsors: [],
    draft: null,
    includeRecruitmentRow: options?.includeRecruitmentRow === true,
  }
  let createdBindings: unknown[] = []

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
    if (method === 'GET' && pathname === '/api/admin/program-draft') {
      if (store.draft) {
        await route.fulfill(json(store.draft))
        return
      }
      await route.fulfill(json({ success: false }, 404))
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
      await route.fulfill(json(copied ?? versionResponse({ templateId: 820000, versionId })))
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
      await route.fulfill(
        json([
          {
            recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
            recruitmentType: 'PARTICIPANT',
            targetType: 'ORGANIZATION',
            applicationType: 'ORGANIZATION',
            formBindingId: CS_ISOLATED_IDS.BINDING_ID,
            formTemplateVersionId: CS_ISOLATED_IDS.TEMPLATE_VERSION_ID,
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
      pathname ===
        `/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/form-bindings/${CS_ISOLATED_IDS.BINDING_ID}`
    ) {
      await route.fulfill(
        json({
          programId: CS_ISOLATED_IDS.PROGRAM_ID,
          recruitmentId: CS_ISOLATED_IDS.RECRUITMENT_ID,
          applicationType: 'ORGANIZATION',
          formBindingId: CS_ISOLATED_IDS.BINDING_ID,
          templateVersionId: CS_ISOLATED_IDS.TEMPLATE_VERSION_ID,
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
      if (failMode === 'media' && method === 'POST' && pathname.startsWith('/api/admin/files')) {
        log.filePosts.push(mutation)
        await route.fulfill(
          json({ error: { code: 'UPLOAD_FAILED', message: 'mock media fail' } }, 500)
        )
        return
      }

      if (method === 'PUT' && pathname === '/api/admin/program-draft') {
        log.programDraftPuts.push(mutation)
        if (failMode === 'draft') {
          await route.fulfill(
            json({ error: { code: 'DRAFT_PUT_FAILED', message: 'mock draft put fail' } }, 500)
          )
          return
        }
        store.draft = {
          draftId: 99021,
          programType: 'COMPANY_SCHOOL',
          saved: true,
          ...(isRecord(mutation.body) ? mutation.body : {}),
        }
        await route.fulfill(json(store.draft))
        return
      }
      if (method === 'DELETE' && pathname === '/api/admin/program-draft') {
        store.draft = null
        await route.fulfill(json({ deleted: true }))
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
          json(existing ?? versionResponse({ templateId: 820000, versionId, overlay: {} }))
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
        if (Array.isArray(body.formBindings)) {
          log.formBindings = body.formBindings
          createdBindings = body.formBindings
        }
        persistCreateBody(store, body)
        await route.fulfill(json(store.program))
        return
      }
      if (method === 'POST' && pathname.endsWith('/form-bindings')) {
        log.formBindings = Array.isArray(mutation.body) ? mutation.body : [mutation.body]
        createdBindings = log.formBindings
        await route.fulfill(json({ id: CS_ISOLATED_IDS.BINDING_ID }))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/programs\/\d+$/.test(pathname)) {
        log.programPatches.push(mutation)
        persistProgramPatch(store, (mutation.body ?? {}) as Record<string, unknown>)
        await route.fulfill(json(store.program))
        return
      }
      if (method === 'PATCH' && /^\/api\/admin\/form-templates\/\d+$/.test(pathname)) {
        await route.fulfill(json({ id: Number(pathname.split('/').at(-1)) }))
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
        await route.fulfill(json({ applicationId: 95021, status: 'DRAFT' }))
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
        await route.fulfill(json({ applicationId: 95022, status: 'SUBMITTED' }))
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
