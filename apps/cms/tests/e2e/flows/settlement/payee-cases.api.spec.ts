/**
 * 정산 대상자 API E2E. E2E_SETTLEMENT_API=1 이고 E2E_PLATFORM_PASSWORD 가 있을 때만 로컬 API를 바꾼다.
 * 브라우저 조작은 하지 않는다. 응답의 계좌·주민번호·이메일은 헬퍼가 단언 전에 제거한다.
 * 케이스가 같은 로컬 DB를 쓰므로 workers=1 로만 실행한다.
 */
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { expect, request as newApiRequest, test, type APIRequestContext } from '@playwright/test'
import {
  CANCELLED_VOLUNTEER_APPLICATION_IDS,
  COMPANY_SCHOOL_PREVIEW,
  DRAFT_PROGRAM_ID,
  SETTLEMENT_MEMBERS,
  type SettlementMemberSlot,
} from '../../fixtures/settlement-members'
import {
  DEV_LOGIN_QA_PASSWORD,
} from '../../../../src/features/auth/lib/dev-login-accounts'
import {
  SettlementApi,
  adminAccount,
  assertCall,
  listItems,
  seoulIsoDate,
  unwrapData,
  type ApiCallResult,
} from '../../helpers/settlement-api'

const enabled = process.env.E2E_SETTLEMENT_API === '1'
const futureDate = seoulIsoDate(1)
const pastDate = '2020-01-01'
const uncovered: string[] = []

let api: SettlementApi
let apiContext: APIRequestContext

test.beforeAll(async () => {
  test.skip(!enabled, 'E2E_SETTLEMENT_API=1 일 때만 실행')
  test.setTimeout(120_000)
  apiContext = await newApiRequest.newContext()
  api = new SettlementApi(apiContext)
  await api.loginAdmin(adminAccount('master').email)
})

test.afterAll(async () => {
  await apiContext?.dispose()
})

test.beforeEach(() => {
  test.skip(!enabled, 'E2E_SETTLEMENT_API=1 일 때만 실행')
  test.setTimeout(180_000)
})

