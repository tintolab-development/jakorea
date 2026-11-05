import { appendFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type Page, type Route } from '@playwright/test'

/**
 * STEP 4.1 PHASE 4 — 일반 프로그램 상세 GET/PATCH 격리 Mock.
 * GET 픽스처는 격리 CREATE 캡처 Body(기관+강사+봉사자)에 id·상태·모집 행 id를 붙인 것(봉사 면접 슬롯 4개).
 * PATCH(프로그램·모집 행)는 캡처 후 저장 상태에 반영해 재GET이 저장 결과를 돌려준다.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DETAIL_FIXTURE = JSON.parse(
  readFileSync(path.join(__dirname, 'fixtures/general-volunteer-interview-4slots.program.json'), 'utf-8')
) as Record<string, any>
export const DETAIL_PROGRAM_ID = String(DETAIL_FIXTURE.id)

function parseJson(v: unknown): any {
  if (v == null) return {}
  return typeof v === 'string' ? JSON.parse(v) : v
}
/**
 * BE 계약(keonhee 57262c4676): serviceDetailJson RFC-7396 merge — 생략 키 유지, 명시 null은 해당 키 삭제,
 * 배열·스칼라는 교체.
 */
export function deepMerge(base: any, patch: any): any {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch
  if (!base || typeof base !== 'object' || Array.isArray(base)) base = {}
  const out: Record<string, any> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k]
    else out[k] = deepMerge(base[k], v)
  }
  return out
}

export type DetailCaptured = { method: string; path: string; body: any }

export async function installProgramDetailMock(page: Page, fixture: Record<string, any> = DETAIL_FIXTURE) {
  let stored: Record<string, any> = structuredClone(fixture)
  const mutations: DetailCaptured[] = []
  const gets: string[] = []
  const id = String(fixture.id)
  await page.route(`**/api/admin/programs/${id}**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    if (method === 'GET' && url.pathname === `/api/admin/programs/${id}`) {
      gets.push(url.pathname)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) })
      return
    }
    if (method === 'GET' && url.pathname === `/api/admin/programs/${id}/sponsors`) {
      // 계약: AdminProgramSponsorAssignmentDto[] (programs-api-client.ts:137-163)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            sponsorId: '163001',
            sponsorName: '격리 후원사',
            sponsorContactId: '163101',
            sponsorContactName: '격리 담당자',
            sponsorContacts: [{ sponsorContactId: '163101', sponsorContactName: '격리 담당자', displayOrder: 1 }],
            displayOrder: 1,
          },
        ]),
      })
      return
    }
    if (method === 'GET' && url.pathname === `/api/admin/programs/${id}/navigation`) {
      // 계약: ProgramNavigationResponse
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          programId: Number(id),
          rawProgramType: 'GENERAL',
          canonicalProgramType: 'GENERAL',
          allowedApplicationTargets: ['ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'],
          disabledApplicationTargets: [],
        }),
      })
      return
    }
    if (method === 'GET') {
      await route.fallback()
      return
    }
    let body: any = null
    try {
      body = req.postDataJSON()
    } catch {
      body = req.postData()
    }
    mutations.push({ method, path: url.pathname, body })
    // 증거 덤프(옵트인): STEP41_DUMP=<파일> 이면 변이 요청 본문을 JSONL로 남긴다
    if (process.env.STEP41_DUMP) {
      appendFileSync(process.env.STEP41_DUMP, JSON.stringify({ test: process.env.STEP41_CASE ?? '', method, path: url.pathname, body }) + '\n')
    }
    if (method === 'PATCH' && url.pathname === `/api/admin/programs/${id}` && body && typeof body === 'object') {
      const next: Record<string, any> = { ...stored }
      for (const [k, v] of Object.entries(body)) {
        if (v === undefined) continue
        // serviceDetailJson은 부분 PATCH 직렬화(service-detail-json.ts:417-420) → BE JSON merge 가정으로 deep-merge
        next[k] = k === 'serviceDetailJson' ? JSON.stringify(deepMerge(parseJson(stored[k]), parseJson(v))) : v
      }
      delete next.expectedUpdatedAt
      next.updatedAt = new Date().toISOString()
      stored = next
    }
    const rowMatch = /\/recruitments\/(\d+)$/.exec(url.pathname)
    if (method === 'PATCH' && rowMatch && body && typeof body === 'object') {
      const rowId = Number(rowMatch[1])
      stored = {
        ...stored,
        recruitments: stored.recruitments.map((r: any) => (r.id === rowId ? { ...r, ...body, id: rowId } : r)),
        updatedAt: new Date().toISOString(),
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) })
  })
  return { mutations, gets, getStored: () => stored }
}

export async function openDetailTab(page: Page, tab: 'info' | 'recruitment', subTab?: string) {
  await page.goto(`/programs/general?programId=${DETAIL_PROGRAM_ID}&lnb=info&tab=${tab}`)
  await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({ timeout: 45_000 })
  if (subTab) {
    const t = page.getByRole('tab', { name: subTab }).first()
    await t.click()
    await expect(t).toHaveAttribute('aria-selected', 'true')
  }
}

export async function enterDetailEdit(page: Page, editParam: string) {
  await page.getByRole('button', { name: '정보 수정' }).first().click()
  await expect(page).toHaveURL(new RegExp(`edit=${editParam}`), { timeout: 15_000 })
}

/** 저장 클릭 → PATCH 캡처 또는 차단 다이얼로그 */
export async function saveDetailEdit(page: Page, mutations: DetailCaptured[]) {
  const before = mutations.length
  const failDialog = page.getByRole('dialog').filter({ hasText: /저장 실패|입력 확인|필수 항목/ })
  await page.getByRole('button', { name: '저장', exact: true }).first().click()
  await expect
    .poll(
      async () => {
        if (await failDialog.isVisible().catch(() => false)) return 'blocked'
        return mutations.slice(before).some(m => m.method === 'PATCH') ? 'patched' : 'waiting'
      },
      { timeout: 30_000 }
    )
    .not.toBe('waiting')
  // 연속 PATCH(행 + 보조 PATCH)가 따라올 수 있어 잠시 수집
  await page.waitForTimeout(1_000)
  if (await failDialog.isVisible().catch(() => false)) {
    return { blocked: (await failDialog.innerText()).replace(/\s+/g, ' ').slice(0, 200), patches: [] as DetailCaptured[] }
  }
  return { blocked: null as string | null, patches: mutations.slice(before).filter(m => m.method === 'PATCH') }
}

export function parseServiceDetail(body: any): Record<string, any> | null {
  const raw = body?.serviceDetailJson
  if (raw == null) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}
