import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type Route } from '@playwright/test'
import { installIsolatedRegistrationNetwork } from './install-isolated-network'

/**
 * STEP 4.1 SLOTKEYS: 일반 상세 → 모집 → 봉사자 면접 그리드에서 저장된 4슬롯 중 2개를 실제 클릭으로 해제하고
 * 저장 PATCH의 selectedSlotKeys가 남은 2개뿐인지, 재진입 시 2개로 보이는지 확인한다.
 * GET 픽스처는 격리 CREATE 캡처 Body(기관+강사+봉사자)에 id·상태만 더하고 봉사 슬롯을 4개로 늘린 것이다.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = JSON.parse(
  readFileSync(path.join(__dirname, 'fixtures/general-volunteer-interview-4slots.program.json'), 'utf-8')
) as Record<string, any>
const PROGRAM_ID = String(FIXTURE.id)
const ALL_SLOTS: string[] = FIXTURE.recruitments.find((r: any) => r.recruitmentType === 'VOLUNTEER')
  .interviewConfig.selectedSlotKeys

type Captured = { method: string; path: string; body: any }

async function installProgramDetailMock(page: Page) {
  let stored: Record<string, any> = structuredClone(FIXTURE)
  const mutations: Captured[] = []
  await page.route(`**/api/admin/programs/${PROGRAM_ID}**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    if (method === 'GET' && url.pathname === `/api/admin/programs/${PROGRAM_ID}`) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) })
      return
    }
    if (method === 'GET' && url.pathname === `/api/admin/programs/${PROGRAM_ID}/sponsors`) {
      // 계약: AdminProgramSponsorAssignmentDto[] (programs-api-client.ts:137-163)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: '1', sponsorId: '163001', sponsorName: '격리 후원사', sponsorContactId: '163101', sponsorContactName: '격리 담당자',
          sponsorContacts: [{ sponsorContactId: '163101', sponsorContactName: '격리 담당자', displayOrder: 1 }], displayOrder: 1 },
      ]) })
      return
    }
    if (method === 'GET' && url.pathname === `/api/admin/programs/${PROGRAM_ID}/navigation`) {
      // 계약: ProgramNavigationResponse — 기관·강사·봉사자 신청 대상 허용
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        programId: Number(PROGRAM_ID), rawProgramType: 'GENERAL', canonicalProgramType: 'GENERAL',
        allowedApplicationTargets: ['ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'], disabledApplicationTargets: [],
      }) })
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
    if (method === 'PATCH' && url.pathname === `/api/admin/programs/${PROGRAM_ID}` && body && typeof body === 'object') {
      // 수정 반영: 요청 필드만 덮어써 재조회가 저장 결과를 돌려주게 한다.
      const next = { ...stored, ...body, updatedAt: new Date().toISOString() }
      if (Array.isArray(body.recruitments)) {
        next.recruitments = stored.recruitments.map((r: any) => {
          const patch = body.recruitments.find(
            (p: any) => p.id === r.id || p.recruitmentType === r.recruitmentType
          )
          return patch ? { ...r, ...patch } : r
        })
      }
      delete next.expectedUpdatedAt
      stored = next
    }
    const rowMatch = /\/recruitments\/(\d+)$/.exec(url.pathname)
    if (method === 'PATCH' && rowMatch && body && typeof body === 'object') {
      // 모집 행 PATCH: 해당 행만 갱신(재조회가 저장 결과를 돌려주게)
      const rowId = Number(rowMatch[1])
      stored = {
        ...stored,
        recruitments: stored.recruitments.map((r: any) =>
          r.id === rowId ? { ...r, ...body, id: rowId } : r
        ),
        updatedAt: new Date().toISOString(),
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) })
  })
  return { mutations, getStored: () => stored }
}

function slotKeysIn(value: unknown): string[][] {
  const out: string[][] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string' && v.trim().startsWith('{')) {
      try {
        walk(JSON.parse(v))
      } catch {
        /* not json */
      }
      return
    }
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        if ((k === 'selectedSlotKeys' || k.endsWith('.selectedSlotKeys')) && Array.isArray(child)) {
          out.push(child as string[])
        } else walk(child)
      }
    }
  }
  walk(value)
  return out
}

async function openVolunteerRecruit(page: Page) {
  await page.goto(`/programs/general?programId=${PROGRAM_ID}&lnb=info&tab=recruitment`)
  const tab = page.getByRole('tab', { name: '봉사자 모집 정보' }).first()
  await expect(tab).toBeVisible({ timeout: 45_000 })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
}

async function enterEdit(page: Page) {
  await page.getByRole('button', { name: '정보 수정' }).first().click()
  await expect(page).toHaveURL(/edit=volunteers/, { timeout: 15_000 })
}

function selectedChips(page: Page) {
  return page.locator('.paragraph-chip--selected:visible')
}