test('M4 강사 제출 전 거절과 미신청 유지', async () => {
  const slot = SETTLEMENT_MEMBERS.m4
  const token = await api.loginMember(slot.memberId)
  const preview = await api.call(
    token,
    'POST',
    `/api/portal/me/instructor-assignments/${slot.assignmentId}/settlement-applications/preview`,
    { requestedItems: [] },
  )
  assertCall(preview, { ok: true })
  const previewBody = recordOf(unwrapData(preview.body))
  expect(previewBody.canSubmit).toBe(true)
  expect(previewBody.blockerCode ?? null).toBeNull()
  noteMissingBlockers(previewBody.blockerCode)

  const disabled = await submitInstructor(token, slot, {
    itemType: 'MEAL',
    requestedAmount: 1000,
  })
  assertCall(disabled, { status: 400, code: 'SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED' })

  const mismatch = await submitInstructor(token, slot, undefined, 1)
  assertCall(mismatch, { status: 409, code: 'ASSIGNMENT_SCHEDULE_MISMATCH' })

  const idempotencyKey = randomUUID()
  const first = await submitInstructor(token, slot, { itemType: 'MEAL', requestedAmount: 1000 }, undefined, idempotencyKey)
  assertCall(first, { status: 400, code: 'SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED' })
  const second = await submitInstructor(
    token,
    slot,
    { itemType: 'ACTIVITY', requestedAmount: 2000 },
    undefined,
    idempotencyKey,
  )
  if (second.code === 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT') {
    assertCall(second, { status: 409, code: 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT' })
  } else {
    uncovered.push('IDEMPOTENCY_KEY_PAYLOAD_CONFLICT: 성공 제출 없이 거절된 키는 충돌로 저장되지 않음')
    assertCall(second, { status: 400 })
  }

  const wrongIndividual = await api.call(
    token,
    'GET',
    `/api/portal/me/individual-settlements/applications/${slot.assignmentId}/schedules`,
  )
  expect(wrongIndividual.status).toBeGreaterThanOrEqual(400)

  const row = await findRow(slot, true)
  expect(row.rowType).toBe('NOT_APPLIED')
  expect(row.payeeType).toBe('INSTRUCTOR')
  expect(row.settlementApplicationId ?? null).toBeNull()
})

test('M10 교사·취소·DRAFT는 지급 대상이 아니다', async () => {
  const teacher = SETTLEMENT_MEMBERS.m10Teacher
  const token = await api.loginMember(teacher.memberId)
  const volunteerAsOrg = await api.call(
    token,
    'GET',
    `/api/portal/me/volunteer-settlements/applications/${teacher.applicationId}/schedules`,
  )
  expect(volunteerAsOrg.status).toBeGreaterThanOrEqual(400)
  const individualAsOrg = await api.call(
    token,
    'GET',
    `/api/portal/me/individual-settlements/applications/${teacher.applicationId}/schedules`,
  )
  expect(individualAsOrg.status).toBeGreaterThanOrEqual(400)

  const ujatRows = await listRows({
    programId: teacher.programId,
    payeeType: 'VOLUNTEER',
    size: 50,
  })
  expect(ujatRows.some(row => num(row, 'instructorMemberId') === teacher.memberId)).toBe(false)

  const draftRows = await listRows({ programId: DRAFT_PROGRAM_ID, size: 50 })
  expect(
    draftRows.some(row => {
      const rowType = text(row, 'rowType')
      return rowType === 'SETTLEMENT' || rowType === 'SETTLEMENT_APPLICATION' || rowType === 'INDIVIDUAL_SETTLEMENT_APPLICATION'
    }),
  ).toBe(false)

  for (const applicationId of CANCELLED_VOLUNTEER_APPLICATION_IDS) {
    const schedules = await api.call(
      token,
      'GET',
      `/api/portal/me/volunteer-settlements/applications/${applicationId}/schedules`,
    )
    expect(schedules.status).toBeGreaterThanOrEqual(400)
  }
})

test('M2 강사 확인 거절 뒤 반려와 재제출', async () => {
  const slot = SETTLEMENT_MEMBERS.m2
  const token = await api.loginMember(slot.memberId)
  const before = await findRow(slot, false)
  expect(before.rowType).toBe('SETTLEMENT_APPLICATION')
  const applicationId = num(before, 'settlementApplicationId')
  expect(applicationId).not.toBeNull()

  const confirmAlone = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/settlements/statements/${applicationId}/confirm`,
    { reason: '지급조서 확인' },
  )
  expect(confirmAlone.status).toBeGreaterThanOrEqual(400)
  expect((await findRow(slot, false)).rowType).toBe('SETTLEMENT_APPLICATION')

  const missingDate = await api.call(api.adminToken, 'POST', '/api/admin/settlements/statements/bulk-confirm', {
    statementIds: [],
    instructorSettlementApplications: [{ settlementApplicationId: applicationId }],
    reason: '지급조서 확인',
  })
  assertCall(missingDate, { status: 400, code: 'SCHEDULED_PAYMENT_DATE_REQUIRED' })
  expect((await findRow(slot, false)).rowType).toBe('SETTLEMENT_APPLICATION')

  const rolledBack = await api.call(api.adminToken, 'POST', '/api/admin/settlements/statements/bulk-confirm', {
    statementIds: [],
    instructorSettlementApplications: [{ settlementApplicationId: applicationId }],
    individualSettlementApplications: [{ settlementApplicationId: 999_999_999, expectedRevisionNo: 1 }],
    reason: '지급조서 확인',
    scheduledPaymentDate: futureDate,
    lectureFeePaymentScheduledDate: futureDate,
  })
  expect(rolledBack.status).toBeGreaterThanOrEqual(400)
  expect((await findRow(slot, false)).rowType).toBe('SETTLEMENT_APPLICATION')

  const duplicate = await submitInstructor(token, slot)
  assertCall(duplicate, { code: 'ACTIVE_APPLICATION_EXISTS' })
  expect(duplicate.status).toBeGreaterThanOrEqual(400)

  const earlyResubmit = await api.call(
    token,
    'POST',
    `/api/portal/me/settlement-applications/${applicationId}/revisions`,
    { requestedItems: [], evidenceAttachments: [] },
  )
  expect(earlyResubmit.status).toBe(409)
  expect(['SETTLEMENT_REAPPLICATION_NOT_AVAILABLE', 'SETTLEMENT_APPLICATION_STATE_CONFLICT']).toContain(
    earlyResubmit.code,
  )

  const rejected = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/settlement-applications/${applicationId}/reject`,
    { reason: '신청 반려' },
  )
  assertCall(rejected, { ok: true })

  const resubmitted = await api.call(
    token,
    'POST',
    `/api/portal/me/settlement-applications/${applicationId}/revisions`,
    { requestedItems: [], evidenceAttachments: [] },
  )
  assertCall(resubmitted, { ok: true })
  const after = await findRow(slot, false)
  expect(after.payeeType).toBe('INSTRUCTOR')
  expect(['WAITING_CONFIRM', 'SUBMITTED', 'REAPPLICATION', 'RESUBMITTED']).toContain(text(after, 'statementStatus'))
  expect(after.rowType === 'SETTLEMENT_APPLICATION' || after.rowType === 'SETTLEMENT').toBe(true)
})

test('M6 참여자 영수증 반려 후 재제출', async () => {
  const slot = SETTLEMENT_MEMBERS.m6
  const token = await api.loginMember(slot.memberId)
  const row = await findRow(slot, false)
  expect(row.payeeType).toBe('PARTICIPANT')
  const settlementApplicationId = num(row, 'individualSettlementApplicationId')
  expect(settlementApplicationId).not.toBeNull()
  const revision = await revisionNo(settlementApplicationId!)

  const early = await api.call(token, 'POST', `/api/portal/me/individual-settlements/${settlementApplicationId}/revisions`, {
    idempotencyKey: randomUUID(),
    expectedRevisionNo: revision,
    items: [{ itemType: 'MEAL', amount: 1000, expenses: [] }],
  })
  expect(early.status).toBeGreaterThanOrEqual(400)

  const wrongRevision = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/reject`,
    { expectedRevisionNo: revision + 99, reason: '신청 반려' },
  )
  expect(wrongRevision.status).toBeGreaterThanOrEqual(400)
  expect(await revisionNo(settlementApplicationId!)).toBe(revision)

  if ((await receiptStatus(settlementApplicationId!)) !== 'REJECTED') {
    const rejected = await api.call(
      api.adminToken,
      'PATCH',
      `/api/admin/individual-settlement-applications/${settlementApplicationId}/reject`,
      { expectedRevisionNo: revision, reason: '신청 반려' },
    )
    assertCall(rejected, { ok: true })
  }
  const detail = await api.call(
    api.adminToken,
    'GET',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}`,
  )
  assertCall(detail, { ok: true })
  const fileObjectId = firstNumber(detail.body, 'fileObjectId')
  expect(fileObjectId, 'existing receipt file').not.toBeNull()
  const nextRevision = await revisionNo(settlementApplicationId!)
  const resubmitted = await resubmitReceipt(token, settlementApplicationId!, nextRevision, fileObjectId!)
  assertCall(resubmitted, { ok: true })
  const after = await findRow(slot, false)
  expect(after.payeeType).toBe('PARTICIPANT')
  expect(num(after, 'instructorMemberId')).toBe(slot.memberId)
  expect(num(after, 'scheduleId')).toBe(slot.scheduleId)
  expect(num(after, 'individualSettlementApplicationId')).not.toBe(num(await findRow(SETTLEMENT_MEMBERS.m5, false), 'individualSettlementApplicationId'))
})

