import { expect, test, type Page } from '@playwright/test'
import { UjatProgramRegistrationPage } from '../e2e/pages/ujat-program-registration.page'
import { installIsolatedRegistrationNetwork } from './install-isolated-network'

async function selectRecruitTab(page: Page, label: string, step: string) {
  await page
    .getByRole('tablist', { name: 'UJAT 모집 정보' })
    .getByRole('tab', { name: label })
    .click()
  await expect(page).toHaveURL(new RegExp(`ujatStep=${step}`), { timeout: 15_000 })
}

function overlayKeysFromCreateBody(body: unknown): string[] {
  if (body == null || typeof body !== 'object') return []
  const serviceDetailJson = (body as { serviceDetailJson?: unknown }).serviceDetailJson
  const raw =
    typeof serviceDetailJson === 'string'
      ? (() => {
          try {
            return JSON.parse(serviceDetailJson) as { overlay?: Record<string, unknown> }
          } catch {
            return {}
          }
        })()
      : (serviceDetailJson as { overlay?: Record<string, unknown> } | undefined)
  return Object.keys(raw?.overlay ?? {})
}

async function confirmDraftSave(page: Page) {
  await page.getByRole('button', { name: '임시저장' }).click()
  const overwrite = page.getByRole('dialog').filter({ hasText: '임시 저장본 덮어쓰기' })
  if (await overwrite.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await overwrite.getByRole('button', { name: '임시 저장', exact: true }).click()
  }
  const savedDialog = page.getByRole('dialog').filter({ hasText: '임시 저장 완료' })
  await expect(savedDialog).toBeVisible({ timeout: 20_000 })
  await savedDialog.getByRole('button', { name: '확인' }).click()
}

function recruitmentsFromCreateBody(body: unknown): Array<Record<string, unknown>> {
  if (body == null || typeof body !== 'object') return []
  const rows = (body as { recruitments?: unknown }).recruitments
  return Array.isArray(rows)
    ? rows.filter((row): row is Record<string, unknown> => row != null && typeof row === 'object')
    : []
}

function capacitiesFromPutBody(body: unknown): Array<Record<string, unknown>> {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return []
  const capacities = (body as { capacities?: unknown }).capacities
  return Array.isArray(capacities)
    ? capacities.filter(
        (row): row is Record<string, unknown> => row != null && typeof row === 'object'
      )
    : []
}

function programIdFromPath(path: string): string | undefined {
  return path.match(/\/programs\/([^/]+)\//)?.[1]
}

async function completeNewUjatRegistrationWizard(page: Page, log: Awaited<ReturnType<typeof installIsolatedRegistrationNetwork>>) {
  await page.goto('/programs/ujat')
  await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })

  const registration = new UjatProgramRegistrationPage(page)
  await registration.openNewRegistration()
  await expect(page).toHaveURL(/\/programs\/ujat\?.*new=1/, { timeout: 30_000 })
  await expect(page.getByPlaceholder('대표 프로그램명을 입력하세요').first()).toHaveValue(
    registration.programTitle
  )
  await expect(page.getByPlaceholder('목표값 입력').first()).not.toHaveValue('', {
    timeout: 15_000,
  })

  await registration.goToRecruitment()
  await expect(page.getByRole('heading', { name: '참여 기관 모집 정보' })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByPlaceholder('담당 문의처').first()).not.toHaveValue('')

  await selectRecruitTab(page, '상반기 봉사자 모집 정보', 'recruit-volunteer-h1')
  const h1Activity = page.getByPlaceholder('활동 기수').first()
  await expect(h1Activity).toBeVisible({ timeout: 15_000 })
  const h1Value = await h1Activity.inputValue()
  expect(h1Value.trim().length).toBeGreaterThan(0)

  await selectRecruitTab(page, '하반기 봉사자 모집 정보', 'recruit-volunteer-h2')
  const h2Activity = page.getByPlaceholder('활동 기수').first()
  await expect(h2Activity).toBeVisible({ timeout: 15_000 })
  const h2Value = await h2Activity.inputValue()
  expect(h2Value.trim().length).toBeGreaterThan(0)

  const editedH2 = h2Value === '88' ? '77' : '88'
  await h2Activity.fill(editedH2)
  await selectRecruitTab(page, '상반기 봉사자 모집 정보', 'recruit-volunteer-h1')
  await expect(page.getByPlaceholder('활동 기수').first()).toHaveValue(h1Value)
  await selectRecruitTab(page, '하반기 봉사자 모집 정보', 'recruit-volunteer-h2')
  await expect(page.getByPlaceholder('활동 기수').first()).toHaveValue(editedH2)

  await registration.goToApplication()
  await expect(page.getByRole('tab', { name: '참여 기관 신청 정보' })).toBeVisible()
  await page
    .getByRole('tablist', { name: 'UJAT 신청 정보' })
    .getByRole('tab', { name: '봉사자 신청 정보' })
    .click()
  await expect(page).toHaveURL(/ujatStep=application-ujat-volunteer/)
  await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
  await expect
    .poll(() => log.createProgram, { timeout: 90_000 })
    .not.toBeNull()
}

