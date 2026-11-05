import { expect, test, type Page } from '@playwright/test'
import { installIsolatedRegistrationNetwork } from './install-isolated-network'
import {
  DETAIL_FIXTURE,
  DETAIL_PROGRAM_ID,
  enterDetailEdit,
  installProgramDetailMock,
  openDetailTab,
  parseServiceDetail,
  saveDetailEdit,
} from './general-detail-mock'

/**
 * STEP 4.1 PHASE 4 — 일반 상세 GET/PATCH 격리 E2E (G01~G06). 각 케이스는 실제 PATCH 본문과 재GET을 함께 검증한다.
 */
const ROW_ID = (type: string) =>
  DETAIL_FIXTURE.recruitments.find((r: any) => r.recruitmentType === type).id as number

const REMARK = /^비고란을 작성하세요/

async function setup(page: Page, fixture?: Record<string, any>) {
  await installIsolatedRegistrationNetwork(page)
  return installProgramDetailMock(page, fixture)
}

function rowPatches(patches: { path: string; body: any }[], rowId: number) {
  return patches.filter(p => p.path === `/api/admin/programs/${DETAIL_PROGRAM_ID}/recruitments/${rowId}`)
}

test.describe.configure({ mode: 'serial' })

test('G01 공통정보 수정: PATCH 반영·다른 값 유지·재GET', async ({ page }) => {
  const { mutations } = await setup(page)
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  const input = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
  await input.fill('G01 공고명 수정')
  await expect(input).toHaveValue('G01 공고명 수정')
  const { blocked, patches } = await saveDetailEdit(page, mutations)
  expect(blocked, `저장 차단: ${blocked}`).toBeNull()
  console.log('[G01] PATCH', JSON.stringify(patches.map(p => [p.path, Object.keys(p.body ?? {})])))
  const text = JSON.stringify(patches.map(p => p.body))
  expect(text).toContain('G01 공고명 수정')
  // 다른 값 유지: 세부 프로그램·후원사·제목은 그대로(보낸 경우)
  for (const p of patches) {
    if (p.body?.title != null) expect(p.body.title).toBe(DETAIL_FIXTURE.title)
    if (p.body?.detailedProgramId != null) expect(String(p.body.detailedProgramId)).toBe('163006')
  }
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  await expect(page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()).toHaveValue(
    'G01 공고명 수정'
  )
})

for (const [id, tab, type, edit] of [
  ['G02', '참여 기관 모집 정보', 'PARTICIPANT', 'institutions'],
  ['G03', '강사 모집 정보', 'INSTRUCTOR', 'instructors'],
] as const) {
  test(`${id} ${tab} 단독 수정: 해당 행만 PATCH·다른 역할 유지·재GET`, async ({ page }) => {
    const { mutations, getStored } = await setup(page)
    await openDetailTab(page, 'recruitment', tab)
    await enterDetailEdit(page, edit)
    const remark = page.getByPlaceholder(REMARK).first()
    await remark.fill(`${id} 비고 수정`)
    const { blocked, patches } = await saveDetailEdit(page, mutations)
    expect(blocked, `저장 차단: ${blocked}`).toBeNull()
    console.log(`[${id}] PATCH`, JSON.stringify(patches.map(p => p.path)))
    const own = rowPatches(patches, ROW_ID(type))
    expect(own.length, `${type} 행 PATCH`).toBeGreaterThan(0)
    expect(JSON.stringify(own.map(p => p.body))).toContain(`${id} 비고 수정`)
    for (const other of ['PARTICIPANT', 'INSTRUCTOR', 'VOLUNTEER'].filter(t => t !== type)) {
      expect(rowPatches(patches, ROW_ID(other)), `${other} 행은 PATCH 없음`).toHaveLength(0)
      const before = DETAIL_FIXTURE.recruitments.find((r: any) => r.recruitmentType === other)
      const after = getStored().recruitments.find((r: any) => r.recruitmentType === other)
      expect(after, `${other} 저장값 유지`).toEqual(before)
    }
    // 프로그램 PATCH가 같이 나갔다면 다른 역할 대상이 바뀌지 않아야 한다
    for (const p of patches.filter(x => x.path === `/api/admin/programs/${DETAIL_PROGRAM_ID}`)) {
      const sdj = parseServiceDetail(p.body)
      const ov = sdj?.registration?.overlay ?? {}
      if ('recruit.volunteer.volunteerTargets' in ov) expect(ov['recruit.volunteer.volunteerTargets']).toEqual(['university'])
      if ('recruit.instructor.recruitTargets' in ov) expect(ov['recruit.instructor.recruitTargets']).toEqual(['adult'])
    }
    await openDetailTab(page, 'recruitment', tab)
    await enterDetailEdit(page, edit)
    await expect(page.getByPlaceholder(REMARK).first()).toHaveValue(`${id} 비고 수정`)
  })
}