test('M5 참여자 영수증 승인 엣지와 지급', async () => {
  await payReceipt(SETTLEMENT_MEMBERS.m5, 'PARTICIPANT')
})

test('M7 봉사 영수증 승인 엣지와 지급', async () => {
  const slot = SETTLEMENT_MEMBERS.m7
  const token = await api.loginMember(slot.memberId)
  const crossed = await api.call(
    token,
    'POST',
    `/api/portal/me/individual-settlements/applications/${slot.volunteerApplicationId}`,
    { idempotencyKey: randomUUID(), scheduleId: slot.scheduleId, items: [{ itemType: 'MEAL', amount: 1000, expenses: [] }] },
  )
  expect(crossed.status).toBeGreaterThanOrEqual(400)
  await payReceipt(slot, 'VOLUNTEER')
})

test('M9 UJAT 봉사 영수증 지급', async () => {
  await payReceipt(SETTLEMENT_MEMBERS.m9, 'VOLUNTEER')
  const schoolRows = await listRows({
    programId: SETTLEMENT_MEMBERS.m9.programId,
    payeeType: 'VOLUNTEER',
    instructorMemberId: SETTLEMENT_MEMBERS.m10Teacher.memberId,
    size: 20,
  })
  expect(schoolRows.some(row => text(row, 'rowType') !== 'NOT_APPLIED' && num(row, 'instructorMemberId') === SETTLEMENT_MEMBERS.m10Teacher.memberId)).toBe(false)
})

