import { expect, type BrowserContext, type Page } from '@playwright/test'

type ApiEnvelope = {
  success?: boolean
  data?: unknown
  message?: string
  error?: { code?: string; message?: string }
}

export type PortalApplicationType = 'ORGANIZATION' | 'INSTRUCTOR' | 'VOLUNTEER'

export type CmsRecruitmentSnapshot = {
  recruitmentId: number
  recruitmentType: string
  applicationType: string
  formBindingId: number
}

export type CmsProgramSnapshot = {
  programId: number
  title: string
  programType: string
  serviceDetailJson: string
  recruitments: CmsRecruitmentSnapshot[]
}

export type PortalApplicationResult = {
  applicationId: number
  recruitmentId: number
  applicationType: string
  formBindingId: number
  requestBody: Record<string, unknown>
  scheduleTokens: string[]
  activityScheduleTokens: string[]
}

export type PlatformAccount = {
  email: string
  applicationType: PortalApplicationType
  mypagePath: string
}

function unwrapApiBody(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  const envelope = payload as ApiEnvelope
  if (envelope.success === true && 'data' in envelope) return unwrapApiBody(envelope.data)
  return payload
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
    const envelope = payload && typeof payload === 'object' ? (payload as ApiEnvelope) : undefined
    const errorDetail = envelope?.error ? ` error=${JSON.stringify(envelope.error)}` : ''
    throw new Error(
      `API 요청 실패: HTTP ${response.status()} ${envelope?.message ?? text.slice(0, 300)}${errorDetail}`
    )
  }
  return payload
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asNumber(value: unknown, label: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${label}가 응답에 없습니다.`)
  }
  return numberValue
}

function asApplicationId(payload: unknown): number {
  const body = asRecord(unwrapApiBody(payload))
  return asNumber(body.applicationId ?? body.id, 'applicationId')
}

function containsScheduleToken(value: unknown): boolean {
  return scheduleTokens(value).length > 0
}

function scheduleTokens(value: unknown): string[] {
  if (typeof value === 'string') {
    return /^(?:schedule:\d+(?::organization-application:\d+)?(?::education-period:\d+)?|line:\d+|edu:\d+)$/i.test(
      value.trim()
    )
      ? [value.trim()]
      : []
  }
  if (Array.isArray(value)) return value.flatMap(scheduleTokens)
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(scheduleTokens)
  }
  return []
}

function answerScheduleTokens(answers: unknown, answerId: string): string[] {
  const answerMap = asRecord(answers)
  return scheduleTokens(answerMap[answerId])
}

export async function fetchCmsProgramSnapshot(
  page: Page,
  programId: string
): Promise<CmsProgramSnapshot> {
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!authToken) throw new Error('CMS 프로그램 조회에 필요한 auth_token이 없습니다.')
  const response = await page.request.get(`/api/admin/programs/${encodeURIComponent(programId)}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const payload = await readJson(response)
  const body = asRecord(unwrapApiBody(payload))
  const rawRecruitments = Array.isArray(body.recruitments) ? body.recruitments : []
  const recruitments = rawRecruitments.flatMap(raw => {
    const row = asRecord(raw)
    const recruitmentId = Number(row.id ?? row.recruitmentId)
    const recruitmentType = String(row.recruitmentType ?? '').trim()
    const applicationType = String(row.applicationType ?? '').trim()
    const formBindingId = Number(row.applicationFormBindingId ?? row.formBindingId)
    if (
      !Number.isInteger(recruitmentId) ||
      recruitmentId <= 0 ||
      !recruitmentType ||
      !applicationType ||
      !Number.isInteger(formBindingId) ||
      formBindingId <= 0
    ) {
      return []
    }
    return [{ recruitmentId, recruitmentType, applicationType, formBindingId }]
  })

  return {
    programId: asNumber(body.programId ?? programId, 'programId'),
    title: String(body.title ?? '').trim(),
    programType: String(body.programType ?? '').trim(),
    serviceDetailJson: String(body.serviceDetailJson ?? '').trim(),
    recruitments,
  }
}