test.describe.configure({ mode: 'serial' })

test.describe('UJAT 신규 등록 Typed RHF 격리 Mock E2E', () => {
  test('시나리오 A/C — 자동입력 후 Wizard 전체와 Mock CREATE를 검증한다', async ({ page }) => {
    test.setTimeout(360_000)
    const log = await installIsolatedRegistrationNetwork(page)
    await completeNewUjatRegistrationWizard(page, log)
    await expect
      .poll(() => log.regionCapacityPutStatuses.length, { timeout: 90_000 })
      .toBeGreaterThan(0)
    const successDialog = page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })
    if (await successDialog.isVisible().catch(() => false)) {
      await successDialog.getByRole('button', { name: '확인', exact: true }).click()
    }

    expect(log.unexpected, `허용하지 않은 API: ${log.unexpected.join(', ')}`).toEqual([])
    expect(log.continuedApi).toEqual([])
    expect(log.createProgram, 'Program CREATE가 캡처되어야 합니다').not.toBeNull()
    expect(log.createProgramResponse).toMatchObject({ id: 91001 })
    const overlayKeys = overlayKeysFromCreateBody(log.createProgram?.body)
    expect(overlayKeys.some(key => key.startsWith('ujat.basicInfo.'))).toBe(false)
    expect(overlayKeys.some(key => key.startsWith('ujat.kpi.'))).toBe(false)
    expect(overlayKeys.some(key => key.startsWith('ujat.h1.') || key.startsWith('ujat.h2.'))).toBe(
      false
    )
    expect(overlayKeys.some(key => key.startsWith('ujat.recruit.'))).toBe(false)
    expect(overlayKeys).not.toContain('ujat.wage.paymentItemValues')
    expect(overlayKeys).not.toContain('ujat.capacity.byRegion')

    const recruitments = recruitmentsFromCreateBody(log.createProgram?.body)
    expect(recruitments.map(row => [row.recruitmentType, row.recruitTerm ?? null])).toEqual([
      ['PARTICIPANT', null],
      ['VOLUNTEER', 'FIRST_HALF'],
      ['VOLUNTEER', 'SECOND_HALF'],
    ])
    expect(recruitments.filter(row => row.recruitmentType === 'PARTICIPANT')[0]?.targetType).toBe(
      'ORGANIZATION'
    )

    expect(log.typedDetailPuts).toHaveLength(1)
    expect(log.physicalSchedulePuts).toHaveLength(6)
    expect(log.formBindings.length).toBeGreaterThan(0)
    expect(log.regionCapacityPuts).toHaveLength(1)
    expect(log.regionCapacityPutStatuses).toEqual([200])
    const regionCapacityPut = log.regionCapacityPuts[0]
    expect(regionCapacityPut.path).toMatch(
      /^\/api\/admin\/program-execution\/programs\/\d+\/ujat\/region-capacities$/
    )
    const capacityRows = capacitiesFromPutBody(regionCapacityPut.body)
    const capacityRegionCodes = new Set(capacityRows.map(row => row.educationRegionCode))
    expect(capacityRegionCodes.size).toBeGreaterThan(1)
    expect(capacityRows).toHaveLength(capacityRegionCodes.size * 2)
    expect(new Set(capacityRows.map(row => row.semesterType))).toEqual(
      new Set(['FIRST_HALF', 'SECOND_HALF'])
    )
    expect(
      capacityRows.every(
        row =>
          typeof row.educationRegionCode === 'string' &&
          typeof row.maxClassCount === 'number' &&
          row.maxClassCount >= 0 &&
          typeof row.maxVolunteerCount === 'number' &&
          row.maxVolunteerCount >= 0
      )
    ).toBe(true)
    const capacityProgramId = programIdFromPath(regionCapacityPut.path)
    expect(capacityProgramId).toBeTruthy()
    expect(capacityProgramId).toBe(String(log.createProgramResponse?.id))
    expect(
      log.regionCapacityGetResponses.some(
        response =>
          response.programId === capacityProgramId &&
          JSON.stringify(response.rows) === JSON.stringify(capacityRows)
      ),
      'Region Capacity PUT 이후 동일 programId의 GET에서 전체 H1/H2 정원이 복원되어야 합니다'
    ).toBe(true)
    const followupProgramIds = [
      ...log.typedDetailPuts,
      ...log.physicalSchedulePuts,
      ...log.regionCapacityPuts,
    ].map(item => programIdFromPath(item.path))
    expect(new Set(followupProgramIds)).toEqual(new Set([capacityProgramId]))
    const mutationOrder = log.mutations.map(item => `${item.method} ${item.path}`)
    const createCalls = mutationOrder.filter(item => item === 'POST /api/admin/programs')
    expect(createCalls).toHaveLength(1)
    const createIndex = mutationOrder.findIndex(item => item === 'POST /api/admin/programs')
    const typedIndex = mutationOrder.findIndex(item => item.includes('/ujat/typed-detail'))
    const capacityIndex = mutationOrder.findIndex(item => item.includes('/ujat/region-capacities'))
    expect(createIndex).toBeGreaterThanOrEqual(0)
    expect(typedIndex).toBeGreaterThan(createIndex)
    expect(capacityIndex).toBeGreaterThan(typedIndex)
  })

  test('Region Capacity 500 이후 동일 programId PUT 재시도는 CREATE를 중복하지 않는다', async ({
    page,
  }) => {
    test.setTimeout(360_000)
    const log = await installIsolatedRegistrationNetwork(page, {
      failFirstRegionCapacityPut: true,
    })
    await completeNewUjatRegistrationWizard(page, log)

    await expect
      .poll(() => log.regionCapacityPutStatuses.length, { timeout: 90_000 })
      .toBeGreaterThan(0)
    expect(log.regionCapacityPutStatuses).toEqual([500])
    await expect(page.getByRole('dialog').filter({ hasText: '프로그램 등록 실패' })).toBeVisible({
      timeout: 30_000,
    })
    expect(log.mutations.filter(item => item.path === '/api/admin/programs')).toHaveLength(1)
    expect(log.createProgramResponse).toMatchObject({ id: 91001 })

    const failedPut = log.regionCapacityPuts[0]
    expect(failedPut).toBeDefined()
    const programId = programIdFromPath(failedPut.path)
    expect(programId).toBeTruthy()
    const failedRows = capacitiesFromPutBody(failedPut.body)
    const failedRegionCodes = new Set(failedRows.map(row => row.educationRegionCode))
    expect(failedRegionCodes.size).toBeGreaterThan(1)
    expect(failedRows).toHaveLength(failedRegionCodes.size * 2)
    const retryRows = failedRows.map((row, index) =>
      index === 0 ? { ...row, maxClassCount: 0, maxVolunteerCount: 0 } : row
    )

    const retryResult = await page.evaluate(
      async ({ programId: retryProgramId, capacities }) => {
        const response = await fetch(
          `/api/admin/program-execution/programs/${retryProgramId}/ujat/region-capacities`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capacities }),
          }
        )
        return {
          status: response.status,
          body: (await response.json()) as { capacities?: unknown[] },
        }
      },
      { programId, capacities: retryRows }
    )
    expect(retryResult.status).toBe(200)
    await expect
      .poll(() => log.regionCapacityPutStatuses.length, { timeout: 15_000 })
      .toBe(2)
    expect(log.regionCapacityPutStatuses).toEqual([500, 200])
    expect(log.regionCapacityPuts).toHaveLength(2)
    expect(log.mutations.filter(item => item.path === '/api/admin/programs')).toHaveLength(1)
    expect(programIdFromPath(log.regionCapacityPuts[1]!.path)).toBe(programId)

    const getResult = await page.evaluate(async retryProgramId => {
      const response = await fetch(
        `/api/admin/program-execution/programs/${retryProgramId}/ujat/region-capacities`
      )
      return {
        status: response.status,
        body: (await response.json()) as { capacities?: unknown[] },
      }
    }, programId)
    expect(getResult.status).toBe(200)
    expect(getResult.body.capacities).toEqual(retryRows)
    expect((getResult.body.capacities?.[0] as Record<string, unknown>).maxClassCount).toBe(0)
    expect((getResult.body.capacities?.[0] as Record<string, unknown>).maxVolunteerCount).toBe(0)
    expect(log.regionCapacityGetResponses.at(-1)).toMatchObject({
      programId,
      status: 200,
      rows: retryRows,
    })
  })

  test('시나리오 B — 임시저장 후 재진입하면 Typed 값이 복원되고 다음 단계로 이동한다', async ({
    page,
  }) => {
    test.setTimeout(360_000)
    const log = await installIsolatedRegistrationNetwork(page)
    await page.goto('/programs/ujat')
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })

    const registration = new UjatProgramRegistrationPage(page)
    await registration.openNewRegistration()
    await registration.goToRecruitment()
    await expect(page.getByRole('heading', { name: '참여 기관 모집 정보' })).toBeVisible({
      timeout: 30_000,
    })
    const contact = page.getByPlaceholder('담당 문의처').first()
    await expect(contact).not.toHaveValue('')
    const savedContact = await contact.inputValue()

    await confirmDraftSave(page)
    const storedRecruitments = await page.evaluate(() => {
      const raw = localStorage.getItem('cms.jakorea.registrationProgramDrafts.v1')
      if (!raw) return []
      try {
        const file = JSON.parse(raw) as {
          byProgramType?: { UJAT?: { recruitments?: unknown[] } }
        }
        return Array.isArray(file.byProgramType?.UJAT?.recruitments)
          ? file.byProgramType.UJAT.recruitments
          : []
      } catch {
        return []
      }
    })
    expect(storedRecruitments.length, 'Typed 모집 행이 Draft payload에 저장되어야 합니다').toBe(
      3
    )
    expect(
      storedRecruitments.some(
        row =>
          row != null &&
          typeof row === 'object' &&
          (row as { recruitTerm?: unknown }).recruitTerm === 'SECOND_HALF' &&
          (row as { interviewConfig?: unknown }).interviewConfig != null
      ),
      'H2 행과 interviewConfig가 Draft에 있어야 합니다'
    ).toBe(true)
    expect(
      storedRecruitments.some(
        row =>
          row != null &&
          typeof row === 'object' &&
          (row as { contactName?: unknown }).contactName === savedContact
      ),
      `문의처가 모집 행에 있어야 합니다: ${JSON.stringify(
        storedRecruitments.map(row =>
          row != null && typeof row === 'object'
            ? {
                recruitmentType: (row as { recruitmentType?: unknown }).recruitmentType,
                contactName: (row as { contactName?: unknown }).contactName,
              }
            : row
        )
      )}`
    ).toBe(true)
    await page
      .getByRole('banner')
      .filter({ hasText: 'UJAT 프로그램 등록' })
      .getByLabel('닫기')
      .click()
    const leave = page.getByRole('dialog').filter({ hasText: '작성 취소 안내' })
    if (await leave.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await leave.getByRole('button', { name: '저장 안 함' }).click()
    }
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /신규 등록/ }).click()
    const notice = page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
    await expect(notice).toBeVisible({ timeout: 20_000 })
    await notice.getByRole('radio', { name: '이어서 작성' }).check()
    await notice.getByRole('button', { name: '이어서 작성' }).click()
    await expect(page.getByText('UJAT 프로그램 등록', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page).toHaveURL(/ujatStep=recruit-/)
    await expect(page.getByPlaceholder('담당 문의처').first()).toHaveValue(savedContact)
    await selectRecruitTab(page, '상반기 봉사자 모집 정보', 'recruit-volunteer-h1')
    await selectRecruitTab(page, '하반기 봉사자 모집 정보', 'recruit-volunteer-h2')
    await registration.goToApplication()
    await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible()
    expect(log.unexpected).toEqual([])
  })
})