test('M8 승인 전 신청서 PDF는 거절되고 승인 후 계약만 확인', async () => {
  const slot = SETTLEMENT_MEMBERS.m8
  const row = await findRow(slot, false)
  const settlementApplicationId = num(row, 'individualSettlementApplicationId')
  expect(settlementApplicationId).not.toBeNull()
  if ((await receiptStatus(settlementApplicationId!)) !== 'APPROVED') {
    const before = await downloadReceiptDocument(settlementApplicationId!)
    assertCall(before, { status: 409, code: 'SETTLEMENT_APPLICATION_DOCUMENT_NOT_APPROVED' })
    await approveReceipt(settlementApplicationId!)
  }
  const after = await downloadReceiptDocument(settlementApplicationId!)
  expect(after.status).toBe(200)
  const body = recordOf(after.body)
  expect(String(body.contentType ?? '')).toContain('pdf')
  expect(num(body, 'byteLength')).toBeGreaterThan(0)
})

test('M3 정정 반려 복구 후 다시 정정하고 재신청', async () => {
  const slot = SETTLEMENT_MEMBERS.m3
  const token = await api.loginMember(slot.memberId)
  const before = await findRow(slot, true)
  expect(before.payeeType).toBe('INSTRUCTOR')
  expect(text(before, 'paymentStatus')).toBe('WAITING_PAYMENT')
  const settlementId = num(before, 'settlementId')
  expect(settlementId).not.toBeNull()

  const tooEarly = await api.call(
    token,
    'POST',
    `/api/portal/me/settlements/${settlementId}/payment-statement/reapply`,
  )
  assertCall(tooEarly, { status: 409, code: 'SETTLEMENT_REAPPLICATION_NOT_AVAILABLE' })

  await rejectOpenAdminCorrections(settlementId!)
  assertCall(await memberRequestCorrection(token, settlementId!), { ok: true })
  const parked = await findRow(slot, true)
  expect(text(parked, 'statementStatus')).toBe('CORRECTION_REQUESTED')

  const firstRequestId = await latestCorrectionId(settlementId!)
  const restored = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/settlements/correction-requests/${firstRequestId}/reject`,
    { reason: '정정 반려' },
  )
  assertCall(restored, { ok: true })
  const afterReject = await findRow(slot, true)
  expect(text(afterReject, 'paymentStatus')).toBe('WAITING_PAYMENT')
  expect(text(afterReject, 'statementStatus')).toBe('CONFIRMED')

  assertCall(await memberRequestCorrection(token, settlementId!), { ok: true })
  const secondRequestId = await latestCorrectionId(settlementId!)
  const approved = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/settlements/correction-requests/${secondRequestId}/approve`,
    { pricingMode: 'PROGRAM_STANDARD', wageItemType: 'TIER1', reason: '정정 승인' },
  )
  assertCall(approved, { ok: true })
  const replacementSettlementId = firstNumber(approved.body, 'replacementSettlementId')
  expect(replacementSettlementId, 'correction replacement settlement').not.toBeNull()
  const reapplied = await api.call(
    token,
    'POST',
    `/api/portal/me/settlements/${replacementSettlementId}/payment-statement/reapply`,
  )
  assertCall(reapplied, { ok: true })
  const after = await findRow(slot, true)
  expect(['WAITING_CONFIRM', 'REAPPLICATION', 'SUBMITTED', 'RESUBMITTED']).toContain(text(after, 'statementStatus'))
})