async function saveAndCapturePatch(page: Page, mutations: Captured[]) {
  const before = mutations.length
  const failDialog = page.getByRole('dialog').filter({ hasText: /저장 실패|입력 확인|필수 항목/ })
  await page.getByRole('button', { name: '저장', exact: true }).first().click()
  await expect
    .poll(async () => {
      if (await failDialog.isVisible().catch(() => false)) return 'blocked'
      return mutations.slice(before).some(m => m.method === 'PATCH') ? 'patched' : 'waiting'
    }, { timeout: 30_000 })
    .not.toBe('waiting')
  if (await failDialog.isVisible().catch(() => false)) {
    return { blocked: (await failDialog.innerText()).replace(/\s+/g, ' ').slice(0, 200), patches: [] as Captured[] }
  }
  return { blocked: null, patches: mutations.slice(before).filter(m => m.method === 'PATCH') }
}

test.describe.configure({ mode: 'serial' })

test('봉사 면접 슬롯 4→2 해제 저장 시 PATCH에 남은 2개만, 재진입 2개', async ({ page }) => {
  await installIsolatedRegistrationNetwork(page)
  const { mutations } = await installProgramDetailMock(page)
  await openVolunteerRecruit(page)
  await enterEdit(page)
  await expect(selectedChips(page)).toHaveCount(4, { timeout: 20_000 })
  const labels = (await selectedChips(page).allInnerTexts()).map(t => t.trim())
  console.log('[SLOTKEYS] 초기 선택', JSON.stringify(labels))
  // 뒤 2개를 실제 클릭으로 해제
  for (let i = 0; i < 2; i += 1) {
    const chip = selectedChips(page).last()
    await chip.click()
  }
  await expect(selectedChips(page)).toHaveCount(2)
  const remaining = (await selectedChips(page).allInnerTexts()).map(t => t.trim())
  const { blocked, patches } = await saveAndCapturePatch(page, mutations)
  expect(blocked, `저장 차단: ${blocked}`).toBeNull()
  const keys = patches.flatMap(p => slotKeysIn(p.body))
  console.log('[SLOTKEYS] PATCH', JSON.stringify({ paths: patches.map(p => p.path), keys, remaining }))
  const volunteerRowBefore = FIXTURE.recruitments.find((r: any) => r.recruitmentType === 'VOLUNTEER')
  for (const p of patches) {
    const b = p.body as Record<string, any>
    console.log('[SLOTKEYS] PATCH body keys', p.path, JSON.stringify(Object.keys(b ?? {})))
    // 슬롯 외 봉사 모집 값은 바뀌지 않아야 한다(보낸 경우에만 비교)
    for (const k of ['recruitmentType', 'targetType', 'maxCount', 'selectionMethod', 'interviewEnabled']) {
      if (b && k in b) expect(b[k], `PATCH ${k}`).toEqual(volunteerRowBefore[k])
    }
    if (b?.interviewConfig) {
      expect(b.interviewConfig.timeUnit).toEqual(volunteerRowBefore.interviewConfig.timeUnit)
      expect(b.interviewConfig.interviewTimeRange).toEqual(volunteerRowBefore.interviewConfig.interviewTimeRange)
    }
  }
  expect(keys.length, 'PATCH에 selectedSlotKeys 존재').toBeGreaterThan(0)
  for (const k of keys) expect(k).toEqual(ALL_SLOTS.slice(0, 2))
  // 다른 모집 값 보존(봉사 대상)
  const patchText = JSON.stringify(patches.map(p => p.body))
  expect(patchText).not.toContain(ALL_SLOTS[2])
  expect(patchText).not.toContain(ALL_SLOTS[3])

  // 재진입: 재조회가 저장 결과를 돌려준다
  await openVolunteerRecruit(page)
  await enterEdit(page)
  await expect(selectedChips(page)).toHaveCount(2, { timeout: 20_000 })
  expect((await selectedChips(page).allInnerTexts()).map(t => t.trim())).toEqual(remaining)
})

test('봉사 면접 슬롯 전체 해제 저장 결과(PATCH [] 또는 필수 차단)', async ({ page }) => {
  await installIsolatedRegistrationNetwork(page)
  const { mutations } = await installProgramDetailMock(page)
  await openVolunteerRecruit(page)
  await enterEdit(page)
  await expect(selectedChips(page)).toHaveCount(4, { timeout: 20_000 })
  for (let i = 0; i < 4; i += 1) await selectedChips(page).last().click()
  await expect(selectedChips(page)).toHaveCount(0)
  const { blocked, patches } = await saveAndCapturePatch(page, mutations)
  const keys = patches.flatMap(p => slotKeysIn(p.body))
  console.log('[SLOTKEYS] 전체 해제', JSON.stringify({ blocked, keys }))
  if (blocked == null) {
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) expect(k).toEqual([])
  }
})
