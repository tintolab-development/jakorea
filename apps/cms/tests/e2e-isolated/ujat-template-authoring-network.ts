import { installIsolatedAuthRefreshRoutes } from '../e2e/helpers/isolated-auth-session'
import { readFileSync } from 'node:fs'
import { expect, type Page, type Request, type Route } from '@playwright/test'

type JsonRecord = Record<string, unknown>

type FormTemplateSeed = {
  templateCode: string
  templateName: string
  formType: string
  category: string
  schemaJson: JsonRecord
  extensionJson: JsonRecord
  settingsJson?: JsonRecord | null
}

type FormVersionState = {
  templateId: number
  templateVersionId: number
  templateCode: string
  versionNo: number
  versionStatus: 'DRAFT' | 'PUBLISHED'
  schemaJson: string
  extensionJson: string
  settingsJson: string | null
  updatedAt: string
}

export type UjatTemplateAuthoringNetworkLog = {
  formTemplateGets: string[]
  formVersionGets: number[]
  formVersionPuts: Array<{ versionId: number; body: JsonRecord }>
  formVersionPublishes: number[]
  recruitmentMutations: Array<{ method: string; path: string; body: unknown }>
}

const SCHOOL_TEMPLATE_CODE = 'recruitment-ujat-school'
const VOLUNTEER_TEMPLATE_CODE = 'recruitment-ujat-volunteer'

const SCHOOL_TEMPLATE_ID = 510001
const VOLUNTEER_TEMPLATE_ID = 510002
const SCHOOL_VERSION_ID = 520001
const VOLUNTEER_VERSION_ID = 520002

function readSeed(filename: string): FormTemplateSeed {
  return JSON.parse(
    readFileSync(new URL(`../../docs/api/form-template-seeds/${filename}`, import.meta.url), 'utf8')
  ) as FormTemplateSeed
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function seedFor(templateCode: string): FormTemplateSeed {
  if (templateCode === SCHOOL_TEMPLATE_CODE) {
    return readSeed('recruitment-ujat-school.json')
  }
  return readSeed('recruitment-ujat-volunteer.json')
}

function templateIds(templateCode: string): { templateId: number; versionId: number } {
  return templateCode === SCHOOL_TEMPLATE_CODE
    ? { templateId: SCHOOL_TEMPLATE_ID, versionId: SCHOOL_VERSION_ID }
    : { templateId: VOLUNTEER_TEMPLATE_ID, versionId: VOLUNTEER_VERSION_ID }
}

function legacyOverlayFor(templateCode: string): JsonRecord {
  if (templateCode === SCHOOL_TEMPLATE_CODE) {
    return {
      'ujat.recruit.institution.publicTitle': 'Legacy 기관 모집 제목',
      'ujat.recruit.institution.description': 'Legacy 기관 모집 설명',
      'legacy.keep': 'preserve-me',
    }
  }

  return {
    'ujat.recruit.volunteer.h2.publicTitle': 'Legacy 봉사자 모집 제목',
    'ujat.recruit.volunteer.h2.description': 'Legacy 봉사자 모집 설명',
    'recruit.volunteer.h2.interview.selectedSlotKeys': [],
    'recruit.volunteer.h2.interview.timeUnit': '30',
    'recruit.volunteer.h2.interview.interviewTimeRange': [
      '2026-10-27T09:00:00+09:00',
      '2026-10-27T10:00:00+09:00',
    ],
    'legacy.keep': 'preserve-me',
  }
}

function initialVersionState(templateCode: string): FormVersionState {
  const seed = seedFor(templateCode)
  const ids = templateIds(templateCode)
  return {
    templateId: ids.templateId,
    templateVersionId: ids.versionId,
    templateCode,
    versionNo: 1,
    versionStatus: 'DRAFT',
    schemaJson: JSON.stringify(clone(seed.schemaJson)),
    extensionJson: JSON.stringify({
      ...clone(seed.extensionJson),
      overlay: legacyOverlayFor(templateCode),
      editorState: { fixture: 'editor-state-preserved' },
      uiState: { fixture: 'ui-state-preserved' },
    }),
    // null is intentional: it exercises the one-time Legacy overlay import.
    settingsJson: null,
    updatedAt: '2026-10-25T00:00:00Z',
  }
}

function templateListItem(templateCode: string): JsonRecord {
  const seed = seedFor(templateCode)
  const ids = templateIds(templateCode)
  return {
    templateId: ids.templateId,
    templateCode,
    templateName: seed.templateName,
    formType: seed.formType,
    category: seed.category,
    useYn: true,
    latestVersionId: ids.versionId,
    latestVersionNo: 1,
    latestVersionStatus: 'DRAFT',
    responseCount: 0,
    activeBindingCount: 0,
    systemTemplate: true,
    creatorName: '격리 Mock',
    createdAt: '2026-10-25T00:00:00Z',
    updatedAt: '2026-10-25T00:00:00Z',
    availableActions: ['UPDATE'],
    baseTemplateCode: templateCode,
    deletable: false,
  }
}

function versionPayload(state: FormVersionState): JsonRecord {
  return {
    templateId: state.templateId,
    templateVersionId: state.templateVersionId,
    versionId: state.templateVersionId,
    templateCode: state.templateCode,
    versionNo: state.versionNo,
    versionStatus: state.versionStatus,
    schemaJson: state.schemaJson,
    extensionJson: state.extensionJson,
    settingsJson: state.settingsJson,
    updatedAt: state.updatedAt,
  }
}

function parseJsonBody(request: Request): JsonRecord {
  const raw = request.postData()
  if (raw == null || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {}
  } catch {
    return {}
  }
}

function jsonResponse(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  }
}

function versionIdFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/api\/admin\/form-template-versions\/(\d+)$/)
  return match == null ? null : Number(match[1])
}

function templateIdFromVersionsPath(pathname: string): number | null {
  const match = pathname.match(/^\/api\/admin\/form-templates\/(\d+)\/versions$/)
  return match == null ? null : Number(match[1])
}

export async function installUjatTemplateAuthoringNetwork(
  page: Page
): Promise<UjatTemplateAuthoringNetworkLog> {
  const states = new Map<string, FormVersionState>([
    [SCHOOL_TEMPLATE_CODE, initialVersionState(SCHOOL_TEMPLATE_CODE)],
    [VOLUNTEER_TEMPLATE_CODE, initialVersionState(VOLUNTEER_TEMPLATE_CODE)],
  ])
  const codeByVersionId = new Map<number, string>([
    [SCHOOL_VERSION_ID, SCHOOL_TEMPLATE_CODE],
    [VOLUNTEER_VERSION_ID, VOLUNTEER_TEMPLATE_CODE],
  ])
  const log: UjatTemplateAuthoringNetworkLog = {
    formTemplateGets: [],
    formVersionGets: [],
    formVersionPuts: [],
    formVersionPublishes: [],
    recruitmentMutations: [],
  }

  await page.addInitScript(() => {
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

  page.on('request', request => {
    const url = new URL(request.url())
    if (!url.pathname.includes('/recruitments')) return
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) return
    log.recruitmentMutations.push({
      method: request.method(),
      path: url.pathname,
      body: request.postDataJSON?.() ?? null,
    })
  })

  await page.route('**/api/admin/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url

    if (pathname === '/api/admin/me' && request.method() === 'GET') {
      await route.fulfill(
        jsonResponse({
          adminAccountId: 171601,
          email: 'isolated-e2e-admin@jakorea.org',
          name: '격리 E2E 관리자',
          roleCode: 'MASTER',
          roleName: '마스터',
          status: 'ACTIVE',
          mfaRequired: false,
          permissionCodes: ['*'],
        })
      )
      return
    }

    if (pathname === '/api/admin/notifications' && request.method() === 'GET') {
      await route.fulfill(
        jsonResponse({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 1 })
      )
      return
    }

    if (pathname === '/api/admin/dashboard/notifications/count' && request.method() === 'GET') {
      await route.fulfill(jsonResponse({ count: 0 }))
      return
    }

    if (
      (pathname === '/api/admin/me/dashboard-preferences' ||
        pathname === '/api/admin/me/dashboard-shortcut-badges') &&
      request.method() === 'GET'
    ) {
      await route.fulfill(jsonResponse({}))
      return
    }

    if (pathname === '/api/admin/form-templates' && request.method() === 'GET') {
      log.formTemplateGets.push(url.search)
      const formType = url.searchParams.get('formType')
      const items = formType == null || formType === 'WRITING'
        ? [templateListItem(SCHOOL_TEMPLATE_CODE), templateListItem(VOLUNTEER_TEMPLATE_CODE)]
        : []
      await route.fulfill(
        jsonResponse({
          items,
          page: Number(url.searchParams.get('page') ?? 0),
          size: Number(url.searchParams.get('size') ?? 20),
          totalElements: items.length,
          totalPages: 1,
        })
      )
      return
    }

    const payloadMatch = pathname.match(
      /^\/api\/admin\/form-templates\/by-code\/([^/]+)\/payload$/
    )
    if (payloadMatch != null && request.method() === 'GET') {
      const templateCode = decodeURIComponent(payloadMatch[1])
      const state = states.get(templateCode)
      if (state == null) {
        await route.fulfill(jsonResponse({ message: 'Unknown Mock template' }, 404))
        return
      }
      const seed = seedFor(templateCode)
      await route.fulfill(
        jsonResponse({
          ...versionPayload(state),
          templateName: seed.templateName,
          formType: seed.formType,
          category: seed.category,
          useYn: true,
          latestVersionId: state.templateVersionId,
          latestVersionStatus: state.versionStatus,
          baseTemplateCode: templateCode,
          systemTemplate: true,
          deletable: false,
        })
      )
      return
    }

      const versionId = versionIdFromPath(pathname)
    if (versionId != null && request.method() === 'GET') {
      const templateCode = codeByVersionId.get(versionId)
      const state = templateCode == null ? undefined : states.get(templateCode)
      if (state == null) {
        await route.fulfill(jsonResponse({ message: 'Unknown Mock version' }, 404))
        return
      }
      log.formVersionGets.push(versionId)
      await route.fulfill(jsonResponse(versionPayload(state)))
      return
    }

    if (versionId != null && request.method() === 'PUT') {
      const templateCode = codeByVersionId.get(versionId)
      const state = templateCode == null ? undefined : states.get(templateCode)
      if (templateCode == null || state == null) {
        await route.fulfill(jsonResponse({ message: 'Unknown Mock version' }, 404))
        return
      }
      if (state.versionStatus !== 'DRAFT') {
        await route.fulfill(
          jsonResponse({ error: { code: 'FORM_VERSION_IMMUTABLE' } }, 409)
        )
        return
      }
      const body = parseJsonBody(request)
      log.formVersionPuts.push({ versionId, body: clone(body) })
      const next = { ...state }
      if (typeof body.schemaJson === 'string') next.schemaJson = body.schemaJson
      if (typeof body.extensionJson === 'string') next.extensionJson = body.extensionJson
      if (typeof body.settingsJson === 'string') next.settingsJson = body.settingsJson
      next.updatedAt = '2026-10-25T00:00:01Z'
      states.set(templateCode, next)
      await route.fulfill(jsonResponse(versionPayload(next)))
      return
    }

    if (templateIdFromVersionsPath(pathname) != null && request.method() === 'GET') {
      const templateId = templateIdFromVersionsPath(pathname)
      const state = [...states.values()].find(item => item.templateId === templateId)
      await route.fulfill(
        jsonResponse(
          state == null
            ? []
            : [
                {
                  templateVersionId: state.templateVersionId,
                  versionNo: state.versionNo,
                  versionStatus: state.versionStatus,
                  updatedAt: state.updatedAt,
                },
              ]
        )
      )
      return
    }

    const publishMatch = pathname.match(
      /^\/api\/admin\/form-template-versions\/(\d+)\/publish$/
    )
    if (publishMatch != null && request.method() === 'POST') {
      const publishedVersionId = Number(publishMatch[1])
      const templateCode = codeByVersionId.get(publishedVersionId)
      const state = templateCode == null ? undefined : states.get(templateCode)
      if (templateCode == null || state == null) {
        await route.fulfill(jsonResponse({ message: 'Unknown Mock version' }, 404))
        return
      }
      const next = { ...state, versionStatus: 'PUBLISHED' as const }
      states.set(templateCode, next)
      log.formVersionPublishes.push(publishedVersionId)
      await route.fulfill(jsonResponse(versionPayload(next)))
      return
    }

    await route.continue()
  })

  await installIsolatedAuthRefreshRoutes(page)
  return log
}

export async function expectFormVersionPut(
  log: UjatTemplateAuthoringNetworkLog,
  versionId: number
): Promise<JsonRecord> {
  await expect
    .poll(() => log.formVersionPuts.find(item => item.versionId === versionId)?.body ?? null)
    .not.toBeNull()
  return log.formVersionPuts.find(item => item.versionId === versionId)?.body ?? {}
}

export const UJAT_TEMPLATE_AUTHORING_VERSION_IDS = {
  school: SCHOOL_VERSION_ID,
  volunteer: VOLUNTEER_VERSION_ID,
} as const