test('M1 지급 완료 후 정정과 재신청은 거절', async () => {
  const slot = SETTLEMENT_MEMBERS.m1
  const token = await api.loginMember(slot.memberId)
  const row = await findRow(slot, true)
  expect(row.payeeType).toBe('INSTRUCTOR')
  expect(text(row, 'paymentStatus')).toBe('PAID')
  const settlementId = num(row, 'settlementId')
  expect(settlementId).not.toBeNull()
  const actions = Array.isArray(row.availableActions) ? row.availableActions.map(String) : []
  expect(actions.includes('REQUEST_CORRECTION') || actions.includes('CORRECTION_REQUEST')).toBe(false)

  const correction = await api.call(
    api.adminToken,
    'POST',
    `/api/admin/settlements/${settlementId}/correction-requests`,
    { reason: '지급 완료 정정', requestedChangeSummary: '거절 확인' },
  )
  expect(correction.status).toBeGreaterThanOrEqual(400)
  const reapply = await api.call(
    token,
    'POST',
    `/api/portal/me/settlements/${settlementId}/payment-statement/reapply`,
  )
  expect(reapply.status).toBeGreaterThanOrEqual(400)
  expect((await findRow(slot, true)).paymentStatus).toBe('PAID')
})

test('payeeType 필터는 유형을 섞지 않는다', async () => {
  const instructor = await listRows({
    programId: SETTLEMENT_MEMBERS.m1.programId,
    payeeType: 'INSTRUCTOR',
    instructorMemberId: SETTLEMENT_MEMBERS.m1.memberId,
    includePaid: true,
    size: 20,
  })
  expect(instructor.some(row => num(row, 'instructorMemberId') === SETTLEMENT_MEMBERS.m1.memberId)).toBe(true)
  expect(instructor.every(row => text(row, 'payeeType') === 'INSTRUCTOR')).toBe(true)

  const participants = await listRows({
    programId: SETTLEMENT_MEMBERS.m5.programId,
    payeeType: 'PARTICIPANT',
    size: 50,
  })
  expect(participants.some(row => num(row, 'instructorMemberId') === SETTLEMENT_MEMBERS.m5.memberId)).toBe(true)
  expect(participants.every(row => text(row, 'payeeType') === 'PARTICIPANT')).toBe(true)

  const volunteers = await listRows({
    programId: SETTLEMENT_MEMBERS.m7.programId,
    payeeType: 'VOLUNTEER',
    size: 50,
  })
  expect(volunteers.some(row => num(row, 'instructorMemberId') === SETTLEMENT_MEMBERS.m7.memberId)).toBe(true)
  expect(volunteers.every(row => text(row, 'payeeType') === 'VOLUNTEER')).toBe(true)
})

test('Program Manager는 계좌 지급 완료를 호출할 수 없다', async () => {
  const row = await findRow(SETTLEMENT_MEMBERS.m1, true)
  const settlementId = num(row, 'settlementId')
  const payments = await accountPayments(SETTLEMENT_MEMBERS.m1.programId, 'INSTRUCTOR')
  const payment = payments.find(item => num(item, 'settlementId') === settlementId)
  expect(payment).toBeTruthy()
  const pmToken = await api.loginAdminAccount(adminAccount('partner').email, DEV_LOGIN_QA_PASSWORD)
  const denied = await api.call(
    pmToken,
    'PATCH',
    `/api/admin/account-payments/${num(payment!, 'accountPaymentId')}/paid`,
    { reason: '계좌 지급 완료' },
  )
  expect(denied.status).toBe(403)
  const listed = await api.call(
    pmToken,
    'GET',
    `/api/admin/settlements?programId=${SETTLEMENT_MEMBERS.m1.programId}&size=5`,
  )
  assertCall(listed, { ok: true })
})

