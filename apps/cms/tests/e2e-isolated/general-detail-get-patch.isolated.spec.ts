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
  expect(after.e2eUnknownSidecar, '재GET root sidecar(미전송 → 유지)').toEqual(SIDECAR)
  // RFC-7396: FE가 그대로 되돌려 보낸 내부 null 은 BE에서 키 삭제(null→부재). 나머지 빈값은 보존
  const { nil: _nil, ...SIDECAR_WITHOUT_NULL } = SIDECAR
  expect(after.registration?.overlay?.['e2e.unknown.sidecar'], '재GET overlay sidecar(null 키는 삭제)').toEqual(SIDECAR_WITHOUT_NULL)
  expect(getStored().recruitments, '모집 행 유지').toEqual(fixture.recruitments)
  expect(JSON.stringify(patches.map(p => p.body))).toContain('G06 공고명')
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  await expect(page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()).toHaveValue('G06 공고명')
})

/** G07 (merge-patch null 감사) — 저장값이 있는 overlay 키에 FE가 null/''을 보내 BE에서 삭제되는지 */
test('G07 저장된 overlay 값을 null/빈값으로 덮어 보내지 않는다(공통정보·강사 모집 저장)', async ({ page }) => {
  const fixture = structuredClone(DETAIL_FIXTURE)
  const sdj = parseServiceDetail(fixture) ?? {}
  const SEEDED: Record<string, unknown> = {
    'generalRegistration.kpi.dispatchedSchool': 2,
    'generalRegistration.kpi.dispatchedClass': 3,
    'generalRegistration.basicInfo.operationAnchorIso': '2027-01-01',
    'generalRegistration.educationScheduleSettings.singleDateIso': '2027-01-10',
    'generalRegistration.educationScheduleSettings.periodDateIso': '2027-01-10',
    'generalRegistration.educationCurriculum.preEducationScheduleLine': '2027.01.05 사전교육',
    'generalRegistration.educationCurriculum.preEducationScheduleName': '사전교육',
    'recruitInstructor.detailInfo.learningSupportContent': '<p>강사 학습 지원</p>',
    'recruitVolunteer.detailInfo.learningSupportContent': '<p>봉사 학습 지원</p>',
  }
  sdj.registration.overlay = { ...sdj.registration.overlay, ...SEEDED }
  // canonical KPI(generalCommonInfo.kpi)도 0이 아닌 값으로 — overlay null 미러가 canonical을 0으로 덮는지 확인
  sdj.generalCommonInfo.kpi = { ...sdj.generalCommonInfo.kpi, finalSchools: 5, finalClasses: 7 }
  fixture.serviceDetailJson = JSON.stringify(sdj)
  fixture.recruitments = fixture.recruitments.map((r: any) =>
    r.recruitmentType === 'INSTRUCTOR' ? { ...r, learningSupportContent: '<p>행 학습 지원</p>', announcementTitle: '행 공고' } : r
  )
  const { mutations, getStored } = await setup(page, fixture)
  const report: Record<string, unknown> = {}
  const collect = (label: string, patches: { path: string; body: any }[]) => {
    for (const p of patches) {
      const ov = parseServiceDetail(p.body)?.registration?.overlay
      if (/recruitments\/\d+$/.test(p.path)) {
        report[`${label}:row.learningSupportContent`] = p.body?.learningSupportContent
        report[`${label}:row.announcementTitle`] = p.body?.announcementTitle
      }
      const iri = parseServiceDetail(p.body)?.generalCommonInfo?.instructorRecruitmentInfo
      if (iri && 'learningSupportContent' in iri) report[`${label}:gci.iri.learningSupportContent`] = iri.learningSupportContent
      const gk = parseServiceDetail(p.body)?.generalCommonInfo?.kpi
      if (gk) report[`${label}:gci.kpi`] = gk
      if (!ov) continue
      for (const k of Object.keys(SEEDED)) report[`${label}:${k}`] = k in ov ? ov[k] : '<omitted>'
    }
  }
  await openDetailTab(page, 'info')
  await enterDetailEdit(page, 'info')
  await page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first().fill('G07 공고명')
  const a = await saveDetailEdit(page, mutations)
  expect(a.blocked, `저장 차단: ${a.blocked}`).toBeNull()
  collect('common', a.patches)
  await openDetailTab(page, 'recruitment', '강사 모집 정보')
  await enterDetailEdit(page, 'instructors')
  await page.getByPlaceholder(REMARK).first().fill('G07 강사 비고')
  const b = await saveDetailEdit(page, mutations)
  expect(b.blocked, `저장 차단: ${b.blocked}`).toBeNull()
  collect('instructor', b.patches)
  console.log('[G07] sent', JSON.stringify(report))
  console.log('[G07] stored gci.kpi after', JSON.stringify(parseServiceDetail(getStored())?.generalCommonInfo?.kpi))
  for (const [k, v] of Object.entries(report)) {
    if (k.endsWith(':gci.kpi')) {
      expect.soft((v as any).finalSchools, `${k} finalSchools`).toBe(5)
      expect.soft((v as any).finalClasses, `${k} finalClasses`).toBe(7)
    }
  }
  // 의도된 비우기: dispatched*는 canonical generalCommonInfo.kpi가 SSOT(registration-overlay-sync.ts:76-78,
  // general-registration-overlay-from-program.ts:779-781), preEducation*은 nested 커리큘럼 미러(…:453, 699-723)
  const INTENTIONAL = new Set([
    'generalRegistration.kpi.dispatchedSchool',
    'generalRegistration.kpi.dispatchedClass',
    'generalRegistration.educationCurriculum.preEducationScheduleLine',
    'generalRegistration.educationCurriculum.preEducationScheduleName',
  ])
  const lost = Object.entries(report).filter(([k, v]) => {
    const key = k.split(':')[1]
    if (!(key in SEEDED) || INTENTIONAL.has(key)) return false
    return v !== '<omitted>' && v !== SEEDED[key]
  })
  expect(lost, 'merge-patch에서 저장값을 지우거나 바꾸는 키').toEqual([])
  expect(report['instructor:row.learningSupportContent'], '강사 행 학습지원 유지').toBe('<p>행 학습 지원</p>')
  expect(report['instructor:row.announcementTitle'], '강사 행 공고 유지').toBe('행 공고')
  if ('instructor:gci.iri.learningSupportContent' in report) {
    expect(report['instructor:gci.iri.learningSupportContent']).toBe('<p>행 학습 지원</p>')
  }
  const kpiAfter = parseServiceDetail(getStored())?.generalCommonInfo?.kpi
  expect(kpiAfter?.finalSchools, '재GET canonical KPI').toBe(5)
  expect(kpiAfter?.finalClasses).toBe(7)
})
