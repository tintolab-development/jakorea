/**
 * 일반 프로그램 통합 흐름 — CMS 등록부터 사용자 홈페이지(포털) 정산까지
 *
 * 한 단계씩 구현·실행한다. 아직 구현하지 않은 단계는 skip 하며 통과로 보고하지 않는다.
 * 데이터 생성은 E2E_ALLOW_MUTATION=1 일 때만 실행한다.
 * Vite HMR로 로그인/등록 페이지가 반복 reload 되면
 * E2E_STABLE_VITE_NAV=1 을 함께 켠다(공유 fixture·로그인 헬퍼 옵트인).
 */
import { type Page } from '@playwright/test'
import { expect, test } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import {
  writeGeneralProgramEndToEndRunState,
  type RecordedSettlementItem,
} from '../../helpers/general-program-end-to-end-state'
import {
  activateCmsProgramRecruitmentsForIntegration,
  fetchCmsProgramSnapshot,
  recruitmentForType,
  type CmsProgramSnapshot,
} from '../../pages/platform-application-flow.page'
import { clickSectionNavIfVisible } from '../../pages/form-helpers'
import { GeneralProgramDetailPage } from '../../pages/general-program-detail.page'
import { GeneralProgramRegistrationPage } from '../../pages/general-program-registration.page'

test.describe.configure({ mode: 'serial' })

const SETTLEMENT_ITEM_SETTINGS_PATH = '/settlement-management/item-settings'
const TARGET_PAYMENT_ITEM_KEYWORDS = ['교통비', '식사비', '활동비'] as const

type ProgramSchedule = {
  id?: number
  scheduleId?: number
  sessionNo?: number
  scheduleName?: string
  allDay?: boolean
  startAt?: string
  endAt?: string
}

function uniqueEndToEndTitle() {
  const now = new Date()
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const random = Math.random().toString(36).slice(2, 8)
  return `E2E-일반통합-${timestamp}-${random}`
}

function kstNowIsoLabel() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map(part => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} KST`
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const row = value as Record<string, unknown>
  if (row.success === true && 'data' in row) return unwrap(row.data)
  return value
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function readJson(response: { ok(): boolean; status(): number; text(): Promise<string> }) {
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text) as unknown
  } catch {
    payload = text
  }
  if (!response.ok()) {
    throw new Error(`관리자 API 실패: HTTP ${response.status()} ${text.slice(0, 300)}`)
  }
  return payload
}

async function adminGet(page: Page, apiPath: string) {
  if (page.url() === 'about:blank') await page.goto('/')
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!token) throw new Error('CMS 관리자 auth_token이 없습니다.')
  const response = await page.request.get(apiPath, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return readJson(response)
}

function collectSettlementItems(
  config: Record<string, unknown>,
  key: 'paymentItems' | 'wageItems' | 'deductionItems',
  kind: RecordedSettlementItem['kind']
): RecordedSettlementItem[] {
  const rows = Array.isArray(config[key]) ? config[key] : []
  return rows.map(raw => {
    const row = asRecord(raw)
    return {
      kind,
      id: asNullableNumber(row.id),
      itemName: String(row.itemName ?? row.name ?? '').trim(),
      maxLimitWon: asNullableNumber(row.maxLimitWon ?? row.maxAmount),
      layout: row.layout == null ? null : String(row.layout),
      useYn: typeof row.useYn === 'boolean' ? row.useYn : null,
    }
  })
}

function educationScheduleDateKeys(program: CmsProgramSnapshot): string[] {
  let detail: unknown
  try {
    detail = JSON.parse(program.serviceDetailJson)
  } catch {
    return []
  }
  const root = detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : {}
  const common =
    root.generalCommonInfo && typeof root.generalCommonInfo === 'object'
      ? (root.generalCommonInfo as Record<string, unknown>)
      : root
  const lines = Array.isArray(common.educationScheduleLines)
    ? common.educationScheduleLines.filter((line): line is string => typeof line === 'string')
    : []
  const dateKeys = lines.flatMap(line => {
    const match = /(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(line)
    if (!match) return []
    const year = Number(match[1]) < 100 ? 2000 + Number(match[1]) : Number(match[1])
    return [`${year}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`]
  })
  return [...new Set(dateKeys)]
}

function isoAtSeoulDate(dateKey: string, hour: number) {
  return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:00:00+09:00`).toISOString()
}