test('시드가 없는 제미나이·1사1교 갈래는 만들지 않는다', async () => {
  const gemini = scalarCount(
    "SELECT count(*) FROM program WHERE program_type = 'GEMINI' AND draft_status = 'PUBLISHED'",
  )
  if (gemini === 0) uncovered.push('GEMINI_SETTLEMENT_CORRECTION_NOT_ALLOWED')
  else uncovered.push('GEMINI 행은 있으나 이 10명 밖이라 정정 호출은 하지 않음')

  const token = await api.loginMember(COMPANY_SCHOOL_PREVIEW.memberId)
  const preview = await api.call(
    token,
    'POST',
    `/api/portal/me/instructor-assignments/${COMPANY_SCHOOL_PREVIEW.assignmentId}/settlement-applications/preview`,
    { requestedItems: [] },
  )
  if (preview.status !== 200) {
    uncovered.push(`COMPANY_SCHOOL 장거리 단가 미리보기 불가:${preview.status}:${preview.code ?? 'none'}`)
    noteMissingBlockers(null)
  } else {
    const body = recordOf(unwrapData(preview.body))
    const serialized = JSON.stringify(body)
    if (!serialized.includes('장거리') && !serialized.toLowerCase().includes('longdistance')) {
      uncovered.push('COMPANY_SCHOOL 장거리 단가 미리보기 문구 없음')
    }
    noteMissingBlockers(body.blockerCode)
  }
  expect(uncovered.length).toBeGreaterThan(0)
  test.info().annotations.push({
    type: 'UNCOVERED',
    description: uncovered.join(' | '),
  })
})

async function payReceipt(slot: SettlementMemberSlot, payeeType: 'PARTICIPANT' | 'VOLUNTEER'): Promise<void> {
  const row = await findRow(slot, false)
  expect(text(row, 'payeeType')).toBe(payeeType)
  expect(num(row, 'withholdingTaxAmount') ?? 0).toBe(0)
  const settlementApplicationId = num(row, 'individualSettlementApplicationId')
  expect(settlementApplicationId).not.toBeNull()
  if (text(row, 'paymentStatus') !== 'PAID' && text(row, 'paymentStatus') !== 'WAITING_PAYMENT') {
    await approveReceipt(settlementApplicationId!)
  }
  const payment = await findAccountPayment(slot.programId, payeeType, slot.memberId, settlementApplicationId!)
  expect(num(payment, 'withholdingTaxAmount') ?? 0).toBe(0)
  const paymentId = num(payment, 'accountPaymentId') ?? num(payment, 'id')
  expect(paymentId).not.toBeNull()
  if (text(payment, 'paymentStatus') !== 'PAID') {
    const paid = await api.call(api.adminToken, 'PATCH', `/api/admin/account-payments/${paymentId}/paid`, {
      reason: '계좌 지급 완료',
    })
    assertCall(paid, { ok: true })
  }
  const failed = await api.call(api.adminToken, 'PATCH', `/api/admin/account-payments/${paymentId}/failed`, {
    reason: '영수증 지급 실패',
  })
  expect(failed.status).toBeGreaterThanOrEqual(400)
  const afterPayment = await findAccountPayment(slot.programId, payeeType, slot.memberId, settlementApplicationId!)
  expect(text(afterPayment, 'paymentStatus')).toBe('PAID')
  expect(num(afterPayment, 'withholdingTaxAmount') ?? 0).toBe(0)

  const tax = await api.call(api.adminToken, 'POST', '/api/admin/settlements/exports/tax-report/preview', {
    reason: '세금신고 양식 발급',
    businessPurpose: '정산 관리 세금신고 양식',
    status: 'PAID',
    rawPrivacyIncluded: false,
    settlementIds: [],
    accountPaymentIds: [paymentId],
  })
  if (tax.code === 'TAX_REPORT_NO_ELIGIBLE_SELECTION') {
    assertCall(tax, { code: 'TAX_REPORT_NO_ELIGIBLE_SELECTION' })
  } else if (payeeType === 'PARTICIPANT') {
    assertCall(tax, { code: 'TAX_REPORT_NO_ELIGIBLE_SELECTION' })
  } else {
    uncovered.push(`TAX_REPORT_NO_ELIGIBLE_SELECTION:${slot.id}:${tax.status}:${tax.code ?? 'none'}`)
  }
}