/**
 * DEV 자동입력 케이스가 기록한 모집 대상은 계정별 자격과 다를 수 있다.
 * 통합 E2E에서는 생성된 프로그램의 canonical serviceDetailJson만 보정하고,
 * 모집 기간은 생성 화면에서 현재 날짜를 포함하도록 설정한다. 이미 시작된 모집을
 * 사후 PATCH로 덮어쓰지 않아 백엔드의 모집 수정 잠금 정책을 우회하지 않는다.
 */
export async function activateCmsProgramRecruitmentsForIntegration(
  page: Page,
  program: CmsProgramSnapshot
) {
  const accessToken = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!accessToken) throw new Error('CMS 프로그램 모집 기간 조정에 필요한 access token이 없습니다.')

  let serviceDetailJson: Record<string, unknown>
  try {
    serviceDetailJson = JSON.parse(program.serviceDetailJson) as Record<string, unknown>
  } catch {
    throw new Error('통합 E2E 프로그램의 serviceDetailJson을 JSON으로 해석할 수 없습니다.')
  }
  const registration = (serviceDetailJson.registration ?? {}) as Record<string, unknown>
  const overlay = (registration.overlay ?? {}) as Record<string, unknown>
  overlay['recruit.volunteer.volunteerTargets'] = ['elementary']
  registration.overlay = overlay
  serviceDetailJson.registration = registration
  // GENERAL 상세 응답은 같은 overlay를 registration.overlay와 루트
  // registrationOverlay에 함께 내려준다. 루트 값이 우선되는 정규화 계약을
  // 지키지 않으면 nested 값만 바꿔도 기존 대상(university)이 복원된다.
  serviceDetailJson.registrationOverlay = {
    ...((serviceDetailJson.registrationOverlay ?? {}) as Record<string, unknown>),
    'recruit.volunteer.volunteerTargets': ['elementary'],
  }
  const response = await page.request.patch(`/api/admin/programs/${program.programId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      serviceDetailJson: JSON.stringify(serviceDetailJson),
    },
  })
  const payload = await readJson(response)
  expect(response.ok(), `모집 기간 활성화 PATCH 실패: ${JSON.stringify(payload)}`).toBe(true)
  const body = asRecord(unwrapApiBody(payload))
  expect(String(body.id ?? body.programId)).toBe(String(program.programId))

  const refreshed = await fetchCmsProgramSnapshot(page, String(program.programId))
  const refreshedDetail = JSON.parse(refreshed.serviceDetailJson) as Record<string, unknown>
  const refreshedRegistration = refreshedDetail.registration as Record<string, unknown>
  const refreshedOverlay = refreshedRegistration.overlay as Record<string, unknown>
  expect(refreshedOverlay['recruit.volunteer.volunteerTargets']).toEqual(['elementary'])
  const refreshedRootOverlay = refreshedDetail.registrationOverlay as Record<string, unknown>
  expect(refreshedRootOverlay['recruit.volunteer.volunteerTargets']).toEqual(['elementary'])
}

export function recruitmentForType(
  snapshot: CmsProgramSnapshot,
  applicationType: PortalApplicationType
): CmsRecruitmentSnapshot {
  const recruitmentType = applicationType === 'ORGANIZATION' ? 'PARTICIPANT' : applicationType
  const match = snapshot.recruitments.find(
    row => row.recruitmentType === recruitmentType && row.applicationType === applicationType
  )
  if (!match) {
    throw new Error(
      `${applicationType} 모집 매핑을 찾지 못했습니다. 실제 모집: ${JSON.stringify(snapshot.recruitments)}`
    )
  }
  return match
}

export class PlatformApplicationFlowPage {
  private accessToken: string | null = null

  constructor(
    private readonly page: Page,
    private readonly baseUrl: string,
    private readonly password: string
  ) {}

  async signIn(email: string) {
    await this.page.goto(`${this.baseUrl}/auth/sign-in`)
    await this.page.getByPlaceholder('이메일 주소를 입력해 주세요').fill(email)
    await this.page.getByPlaceholder('비밀번호를 입력해 주세요').fill(this.password)
    await this.page.getByRole('button', { name: '로그인하기' }).click()
    await expect(this.page).not.toHaveURL(/\/auth\/sign-in/, { timeout: 30_000 })
    this.accessToken = await this.page.evaluate(() => localStorage.getItem('platform_auth_token'))
    if (!this.accessToken) throw new Error('Platform 로그인 후 access token을 찾지 못했습니다.')
  }

  private async authenticatedHeaders() {
    if (!this.accessToken) {
      this.accessToken = await this.page.evaluate(() => localStorage.getItem('platform_auth_token'))
    }
    if (!this.accessToken)
      throw new Error('인증된 Portal API 요청에 필요한 access token이 없습니다.')
    return { Authorization: `Bearer ${this.accessToken}` }
  }

  async assertApplicationOption(
    programId: number,
    recruitment: CmsRecruitmentSnapshot,
    applicationType: PortalApplicationType
  ) {
    const row = await this.getApplicationOption(programId, recruitment, applicationType)
    expect(row.canApply, `${applicationType} application-options row: ${JSON.stringify(row)}`).toBe(
      true
    )
    expect(row.blockedReason == null).toBe(true)

    const headers = await this.authenticatedHeaders()
    const formResponse = await this.page.request.get(
      `/api/portal/programs/${programId}/form-bindings/${recruitment.formBindingId}`,
      { headers, params: { recruitmentId: recruitment.recruitmentId, applicationType } }
    )
    const formPayload = await readJson(formResponse)
    const form = asRecord(unwrapApiBody(formPayload))
    expect(Number(form.recruitmentId)).toBe(recruitment.recruitmentId)
    expect(Number(form.formBindingId)).toBe(recruitment.formBindingId)

    return row
  }

  async getApplicationOption(
    programId: number,
    recruitment: CmsRecruitmentSnapshot,
    applicationType: PortalApplicationType
  ) {
    const headers = await this.authenticatedHeaders()
    const response = await this.page.request.get(
      `/api/portal/programs/${programId}/application-options`,
      { headers }
    )
    const payload = await readJson(response)
    const options = unwrapApiBody(payload)
    if (!Array.isArray(options)) throw new Error('application-options 응답이 배열이 아닙니다.')

    const option = options.find(row => {
      const item = asRecord(row)
      return (
        Number(item.recruitmentId) === recruitment.recruitmentId &&
        String(item.applicationType ?? '').toUpperCase() === applicationType
      )
    })
    expect(option, `${applicationType} application-options row`).toBeTruthy()
    const row = asRecord(option)
    expect(Number(row.recruitmentId)).toBe(recruitment.recruitmentId)
    expect(String(row.applicationType).toUpperCase()).toBe(applicationType)
    expect(Number(row.formBindingId)).toBe(recruitment.formBindingId)
    return row
  }

  private async fillVisibleStandardFields(options?: { includeRadios?: boolean }) {
    const checkboxes = this.page.locator('input[type="checkbox"]:visible')
    for (let index = 0; index < (await checkboxes.count()); index += 1) {
      const checkbox = checkboxes.nth(index)
      if (!(await checkbox.isChecked().catch(() => false))) {
        await checkbox.check({ force: true }).catch(() => undefined)
      }
    }

    if (options?.includeRadios !== false) {
      const radios = this.page.locator('input[type="radio"]:visible')
      const seenRadioNames = new Set<string>()
      for (let index = 0; index < (await radios.count()); index += 1) {
        const radio = radios.nth(index)
        const name = (await radio.getAttribute('name')) ?? `radio-${index}`
        if (seenRadioNames.has(name)) continue
        seenRadioNames.add(name)
        if (!(await radio.isChecked().catch(() => false))) {
          await radio.check({ force: true }).catch(() => undefined)
        }
      }
    }

    const textInputs = this.page.locator('input:visible')
    for (let index = 0; index < (await textInputs.count()); index += 1) {
      const input = textInputs.nth(index)
      const type = (await input.getAttribute('type'))?.toLowerCase() ?? 'text'
      if (['checkbox', 'radio', 'file', 'hidden'].includes(type)) continue
      if (await input.isDisabled().catch(() => true)) continue
      if ((await input.inputValue().catch(() => '')).trim()) continue
      const placeholder = (await input.getAttribute('placeholder')) ?? ''
      const value =
        /년|연도/.test(placeholder) || type === 'number'
          ? '2024'
          : type === 'date'
            ? '2026-12-01'
            : type === 'time'
              ? '10:00'
              : type === 'datetime-local'
                ? '2026-12-01T10:00'
                : 'E2E 통합 신청 답변'
      await input.fill(value).catch(() => undefined)
    }

    const textareas = this.page.locator('textarea:visible')
    for (let index = 0; index < (await textareas.count()); index += 1) {
      const textarea = textareas.nth(index)
      if (await textarea.isDisabled().catch(() => true)) continue
      if ((await textarea.inputValue().catch(() => '')).trim()) continue
      await textarea.fill('E2E 통합 신청 답변').catch(() => undefined)
    }
  }

  private async chooseAvailableSchedule(index: number, calendarLabel: string) {
    // PFDatePickerCalendar owns only the calendar element; the slot cards are
    // its sibling in the same schedule picker. Scope through that picker so a
    // volunteer activity click cannot accidentally toggle an interview slot.
    const calendar = this.page.locator(`[aria-label="${calendarLabel}"]`).first()
    const picker = calendar.locator('xpath=..')
    const selectedCards = picker.locator('button[role="listitem"][aria-pressed="true"]:visible')
    const scopedCards = picker.locator('button[role="listitem"][aria-pressed="false"]:visible')
    const cards = scopedCards
    // The calendar opens on the current month, while a newly created program
    // may start in a later month. Advance until the selected role has an
    // enabled date instead of treating the initial all-disabled month as a
    // missing schedule.
    for (let monthOffset = 0; monthOffset < 12 && (await cards.count()) === 0; monthOffset += 1) {
      const enabledDates = calendar.locator('button[aria-pressed="false"]:not(:disabled)')
      if ((await enabledDates.count()) > 0) {
        await enabledDates.first().click()
        await expect(cards.first()).toBeVisible({ timeout: 10_000 })
        break
      }
      const nextMonth = calendar.getByRole('button', { name: '다음 달' })
      if ((await nextMonth.count()) === 0 || (await nextMonth.isDisabled().catch(() => true))) break
      await nextMonth.click()
      await this.page.waitForTimeout(100)
    }

    const visibleCardCount = await cards.count()
    if (visibleCardCount === 0) {
      const pickerDebug = await picker
        .evaluate(element => element.outerHTML.slice(0, 8_000))
        .catch(() => 'picker-not-found')
      throw new Error(
        `${calendarLabel}에서 선택 가능한 일정 카드를 찾지 못했습니다. ` +
          `calendarCount=${await this.page.locator(`[aria-label="${calendarLabel}"]`).count()} ` +
          `pickerDebug=${pickerDebug}`
      )
    }
    if (visibleCardCount > index) {
      await cards.nth(index).click()
      await expect(selectedCards).toHaveCount(1)
      return
    }

    const unselectedDates = calendar.locator('button[aria-pressed="false"]:not(:disabled)')
    const dateIndex = Math.max(index - visibleCardCount, 0)
    if ((await unselectedDates.count()) > dateIndex) {
      await unselectedDates.nth(dateIndex).click()
      // 날짜를 바꾸면 우측 선택지 목록은 해당 날짜 기준으로 다시 렌더링된다.
      // 이때 전체 프로그램 내 인덱스를 그대로 적용하면 두 번째 날짜의 첫 항목을
      // 찾지 못하므로, 새 목록의 첫 번째 선택지를 사용한다.
      await expect(cards.first()).toBeVisible({ timeout: 10_000 })
      await cards.first().click()
      await expect(selectedCards).toHaveCount(1)
      return
    }

    // The requested index is only a preference for a role-specific schedule.
    // A valid form can expose fewer slots than the caller requested, so do not
    // silently leave a required schedule unanswered.
    await cards.first().click()
    await expect(selectedCards).toHaveCount(1)
  }

  private async selectPlatformOption(triggerName: string, optionName: string) {
    const trigger = this.page.getByRole('button', { name: triggerName, exact: true }).first()
    if ((await trigger.count()) === 0 || !(await trigger.isVisible().catch(() => false))) return
    await trigger.click()
    await this.page.getByRole('option', { name: optionName, exact: true }).click()
  }

  private async fillRoleSpecificFields(
    applicationType: PortalApplicationType,
    scheduleIndex: number
  ) {
    if (applicationType === 'ORGANIZATION') {
      // 기관 신청 sidecar의 PFSelect는 일반 input 자동입력 대상이 아니다.
      // 필수 학년·학급을 명시적으로 선택하고 총 학생 수/사유는 공통 입력 채움으로 처리한다.
      await this.selectPlatformOption('학년 선택', '1학년')
      await this.selectPlatformOption('신청 학급', '1')

      // 일반 기관의 고정 일정은 공통 FormTemplateRenderer의 객관식 체크박스로
      // 렌더링된다. Ant Design input은 CSS상 직접 visible로 판정되지 않을 수
      // 있으므로 페이지 전체 자동입력에 맡기지 않고 해당 문단의 첫 일정을
      // 명시적으로 선택한다.
      const scheduleParagraph = this.page.locator(
        '[data-paragraph-id="program-application-institution-seed-schedule"]',
      )
      const scheduleCheckbox = scheduleParagraph.locator('input[type="checkbox"]').first()
      if ((await scheduleCheckbox.count()) > 0) {
        await scheduleCheckbox.check({ force: true })
        await expect(scheduleCheckbox).toBeChecked()
      } else {
        const scheduleOption = scheduleParagraph.locator('.ant-checkbox-wrapper').first()
        if ((await scheduleOption.count()) > 0) {
          await scheduleOption.click()
        }
      }
      const teacherTel = this.page.getByPlaceholder('담당 교사의 내선 번호(직통 번호)').first()
      if ((await teacherTel.count()) > 0 && (await teacherTel.isVisible().catch(() => false))) {
        await teacherTel.fill('02-783-2367')
      }
      const teacherMobile = this.page.getByPlaceholder('담당 교사의 휴대폰 번호').first()
      if ((await teacherMobile.count()) > 0 && (await teacherMobile.isVisible().catch(() => false))) {
        await teacherMobile.fill('010-1234-5678')
      }
      const teacherEmail = this.page.getByPlaceholder('담당 교사의 이메일').first()
      if ((await teacherEmail.count()) > 0 && (await teacherEmail.isVisible().catch(() => false))) {
        await teacherEmail.fill('teacher@test.com')
      }
      return
    }

    if (applicationType === 'INSTRUCTOR') {
      const crimeRecord = this.page.locator(
        '[role="radiogroup"][aria-label="apply-instructor-crime-record-confirm"] input[type="radio"]'
      )
      if ((await crimeRecord.count()) > 0) await crimeRecord.first().check({ force: true })
      await this.chooseAvailableSchedule(scheduleIndex, '강의 진행 가능 일정 날짜')
      return
    }

    if (applicationType === 'VOLUNTEER') {
      // The seeded volunteer form defaults the experience question to "있음".
      // Select "없음" so the conditional evidence block is hidden and the
      // integration flow does not require a real file-upload fixture.
      const noJaExperience = this.page
        .locator('[data-paragraph-id="program-volunteer-application-seed-ja-experience"]')
        .getByRole('radio', { name: '없음', exact: true })
      if ((await noJaExperience.count()) > 0 && (await noJaExperience.first().isVisible())) {
        await noJaExperience.first().check({ force: true })
        await expect(noJaExperience.first()).toBeChecked()
      }
      const year = this.page.getByPlaceholder('진행년도').first()
      if ((await year.count()) > 0 && (await year.isVisible().catch(() => false))) {
        await year.fill('2024')
      }
      const programName = this.page.getByPlaceholder('프로그램명').first()
      if ((await programName.count()) > 0 && (await programName.isVisible().catch(() => false))) {
        await programName.fill('E2E 이전 JA 프로그램')
      }
      // 일반 봉사자 양식은 면접 가능 일정과 봉사 진행 가능 일정을
      // 각각 필수로 받는다. 두 캘린더를 모두 선택해야 신청 검증을 통과한다.
      await this.chooseAvailableSchedule(0, '면접 진행 가능 일정 날짜')
      await this.chooseAvailableSchedule(scheduleIndex, '봉사 진행 가능 일정 날짜')
    }
  }

  private async fillApplicationForm(applicationType: PortalApplicationType, scheduleIndex: number) {
    await expect(this.page.getByRole('heading', { name: '프로그램 신청하기' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.locator('.form-template-renderer').first()).toBeVisible({
      timeout: 30_000,
    })
    await this.fillVisibleStandardFields()
    await this.fillRoleSpecificFields(applicationType, scheduleIndex)
    // 역할별 라디오(특히 봉사자 경험 여부)는 위에서 확정한 값을 유지한다.
    // 일반 라디오 자동 선택을 다시 수행하면 「없음」이 첫 옵션 「있음」으로 되돌아간다.
    await this.fillVisibleStandardFields({ includeRadios: false })
  }

  async submitApplication(
    program: CmsProgramSnapshot,
    account: PlatformAccount,
    recruitment: CmsRecruitmentSnapshot,
    scheduleIndex = 0
  ): Promise<PortalApplicationResult> {
    const applyPath = `/programs/${program.programId}/apply?applicationType=${account.applicationType}&recruitmentId=${recruitment.recruitmentId}`
    await this.page.goto(`${this.baseUrl}${applyPath}`)
    await this.assertApplicationOption(program.programId, recruitment, account.applicationType)
    await this.fillApplicationForm(account.applicationType, scheduleIndex)

    const submitButton = this.page.getByRole('button', { name: '신청하기' })
    if (await submitButton.isDisabled().catch(() => false)) {
      await this.page.screenshot({
        path: `/tmp/platform-submit-disabled-${account.applicationType}.png`,
        fullPage: true,
      })
      const visibleText = (await this.page.locator('body').innerText()).slice(-6000)
      throw new Error(
        `${account.applicationType} 신청 버튼이 비활성화되어 있습니다. visibleText=${visibleText}`
      )
    }

    const applicationRequests: string[] = []
    const applicationResponses: string[] = []
    const consoleMessages: string[] = []
    const pageErrors: string[] = []
    const recordApplicationTraffic = (url: string, status?: number) => {
      if (!url.includes('/api/portal/')) return
      const summary = `${status == null ? 'REQUEST' : `RESPONSE ${status}`} ${url}`
      if (status == null) applicationRequests.push(summary)
      else applicationResponses.push(summary)
    }
    const requestListener = (request: { url(): string; method(): string }) => {
      recordApplicationTraffic(`${request.method()} ${request.url()}`)
    }
    const responseListener = (response: { url(): string; status(): number }) => {
      recordApplicationTraffic(response.url(), response.status())
    }
    const consoleListener = (message: { type(): string; text(): string }) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleMessages.push(`${message.type()}: ${message.text()}`)
      }
    }
    const pageErrorListener = (error: Error) => pageErrors.push(error.message)
    this.page.on('request', requestListener)
    this.page.on('response', responseListener)
    this.page.on('console', consoleListener)
    this.page.on('pageerror', pageErrorListener)

    const submitResponsePromise = this.page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname ===
          `/api/portal/programs/${program.programId}/applications`,
      { timeout: 90_000 }
    )
    await submitButton.click()
    let submitResponse
    try {
      submitResponse = await submitResponsePromise
    } catch (error) {
      await this.page.screenshot({
        path: `/tmp/platform-submit-timeout-${account.applicationType}.png`,
        fullPage: true,
      })
      const visibleText = (await this.page.locator('body').innerText()).slice(-12_000)
      const formValues = await this.page
        .locator('.form-template-renderer')
        .first()
        .evaluate(element => element.textContent?.slice(-8_000) ?? '')
        .catch(() => '')
      throw new Error(
        `${account.applicationType} 신청 요청이 발생하지 않았거나 응답을 받지 못했습니다. ` +
          `url=${this.page.url()} ` +
          `requests=${JSON.stringify(applicationRequests)} ` +
          `responses=${JSON.stringify(applicationResponses)} ` +
          `console=${JSON.stringify(consoleMessages)} ` +
          `pageErrors=${JSON.stringify(pageErrors)} ` +
          `visibleText=${visibleText} ` +
          `formText=${formValues}`,
        { cause: error }
      )
    } finally {
      this.page.off('request', requestListener)
      this.page.off('response', responseListener)
      this.page.off('console', consoleListener)
      this.page.off('pageerror', pageErrorListener)
    }
    const requestBody = asRecord(submitResponse.request().postDataJSON())
    let submitPayload: unknown
    try {
      submitPayload = await readJson(submitResponse)
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} ` +
          `requestBody=${JSON.stringify(requestBody)}`
      )
    }
    expect(Number(requestBody.recruitmentId)).toBe(recruitment.recruitmentId)
    expect(String(requestBody.applicationType).toUpperCase()).toBe(account.applicationType)
    expect(Number(requestBody.formBindingId)).toBe(recruitment.formBindingId)
    if (account.applicationType !== 'ORGANIZATION') {
      expect(containsScheduleToken(requestBody.answers)).toBe(true)
    }
    const selectedScheduleTokens = scheduleTokens(requestBody.answers)
    const activityScheduleTokens =
      account.applicationType === 'VOLUNTEER'
        ? answerScheduleTokens(
            requestBody.answers,
            'program-volunteer-application-seed-activity-schedule'
          )
        : selectedScheduleTokens

    const applicationId = asApplicationId(submitPayload)
    await expect(this.page.getByText('신청이 완료되었어요', { exact: true })).toBeVisible({
      timeout: 30_000,
    })

    await this.assertMyPageApplication(account, program, applicationId)
    return {
      applicationId,
      recruitmentId: recruitment.recruitmentId,
      applicationType: account.applicationType,
      formBindingId: recruitment.formBindingId,
      requestBody,
      scheduleTokens: selectedScheduleTokens,
      activityScheduleTokens,
    }
  }

  private async assertMyPageApplication(
    account: PlatformAccount,
    program: CmsProgramSnapshot,
    applicationId: number
  ) {
    const headers = await this.authenticatedHeaders()
    const listResponse = await this.page.request.get('/api/portal/me/program-applications', {
      headers,
      params: { applicationType: account.applicationType, page: 0, size: 100 },
    })
    const listPayload = await readJson(listResponse)
    const listBody = asRecord(unwrapApiBody(listPayload))
    const items = Array.isArray(listBody.items) ? listBody.items : []
    const item = items.find(row => {
      const candidate = asRecord(row)
      return Number(candidate.applicationId ?? candidate.id) === applicationId
    })
    expect(item, `${account.applicationType} mypage application`).toBeTruthy()
    const listItem = asRecord(item)
    expect(Number(listItem.programId)).toBe(program.programId)
    expect(String(listItem.applicationType).toUpperCase()).toBe(account.applicationType)
    const portalProgramTitle = String(listItem.programTitle ?? '').trim()
    expect(portalProgramTitle, `${account.applicationType} 목록 programTitle`).not.toBe('')

    const detailResponse = await this.page.request.get(
      `/api/portal/me/program-applications/${account.applicationType}/${applicationId}`,
      { headers }
    )
    const detailPayload = await readJson(detailResponse)
    const detail = asRecord(unwrapApiBody(detailPayload))
    expect(Number(detail.applicationId ?? detail.id)).toBe(applicationId)
    expect(Number(detail.programId)).toBe(program.programId)

    await this.page.reload()
    await this.page.goto(`${this.baseUrl}${account.mypagePath}`)
    await expect(this.page.getByText(portalProgramTitle, { exact: true }).first()).toBeVisible({
      timeout: 30_000,
    })
  }
}

export async function runPlatformApplication(
  context: BrowserContext,
  baseUrl: string,
  password: string,
  program: CmsProgramSnapshot,
  account: PlatformAccount,
  recruitment: CmsRecruitmentSnapshot,
  scheduleIndex = 0
) {
  const page = await context.newPage()
  try {
    const flow = new PlatformApplicationFlowPage(page, baseUrl, password)
    await flow.signIn(account.email)
    return await flow.submitApplication(program, account, recruitment, scheduleIndex)
  } finally {
    await page.close()
  }
}