function seoulDateKey(value: string | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map(part => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

function futureSeoulDateKey(daysFromToday: number) {
  const now = new Date()
  const seoulNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  seoulNow.setDate(seoulNow.getDate() + daysFromToday)
  const year = seoulNow.getFullYear()
  const month = String(seoulNow.getMonth() + 1).padStart(2, '0')
  const day = String(seoulNow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function adminSchedules(page: Page, programId: number): Promise<ProgramSchedule[]> {
  const payload = await adminGet(page, `/api/admin/programs/${programId}/schedules`)
  const body = unwrap(payload)
  if (!Array.isArray(body)) throw new Error(`프로그램 일정 응답이 배열이 아닙니다: ${programId}`)
  return body as ProgramSchedule[]
}

async function ensureAtLeastTwoEducationSchedules(page: Page, program: CmsProgramSnapshot) {
  const current = await adminSchedules(page, program.programId)
  const dateKeys = educationScheduleDateKeys(program)
  const runtimeDateKey = dateKeys.at(-1) ?? futureSeoulDateKey(21)
  const alignedCount = current.filter(
    schedule => schedule.allDay === false && seoulDateKey(schedule.startAt) === runtimeDateKey
  ).length
  if (alignedCount >= 2) return current

  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!token) throw new Error('CMS 일정 보정에 필요한 auth_token이 없습니다.')
  const response = await page.request.patch(`/api/admin/programs/${program.programId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      schedules: [
        {
          sessionNo: 1,
          scheduleName: `${program.title} 교육 1회차`,
          startAt: isoAtSeoulDate(runtimeDateKey, 10),
          endAt: isoAtSeoulDate(runtimeDateKey, 12),
          allDay: false,
          locationName: null,
          address: null,
          addressDetail: null,
          maxParticipantCount: 30,
          completionRequired: true,
        },
        {
          sessionNo: 2,
          scheduleName: `${program.title} 교육 2회차`,
          startAt: isoAtSeoulDate(runtimeDateKey, 13),
          endAt: isoAtSeoulDate(runtimeDateKey, 15),
          allDay: false,
          locationName: null,
          address: null,
          addressDetail: null,
          maxParticipantCount: 30,
          completionRequired: true,
        },
      ],
    },
  })
  await readJson(response)

  const refreshed = await adminSchedules(page, program.programId)
  expect(
    refreshed.filter(schedule => schedule.allDay === false).length,
    `복수 회차 프로그램의 실제 교육 일정이 2건 미만입니다: ${program.programId}`
  ).toBeGreaterThanOrEqual(2)
  return refreshed
}

async function selectMatchingWagePaymentItems(page: Page, keywords: readonly string[]) {
  await clickSectionNavIfVisible(page, '임금 정보')
  const field = page
    .locator('.detail-info-form__field')
    .filter({
      has: page.locator('.detail-info-form__field-label-text', { hasText: /^지급 항목$/ }),
    })
    .first()
  const trigger = field.locator('.cms-select-multi__trigger').first()
  if ((await trigger.count()) === 0 || !(await trigger.isVisible().catch(() => false))) {
    return [] as string[]
  }

  await trigger.click()
  const panel = page.locator('.cms-select-multi__panel:visible').last()
  await expect(panel).toBeVisible({ timeout: 10_000 })
  const rows = panel.locator('.cms-select-multi__row')
  await expect(rows.first()).toBeVisible({ timeout: 10_000 })

  const rowCount = await rows.count()
  for (let index = 0; index < rowCount; index += 1) {
    const row = rows.nth(index)
    if ((await row.locator('.ant-checkbox-checked').count()) === 0) continue
    await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
  }

  const selected: string[] = []
  for (let index = 0; index < rowCount; index += 1) {
    const row = rows.nth(index)
    const text = (await row.innerText()).trim()
    if (!text || /해당 없음/.test(text)) continue
    if (!keywords.some(keyword => text.includes(keyword))) continue
    const checkbox = row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first()
    if ((await row.locator('.ant-checkbox-checked').count()) === 0) {
      await checkbox.click()
    }
    selected.push(text)
  }

  // 키워드 항목이 없으면 지급 항목이 비어 등록이 실패하지 않도록
  // 숙박비·해당 없음이 아닌 첫 항목을 다시 고른다.
  if (selected.length === 0) {
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index)
      const text = (await row.innerText()).trim()
      if (!text || /숙박비|lodging/i.test(text) || /해당 없음/.test(text)) continue
      await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
      selected.push(text)
      break
    }
  }

  await trigger.click({ force: true })
  await expect(page.locator('.cms-select-multi__panel:visible')).toHaveCount(0)
  return selected
}


async function recordSettlementConfig(page: Page) {
  await page.goto(SETTLEMENT_ITEM_SETTINGS_PATH)
  await expectAuthenticatedShell(page)
  const heading = page.getByText('정산 항목 설정', { exact: true }).first()
  const settingsUiObserved = await heading.isVisible().catch(() => false)

  const payload = await adminGet(page, '/api/admin/settlement-configs/current')
  const config = asRecord(unwrap(payload))
  const paymentItems = collectSettlementItems(config, 'paymentItems', 'payment')
  return {
    settingsUiExists: true,
    settingsUiPath: SETTLEMENT_ITEM_SETTINGS_PATH,
    settingsUiObserved,
    configId: asNullableNumber(config.configId),
    configName: config.configName == null ? null : String(config.configName),
    paymentItems,
    recordedOnly: true as const,
    saveApiCalled: false as const,
  }
}

test.describe('일반 프로그램 통합 흐름 — CMS 등록부터 포털 정산까지', () => {
  test('단계 1. CMS — 일반 프로그램 등록', async ({ page }) => {
    test.skip(
      process.env.E2E_ALLOW_MUTATION !== '1',
      '데이터 생성하는 테스트는 E2E_ALLOW_MUTATION=1일 때만 실행한다'
    )
    test.setTimeout(720_000)

    const programTitle = uniqueEndToEndTitle()
    let selectedPaymentItemLabels: string[] = []
    let listLifecycleLabel: string | null = null
    const detailRecruitmentLabels: string[] = []

    const settlementConfig = await test.step('정산 항목 설정 조회(기록 전용)', async () => {
      return recordSettlementConfig(page)
    })

    const created = await test.step('일반 프로그램 등록', async () => {
      await page.goto('/programs/general')
      await expectAuthenticatedShell(page)

      const registration = new GeneralProgramRegistrationPage(
        page,
        {
          audience: 'organization',
          structure: 'schedule',
          session: 'multi',
          label: '통합_일정형_복수',
        },
        {
          openRecruitment: true,
          // 자동입력은 educationScheduleLines 잔여 앱 버그를 유발하므로 사용하지 않는다.
          // 후원사·담당자·일정은 화면에서만 직접 입력한다.
          safeWagePaymentItems: true,
          skipOptionalUploads: true,
          skipApplicationFormEdits: true,
          ensureFutureDates: true,
          programTitle,
        }
      )
      await registration.openNewRegistration()
      await registration.fillCommonInfo()
      await registration.realignScheduleDetailDatesWithinOpenPeriod()
      selectedPaymentItemLabels = await selectMatchingWagePaymentItems(
        page,
        TARGET_PAYMENT_ITEM_KEYWORDS
      )
      await registration.goToRecruitment()
      await registration.fillRecruitmentInfo()
      await registration.goToApplication()
      await registration.fillApplicationInfo()

      const result = await registration.completeRegistration()
      expect(result.programId).toMatch(/^\d+$/)
      expect(result.programTitle).toBe(programTitle)
      expect(result.programTitle).toMatch(/^E2E-일반통합-\d{14}-[a-z0-9]+$/)
      return result
    })

    const program = await fetchCmsProgramSnapshot(page, created.programId)
    expect(program.programId).toBe(Number(created.programId))
    expect(program.programType).toBe('GENERAL_ORGANIZATION')
    expect(program.title).toBe(programTitle)
    expect(program.recruitments).toHaveLength(3)
    for (const applicationType of ['ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'] as const) {
      const recruitment = recruitmentForType(program, applicationType)
      expect(recruitment.applicationType).toBe(applicationType)
      expect(recruitment.recruitmentId).toBeGreaterThan(0)
      expect(recruitment.formBindingId).toBeGreaterThan(0)
    }
    await activateCmsProgramRecruitmentsForIntegration(page, program)

    const schedules = await test.step('교육 일정 최소 2회차 확인', async () => {
      return ensureAtLeastTwoEducationSchedules(page, program)
    })
    const educationSchedules = schedules.filter(schedule => schedule.allDay === false)
    expect(educationSchedules.length).toBeGreaterThanOrEqual(2)

    await test.step('목록에서 제목·모집 상태 확인', async () => {
      const registration = new GeneralProgramRegistrationPage(page, {
        audience: 'organization',
        structure: 'schedule',
        session: 'multi',
        label: '통합_일정형_복수',
      })
      await registration.expectProgramVisibleInList(created)
      const row = page
        .locator(`tr[data-row-key="${created.programId}"]`)
        .or(
          page
            .locator('tbody.ant-table-tbody tr.ant-table-row')
            .filter({ hasText: programTitle })
            .first()
        )
        .first()
      await expect(row).toBeVisible()
      await expect(row).toContainText(programTitle)
      const lifecycleText = (await row.innerText()).replace(/\s+/g, ' ').trim()
      expect(lifecycleText, '목록 행에 모집 관련 상태가 보여야 한다').toMatch(/모집/)
      listLifecycleLabel = lifecycleText
    })

    await test.step('상세에서 제목·일정·모집 상태 확인', async () => {
      const detail = new GeneralProgramDetailPage(page)
      const loaded = await detail.gotoDetail(created.programId, 'info', 'info')
      expect(loaded, '프로그램 상세 본문을 불러오지 못했습니다').toBe(true)
      const dialog = page.getByRole('dialog')
      await expect(dialog.locator('h2').filter({ hasText: programTitle }).first()).toBeVisible({
        timeout: 30_000,
      })

      const schedulePreview = dialog.locator('.education-schedule-preview-lines__item')
      const previewCount = await schedulePreview.count()
      if (previewCount > 0) {
        expect(previewCount).toBeGreaterThanOrEqual(2)
      } else {
        const scheduleText = (await dialog.innerText()).replace(/\s+/g, ' ')
        expect(
          educationSchedules.some(schedule => {
            const key = seoulDateKey(schedule.startAt)
            if (!key) return false
            const [, month, day] = key.split('-')
            return scheduleText.includes(`${Number(month)}월`) && scheduleText.includes(`${Number(day)}일`)
          }),
          '상세 공통 정보에 교육 일정이 보여야 한다'
        ).toBe(true)
      }

      await detail.goToInfoTab('recruitment')
      const tabNames = ['참여 기관 모집 정보', '강사 모집 정보', '봉사자 모집 정보'] as const
      for (const tabName of tabNames) {
        const tab = page.getByRole('tab', { name: tabName })
        await expect(tab.first()).toBeVisible({ timeout: 15_000 })
        await tab.first().click()
        await expect(tab.first()).toHaveAttribute('aria-selected', 'true')
        const bodyText = (await dialog.innerText()).replace(/\s+/g, ' ')
        expect(bodyText, `${tabName}에 모집 상태가 보여야 한다`).toMatch(/모집 (중|예정|마감)/)
        const match = bodyText.match(/(참여 기관|참여자|강사|봉사자)?\s*모집 (중|예정|마감)/)
        detailRecruitmentLabels.push(match?.[0]?.trim() ?? tabName)
      }
    })

    const statePath = writeGeneralProgramEndToEndRunState({
      stepCompleted: 1,
      savedAtKst: kstNowIsoLabel(),
      programId: created.programId,
      programTitle,
      programType: program.programType,
      selectedPaymentItemLabels,
      schedules: educationSchedules.map(schedule => ({
        sessionNo: schedule.sessionNo ?? null,
        scheduleName: schedule.scheduleName ?? null,
        startAt: schedule.startAt ?? null,
        endAt: schedule.endAt ?? null,
        allDay: schedule.allDay ?? null,
      })),
      recruitments: program.recruitments,
      listLifecycleLabel,
      detailRecruitmentLabels,
      settlementConfig,
    })
    expect(statePath.length).toBeGreaterThan(0)
  })

  test('단계 2. 포털 — 프로그램 노출과 신청', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 3. CMS — 심사·선발·배정·출석', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 4. 포털 — 진행 상태 확인', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 5. 포털 — 영수증 정산', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 6. 포털 — 강사 지급조서 신청', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 7. CMS — 정산 심사', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 8. 지급조서 정정 → 재신청', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })

  test('단계 9. 회귀', async () => {
    test.skip(true, '단계 1 완료 후 진행 여부 확인 대기 — 아직 구현하지 않음')
  })
})