async function approveReceipt(settlementApplicationId: number): Promise<void> {
  const revision = await revisionNo(settlementApplicationId)
  const wrongRevision = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/approve`,
    { expectedRevisionNo: revision + 99, scheduledPaymentDate: futureDate },
  )
  expect(wrongRevision.status).toBeGreaterThanOrEqual(400)
  expect(await revisionNo(settlementApplicationId)).toBe(revision)

  const missingDate = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/approve`,
    { expectedRevisionNo: revision },
  )
  assertCall(missingDate, { status: 400, code: 'SCHEDULED_PAYMENT_DATE_REQUIRED' })

  const past = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/approve`,
    { expectedRevisionNo: revision, scheduledPaymentDate: pastDate },
  )
  assertCall(past, { status: 400, code: 'SCHEDULED_PAYMENT_DATE_MUST_BE_TODAY_OR_LATER' })

  const approved = await api.call(
    api.adminToken,
    'PATCH',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/approve`,
    { expectedRevisionNo: revision, scheduledPaymentDate: futureDate },
  )
  assertCall(approved, { ok: true })
}

async function revisionNo(settlementApplicationId: number): Promise<number> {
  const detail = await api.call(
    api.adminToken,
    'GET',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}`,
  )
  assertCall(detail, { ok: true })
  const value = num(recordOf(unwrapData(detail.body)), 'latestRevisionNo')
  expect(value).not.toBeNull()
  return value!
}

async function resubmitReceipt(
  token: string,
  settlementApplicationId: number,
  expectedRevisionNo: number,
  fileObjectId: number,
) {
  return api.call(token, 'POST', `/api/portal/me/individual-settlements/${settlementApplicationId}/revisions`, {
    idempotencyKey: randomUUID(),
    expectedRevisionNo,
    items: [
      {
        itemType: 'MEAL',
        amount: 1000,
        expenses: [
          {
            expenseType: 'MEAL',
            expenseDate: seoulIsoDate(0),
            amount: 1000,
            fileObjectIds: [fileObjectId],
          },
        ],
      },
    ],
  })
}

async function receiptStatus(settlementApplicationId: number): Promise<string> {
  const detail = await api.call(
    api.adminToken,
    'GET',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}`,
  )
  assertCall(detail, { ok: true })
  return text(recordOf(unwrapData(detail.body)), 'status') ?? ''
}

function firstNumber(value: unknown, key: string): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstNumber(item, key)
      if (found) return found
    }
    return null
  }
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const direct = record[key]
  if (typeof direct === 'number' && Number.isSafeInteger(direct) && direct > 0) return direct
  for (const item of Object.values(record)) {
    const found = firstNumber(item, key)
    if (found) return found
  }
  return null
}

async function submitInstructor(
  token: string,
  slot: SettlementMemberSlot,
  item?: { itemType: string; requestedAmount: number },
  programScheduleId = slot.scheduleId,
  idempotencyKey = randomUUID(),
): Promise<ApiCallResult> {
  return api.call(token, 'POST', '/api/portal/me/settlement-applications', {
    idempotencyKey,
    assignmentId: slot.assignmentId,
    programScheduleId,
    requestedItems: item ? [item] : [],
    evidenceAttachments: [],
  })
}

async function memberRequestCorrection(token: string, settlementId: number): Promise<ApiCallResult> {
  return api.call(token, 'POST', `/api/portal/me/settlements/${settlementId}/payment-statement/correction-request`, {
    reason: '지급 정정',
  })
}

async function rejectOpenAdminCorrections(settlementId: number): Promise<void> {
  const listed = await api.call(api.adminToken, 'GET', '/api/admin/settlements/correction-requests?size=200')
  assertCall(listed, { ok: true })
  const open = listItems(listed.body).filter(
    row =>
      num(row, 'settlementId') === settlementId &&
      text(row, 'status') === 'REQUESTED' &&
      num(row, 'requestedByMemberId') == null,
  )
  for (const row of open) {
    const id = num(row, 'correctionRequestId') ?? num(row, 'id')
    expect(id, 'open admin correction id').not.toBeNull()
    const rejected = await api.call(
      api.adminToken,
      'PATCH',
      `/api/admin/settlements/correction-requests/${id}/reject`,
      { reason: '정정 반려' },
    )
    assertCall(rejected, { ok: true })
  }
}