test('G04 봉사 면접: 마지막 클릭 직후 저장 → PATCH·재GET 유지', async ({ page }) => {
  const { mutations } = await setup(page)
  await openDetailTab(page, 'recruitment', '봉사자 모집 정보')
  await enterDetailEdit(page, 'volunteers')
  const chips = page.locator('.paragraph-chip--selected:visible')
  await expect(chips).toHaveCount(4, { timeout: 20_000 })
  const all = page.locator('.paragraph-chip:visible')
  // 4번째 해제 → 3번째 해제 → 4번째 재선택(마지막 클릭) 직후 바로 저장
  await all.nth(3).click()
  await all.nth(2).click()
  await all.nth(3).click()
  const { blocked, patches } = await saveDetailEdit(page, mutations)
  expect(blocked, `저장 차단: ${blocked}`).toBeNull()
  const slots = DETAIL_FIXTURE.recruitments.find((r: any) => r.recruitmentType === 'VOLUNTEER').interviewConfig
    .selectedSlotKeys as string[]
  const expected = [slots[0], slots[1], slots[3]]
  const own = rowPatches(patches, ROW_ID('VOLUNTEER'))
  console.log('[G04] PATCH', JSON.stringify(own.map(p => p.body?.interviewConfig?.selectedSlotKeys)))
  expect(own.length).toBeGreaterThan(0)
  for (const p of own) expect([...p.body.interviewConfig.selectedSlotKeys].sort()).toEqual([...expected].sort())
  for (const other of ['PARTICIPANT', 'INSTRUCTOR']) expect(rowPatches(patches, ROW_ID(other))).toHaveLength(0)
  await openDetailTab(page, 'recruitment', '봉사자 모집 정보')
  await enterDetailEdit(page, 'volunteers')
  await expect(page.locator('.paragraph-chip--selected:visible')).toHaveCount(3, { timeout: 20_000 })
})

test('G05 취소 → 원래 값, 즉시 저장 → 마지막 값, 재진입 stale 없음', async ({ page }) => {
  const { mutations } = await setup(page)
  await openDetailTab(page, 'recruitment', '강사 모집 정보')
  const original = DETAIL_FIXTURE.recruitments.find((r: any) => r.recruitmentType === 'INSTRUCTOR').remarks
  await enterDetailEdit(page, 'instructors')
  await page.getByPlaceholder(REMARK).first().fill('G05 취소될 값')
  const cancel = page.getByRole('button', { name: /^(취소|닫기)$/ }).last()
  await cancel.click()
  const confirm = page.getByRole('dialog').getByRole('button', { name: /^(확인|나가기|취소하기)$/ })
  if (await confirm.first().isVisible().catch(() => false)) await confirm.first().click()
  await expect(page).not.toHaveURL(/edit=instructors/, { timeout: 15_000 })
  expect(mutations.filter(m => m.method === 'PATCH'), '취소 시 PATCH 없음').toHaveLength(0)
  await enterDetailEdit(page, 'instructors')
  await expect(page.getByPlaceholder(REMARK).first()).toHaveValue(original)
  const remark = page.getByPlaceholder(REMARK).first()
  await remark.fill('G05 첫 값')
  await remark.fill('G05 마지막 값')
  const { blocked, patches } = await saveDetailEdit(page, mutations)
  expect(blocked, `저장 차단: ${blocked}`).toBeNull()
  const text = JSON.stringify(rowPatches(patches, ROW_ID('INSTRUCTOR')).map(p => p.body))
  expect(text).toContain('G05 마지막 값')
  expect(text).not.toContain('G05 첫 값')
  expect(text).not.toContain('G05 취소될 값')
  await openDetailTab(page, 'recruitment', '강사 모집 정보')
  await enterDetailEdit(page, 'instructors')
  await expect(page.getByPlaceholder(REMARK).first()).toHaveValue('G05 마지막 값')
})

test('G06 Legacy/Unknown sidecar·빈값 계약 보존 + 한 항목 수정', async ({ page }) => {
  const fixture = structuredClone(DETAIL_FIXTURE)
  const sdj = parseServiceDetail(fixture) ?? {}
  const SIDECAR = { keep: 'x', zero: 0, no: false, empty: '', nil: null, list: [] }
  sdj.e2eUnknownSidecar = SIDECAR
  sdj.registration = sdj.registration ?? {}
  sdj.registration.overlay = { ...(sdj.registration.overlay ?? {}), 'e2e.unknown.sidecar': SIDECAR }
  fixture.serviceDetailJson = JSON.stringify(sdj)
  const { mutations, getStored } = await setup(page, fixture)
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  await page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first().fill('G06 공고명')
  const { blocked, patches } = await saveDetailEdit(page, mutations)
  expect(blocked, `저장 차단: ${blocked}`).toBeNull()
  const withSdj = patches.map(p => parseServiceDetail(p.body)).filter(Boolean) as Record<string, any>[]
  console.log('[G06] PATCH sdj', JSON.stringify(withSdj.map(s => ({ keys: Object.keys(s), root: s.e2eUnknownSidecar, ov: s.registration?.overlay?.['e2e.unknown.sidecar'] }))))
  // 부분 PATCH: sidecar를 보냈다면 값 그대로여야 하고, 안 보냈다면 병합 후 저장값에 남아야 한다
  for (const s of withSdj) {
    if ('e2eUnknownSidecar' in s) expect(s.e2eUnknownSidecar).toEqual(SIDECAR)
    const ov = s.registration?.overlay
    if (ov && 'e2e.unknown.sidecar' in ov) expect(ov['e2e.unknown.sidecar']).toEqual(SIDECAR)
    if (ov && 'recruit.volunteer.volunteerTargets' in ov) expect(ov['recruit.volunteer.volunteerTargets']).toEqual(['university'])
    if (ov && 'recruit.instructor.recruitTargets' in ov) expect(ov['recruit.instructor.recruitTargets']).toEqual(['adult'])
  }
  const after = parseServiceDetail(getStored())!
  expect(after.e2eUnknownSidecar, '재GET root sidecar').toEqual(SIDECAR)
  expect(after.registration?.overlay?.['e2e.unknown.sidecar'], '재GET overlay sidecar').toEqual(SIDECAR)
  expect(getStored().recruitments, '모집 행 유지').toEqual(fixture.recruitments)
  expect(JSON.stringify(patches.map(p => p.body))).toContain('G06 공고명')
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  await expect(page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()).toHaveValue('G06 공고명')
})