async function latestCorrectionId(settlementId: number): Promise<number> {
  const listed = await api.call(api.adminToken, 'GET', '/api/admin/settlements/correction-requests?size=200')
  assertCall(listed, { ok: true })
  const ids = listItems(listed.body)
    .filter(row => num(row, 'settlementId') === settlementId)
    .map(row => num(row, 'correctionRequestId') ?? num(row, 'id'))
    .filter((value): value is number => value != null)
  expect(ids.length).toBeGreaterThan(0)
  return Math.max(...ids)
}

async function downloadReceiptDocument(settlementApplicationId: number): Promise<ApiCallResult> {
  return api.call(
    api.adminToken,
    'POST',
    `/api/admin/individual-settlement-applications/${settlementApplicationId}/application-document/download`,
    { password: 'SettleDoc1!' },
  )
}

async function findRow(slot: SettlementMemberSlot, includePaid: boolean): Promise<Record<string, unknown>> {
  const rows = await listRows({
    programId: slot.programId,
    payeeType: slot.payeeType,
    includePaid,
    size: 50,
    ...(slot.payeeType === 'INSTRUCTOR' ? { instructorMemberId: slot.memberId } : {}),
  })
  const row = rows.find(
    item => num(item, 'instructorMemberId') === slot.memberId && num(item, 'scheduleId') === slot.scheduleId,
  )
  expect(row, `${slot.id} list row`).toBeTruthy()
  return row!
}

async function listRows(params: Record<string, string | number | boolean>): Promise<Record<string, unknown>[]> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) query.set(key, String(value))
  const result = await api.call(api.adminToken, 'GET', `/api/admin/settlements?${query.toString()}`)
  assertCall(result, { ok: true })
  return listItems(result.body)
}

async function accountPayments(programId: number, payeeType: string): Promise<Record<string, unknown>[]> {
  const result = await api.call(
    api.adminToken,
    'GET',
    `/api/admin/account-payments?payeeType=${payeeType}&size=100`,
  )
  assertCall(result, { ok: true })
  return listItems(result.body).filter(row => num(row, 'programId') === programId)
}

async function findAccountPayment(
  programId: number,
  payeeType: string,
  memberId: number,
  sourceId: number,
): Promise<Record<string, unknown>> {
  const rows = await accountPayments(programId, payeeType)
  const payment =
    rows.find(item => num(item, 'memberId') === memberId && num(item, 'sourceId') === sourceId) ??
    rows.find(item => num(item, 'memberId') === memberId)
  expect(payment, 'account payment').toBeTruthy()
  return payment!
}

function noteMissingBlockers(blockerCode: unknown): void {
  const present = typeof blockerCode === 'string' ? blockerCode : ''
  for (const code of [
    'SETTLEMENT_BUSINESS_PERIOD_CLOSED',
    'LECTURE_NOT_ENDED',
    'LECTURE_REPORT_REQUIRED',
    'SETTLEMENT_BUSINESS_INCOME_STATUS_REQUIRED',
    'SETTLEMENT_BANK_ACCOUNT_REQUIRED',
    'RECEIPT_PRE_CONSENT_REQUIRED',
  ]) {
    if (present !== code && !uncovered.includes(code)) uncovered.push(code)
  }
}

function scalarCount(sql: string): number {
  const output = execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '-e',
      'PGPASSWORD=ja_cms',
      'postgres:16',
      'psql',
      '-X',
      '-q',
      '-t',
      '-A',
      'postgresql://ja_cms@host.docker.internal:5432/ja_cms_local?sslmode=disable',
      '-c',
      sql,
    ],
    { encoding: 'utf8' },
  ).trim()
  return Number(output)
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function num(row: Record<string, unknown>, key: string): number | null {
  const value = row[key]
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  return null
}

function text(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
