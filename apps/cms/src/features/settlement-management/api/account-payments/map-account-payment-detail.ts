import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/features/settlement-management/model/account-payments-list'
import { ACCOUNT_PAYMENT_STATUS_LABELS } from '@/features/settlement-management/model/account-payments-list'
import type {
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { toApiBirthDate } from '@/features/user/api/map-member-gender-birth'
import {
  formatBirthDisplayWithManAge,
  formatGenderBirthDisplayLine,
} from '@/features/user/api/format-gender-birth-display'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type {
  AccountPaymentDetailResponse,
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
} from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  formatBusinessIncomeEarnerLabel,
  formatBusinessPeriodDisplay,
  formatLectureFeeStandardTitle,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
  prepareSettlementFrontendItemsForStatement,
} from '@/features/settlement-management/api/shared/map-frontend-fields'
import { mapSettlementPayeeToInstructorBasicFields } from '@/features/settlement-management/api/payment-orders/map-settlement-payee'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import { formatDateDotWithWeekday } from '@/shared/utils/date'

function formatTransferDateDisplay(iso: string): string {
  if (!iso) return '-'
  const label = formatDateDotWithWeekday(iso.slice(0, 10))
  return label === '-' ? iso : label
}

function formatPaidAtDisplay(iso: string | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const year = values.year
  const month = values.month
  const day = values.day
  if (!year || !month || !day) return '-'
  return formatTransferDateDisplay(`${year}-${month}-${day}`)
}

/** `[E2E-SETTLE] 김정산`처럼 대괄호 접두어가 있으면 벗긴 뒤 예금주 마스킹 */
export function maskAccountHolderForDisplay(value: string | null | undefined): string {
  const raw = value?.trim()
  if (!raw) return '-'
  const stripped = raw.replace(/^\[[^\]]*]\s*/, '').trim()
  const source = stripped || raw
  // 이미 정상 마스킹(김*산)이면 유지. `[**산`처럼 깨진 값은 복구 불가면 ***
  if (source.includes('*')) {
    if (!source.startsWith('[') && !/^\*/.test(source)) return source
    return '***'
  }
  return MASKING_POLICY.accountHolderName(source)
}

function formatLectureDateDisplay(iso: string | null | undefined): string {
  if (!iso) return '-'
  return formatTransferDateDisplay(iso)
}

function resolveInstitutionName(
  row: AccountPaymentRow,
  institutionName?: string | null
): string {
  const fromApi = institutionName?.trim()
  if (fromApi) return fromApi
  if (row.institutionName && row.institutionName !== '-') return row.institutionName
  return '-'
}

function resolveSessionDisplay(
  row: AccountPaymentRow,
  lectureSessionDisplay?: string | null
): string {
  const fromApi = lectureSessionDisplay?.trim()
  if (fromApi) return fromApi
  if (row.sessionLabel && row.sessionLabel !== '-') return row.sessionLabel
  return '-'
}

function mapFrontendItemToCalcLine(
  item: SettlementFrontendItemResponse,
  index: number
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  const kind = mapSettlementFrontendItemTypeToLineKind(item.type, amount)
  const mappedBasisDetail = mapCalculationDetailToBasisDetail(item.calculationDetail)
  // withholding·교통비 등에 lectureFee* calculationDetail이 와도 강사비 모달로 연결하지 않는다.
  const basisDetail =
    kind !== 'lecture_fee' &&
    mappedBasisDetail &&
    (mappedBasisDetail.layout === 'lectureFeeTier' ||
      mappedBasisDetail.layout === 'lectureFeeSpecial' ||
      mappedBasisDetail.layout === 'lectureFeeGemini')
      ? undefined
      : mappedBasisDetail
  return {
    id: `calc-line-api-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '-',
    amount,
    kind,
    basisDetail,
  }
}

function buildBlocksFromFrontendSettlement(
  row: AccountPaymentRow,
  settlement: SettlementFrontendResponse
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = prepareSettlementFrontendItemsForStatement(settlement.items)
  const lines = items.map(mapFrontendItemToCalcLine)

  if (lines.length === 0) {
    lines.push({
      id: 'calc-line-api-fallback',
      itemLabel: '정산 예정',
      description: '계좌 지급 확인',
      amount: row.amount,
      kind: 'lecture_fee',
    })
  }

  return [
    {
      institutionName: resolveInstitutionName(row, settlement.institutionName),
      lectureDateDisplay: formatLectureDateDisplay(row.lectureDate ?? row.transferScheduledDate),
      lectureSessionDisplay: resolveSessionDisplay(row, settlement.lectureSessionDisplay),
      lines,
    },
  ]
}

function buildFallbackBlocks(row: AccountPaymentRow): PaymentOrderCalculationStatementSessionBlock[] {
  return [
    {
      institutionName: resolveInstitutionName(row),
      lectureDateDisplay: formatLectureDateDisplay(row.lectureDate ?? row.transferScheduledDate),
      lectureSessionDisplay: resolveSessionDisplay(row),
      lines: [
        {
          id: 'calc-line-api-fallback',
          itemLabel: '정산 예정',
          description: '계좌 지급 확인',
          amount: row.amount,
          kind: 'lecture_fee',
        },
      ],
    },
  ]
}

function sumFrontendItemsAmount(items: SettlementFrontendItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

/** 빈 값만 `-`. 마스킹(`*`, `****`, `마스킹` 등)은 유효 표시로 유지 */
function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function formatGenderBirthDisplay(
  gender: string | null | undefined,
  birthDate: string | null | undefined,
  birthYear: number | null | undefined
): string {
  return formatGenderBirthDisplayLine(gender, birthDate, { birthYear })
}

function formatHomeAddressDisplay(
  homeAddress: { line?: string; detail?: string } | null | undefined
): string {
  if (!homeAddress) return '-'
  const line = homeAddress.line?.trim()
  const detail = homeAddress.detail?.trim()
  const parts = [line, detail].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' ') : '-'
}

/**
 * 이미 마스킹된 강사 회원 스냅샷을 표시 칸에 합친다.
 * 계좌 지급 화면의 조회 경로는 `applyMaskedInstructorMemberToAccountPaymentDetail`을 쓴다.
 */
export function applyInstructorMemberPiiToAccountPaymentDetail(
  detail: AccountPaymentStatusDetail,
  instructor: InstructorMemberDetailResponse | null | undefined
): AccountPaymentStatusDetail {
  if (!instructor) return detail

  const member = instructor.member
  const hasMemberPii = member != null
  const hasAddress = instructor.profile?.homeAddress != null
  if (!hasMemberPii && !hasAddress) return detail

  return {
    ...detail,
    basic: {
      ...detail.basic,
      genderBirthDisplay: hasMemberPii
        ? formatGenderBirthDisplay(member?.gender, member?.birthDate, member?.birthYear)
        : detail.basic.genderBirthDisplay,
      phoneDisplay: hasMemberPii ? displayOrDash(member?.phone) : detail.basic.phoneDisplay,
      emailDisplay: hasMemberPii ? displayOrDash(member?.email) : detail.basic.emailDisplay,
      addressDisplay: hasAddress
        ? formatHomeAddressDisplay(instructor.profile?.homeAddress)
        : detail.basic.addressDisplay,
      scheduleChangeCancelCount:
        member?.scheduleChangeCancelCount ?? detail.basic.scheduleChangeCancelCount,
    },
  }
}

function maskPlainOrKeep(value: string | null | undefined, mask: (input: string) => string): string {
  const raw = value?.trim()
  if (!raw) return '-'
  const masked = mask(raw)
  if (masked.includes('*')) return masked
  return '***'
}

/**
 * 강사 회원 마스킹 GET 값만 계좌 지급 상세의 일반 개인정보 칸에 넣는다.
 * 응답이 원문이면 다시 마스킹한다. 계좌번호는 여기서 채우지 않는다.
 */
export function applyMaskedInstructorMemberToAccountPaymentDetail(
  detail: AccountPaymentStatusDetail,
  instructor: InstructorMemberDetailResponse | null | undefined
): AccountPaymentStatusDetail {
  if (!instructor) return detail
  const member = instructor.member
  const address = formatHomeAddressDisplay(instructor.profile?.homeAddress)
  const birthYear =
    member?.birthYear ??
    (member?.birthDate ? Number(toApiBirthDate(member.birthDate)?.slice(0, 4)) : undefined)
  const genderPart = member?.gender?.trim() ? '**' : '-'
  const birthPart = formatBirthDisplayWithManAge(member?.birthDate, {
    birthYear,
    forceMaskedDate: true,
  })
  const genderBirthDisplay =
    member != null
      ? genderPart === '-' && birthPart === '-'
        ? '-'
        : `${genderPart} | ${birthPart}`
      : detail.basic.genderBirthDisplay

  return {
    ...detail,
    basic: {
      ...detail.basic,
      genderBirthDisplay:
        member != null ? genderBirthDisplay : detail.basic.genderBirthDisplay,
      phoneDisplay: member ? maskPlainOrKeep(member.phone, MASKING_POLICY.phone) : detail.basic.phoneDisplay,
      emailDisplay: member ? maskPlainOrKeep(member.email, MASKING_POLICY.email) : detail.basic.emailDisplay,
      addressDisplay:
        instructor.profile?.homeAddress != null
          ? maskPlainOrKeep(address === '-' ? undefined : address, MASKING_POLICY.address)
          : detail.basic.addressDisplay,
    },
  }
}

/** `payment.memberId` → `settlement.instructorId` → 목록 row 순 */
export function resolveAccountPaymentMemberId(
  detail: AccountPaymentDetailResponse,
  row: AccountPaymentRow
): number | undefined {
  const fromPayment = detail.payment?.memberId
  if (typeof fromPayment === 'number' && Number.isFinite(fromPayment) && fromPayment > 0) {
    return fromPayment
  }

  const fromSettlement = detail.settlement?.instructorId
  if (fromSettlement != null && String(fromSettlement).trim() !== '') {
    const parsed = Number(fromSettlement)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  const fromRow = row.instructorMemberId
  if (typeof fromRow === 'number' && Number.isFinite(fromRow) && fromRow > 0) {
    return fromRow
  }

  return undefined
}

function buildAccountPaymentStatusDetail(
  row: AccountPaymentRow,
  blocks: PaymentOrderCalculationStatementSessionBlock[],
  totalAmount: number,
  extras?: {
    programName?: string
    businessPeriodDisplay?: string
    programSessionProgressDisplay?: string
    lectureFeeStandardTitle?: string
    lectureFeeStandardAmount?: string
    businessIncomeEarnerLabel?: string
    accountPaymentStatus?: AccountPaymentStatusDetail['basic']['accountPaymentStatus']
    transferScheduledDate?: string
    paidAt?: string
    genderBirthDisplay?: string
    phoneDisplay?: string
    emailDisplay?: string
    addressDisplay?: string
    nameEn?: string
    plainBankAndNumber?: string
    plainHolder?: string
  }
): AccountPaymentStatusDetail {
  const bankAndNumber = [row.bankName, row.maskedAccountNo].filter(Boolean).join(' ') || '-'
  const accountPaymentStatus = extras?.accountPaymentStatus ?? row.accountPaymentStatus
  const holderDisplay = maskAccountHolderForDisplay(row.accountHolder)

  return {
    basic: {
      nameKo: row.instructorName,
      nameEn: extras?.nameEn ?? '-',
      genderBirthDisplay: extras?.genderBirthDisplay ?? '-',
      scheduleChangeCancelCount: undefined,
      phoneDisplay: extras?.phoneDisplay ?? '-',
      emailDisplay: extras?.emailDisplay ?? '-',
      addressDisplay: extras?.addressDisplay ?? '-',
      settlementAccountBankNumberPart: bankAndNumber,
      settlementAccountHolderPart: holderDisplay,
      programName: extras?.programName ?? row.programName,
      programSessionProgressDisplay:
        extras?.programSessionProgressDisplay ??
        (row.sessionLabel !== '-' ? row.sessionLabel : '-'),
      businessPeriodDisplay: extras?.businessPeriodDisplay ?? '-',
      accountPaymentStatus,
      accountPaymentStatusLabel: ACCOUNT_PAYMENT_STATUS_LABELS[accountPaymentStatus],
      transferScheduledDateDisplay: formatTransferDateDisplay(
        extras?.transferScheduledDate ?? row.transferScheduledDate
      ),
      paidAtDisplay:
        accountPaymentStatus === 'account_paid'
          ? formatPaidAtDisplay(extras?.paidAt ?? row.paidAt)
          : '-',
      lectureFeeStandardTitle: extras?.lectureFeeStandardTitle ?? '-',
      lectureFeeStandardAmount:
        extras?.lectureFeeStandardAmount ??
        (row.amount > 0 ? `${row.amount.toLocaleString('ko-KR')}원` : '-'),
      businessIncomeEarnerLabel: extras?.businessIncomeEarnerLabel ?? '해당 없음',
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
    plainAccountForPaymentConfirm: {
      bankAndNumber: extras?.plainBankAndNumber ?? bankAndNumber,
      holder: extras?.plainHolder ?? (row.accountHolder?.trim() || row.instructorName),
    },
  }
}

export function mapAccountPaymentDetailRemote(
  row: AccountPaymentRow,
  settlement: SettlementFrontendResponse
): AccountPaymentStatusDetail {
  const blocks = buildBlocksFromFrontendSettlement(row, settlement)
  const itemsTotal = sumFrontendItemsAmount(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : row.amount)

  return buildAccountPaymentStatusDetail(row, blocks, totalAmount, {
    programName: settlement.programNameKo ?? row.programName,
    businessPeriodDisplay: formatBusinessPeriodDisplay({
      period: settlement.period,
      businessPeriodStart: settlement.businessPeriodStart,
      businessPeriodEnd: settlement.businessPeriodEnd,
      formatDate: formatTransferDateDisplay,
    }),
    programSessionProgressDisplay: formatProgramSessionProgressDisplay(settlement),
    lectureFeeStandardTitle: formatLectureFeeStandardTitle(settlement.lectureFeeStandardTitle),
    lectureFeeStandardAmount: formatWonAmountDisplay(settlement.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: formatBusinessIncomeEarnerLabel(
      settlement.businessIncomeEarnerLabel
    ),
    paidAt: settlement.paidAt ?? row.paidAt,
  })
}

/**
 * `GET /api/admin/account-payments/{id}`만 사용한다.
 * 표시 계좌번호 = payment.maskedAccountNo (원문 sensitiveAccount는 지급 확인용).
 * 성별·연락처 등 = settlement.payee(MASKED)가 있으면 매핑, 없으면 `-`.
 */
export function mapAccountPaymentDetailFromGetApi(
  row: AccountPaymentRow,
  detail: AccountPaymentDetailResponse
): AccountPaymentStatusDetail {
  const payment = detail.payment
  const settlement = detail.settlement ?? undefined
  const sensitiveAccount = detail.sensitiveAccount
  const payeeFields = mapSettlementPayeeToInstructorBasicFields(settlement?.payee)

  const displayBankName =
    payment?.bankName?.trim() ||
    payeeFields?.settlementAccountBankNumberPart.split(' ')[0] ||
    row.bankName
  const displayMaskedAccountNo =
    payment?.maskedAccountNo?.trim() ||
    payeeFields?.settlementAccountBankNumberPart.split(' ').slice(1).join(' ') ||
    row.maskedAccountNo
  const plainBankAndNumber = sensitiveAccount
    ? [sensitiveAccount.bankName, sensitiveAccount.accountNo].filter(Boolean).join(' ') || undefined
    : undefined
  const plainHolder = sensitiveAccount?.accountHolder?.trim() || undefined

  // 표시 예금주: 원문(sensitive)이 있으면 접두어 제거 후 재마스킹. 없으면 목록 마스킹값.
  const displayHolder =
    plainHolder ||
    payment?.accountHolder?.trim() ||
    payeeFields?.settlementAccountHolderPart ||
    row.accountHolder

  const mergedRow: AccountPaymentRow = {
    ...row,
    instructorName: payment?.instructorName ?? settlement?.instructorName ?? row.instructorName,
    programName:
      payment?.programNameKo?.trim() ||
      payment?.programName?.trim() ||
      settlement?.programNameKo ||
      row.programName,
    institutionName:
      payment?.institutionName?.trim() ||
      settlement?.institutionName?.trim() ||
      row.institutionName,
    sessionLabel: payment?.sessionLabel?.trim() || row.sessionLabel,
    lectureDate: payment?.lectureDate ?? row.lectureDate,
    amount: payment?.netPaymentAmount ?? row.amount,
    transferScheduledDate:
      payment?.scheduledPaymentDate ?? settlement?.expectedTransferDate ?? row.transferScheduledDate,
    paidAt: payment?.paidAt ?? settlement?.paidAt ?? row.paidAt,
    bankName: displayBankName,
    maskedAccountNo: displayMaskedAccountNo,
    accountHolder: displayHolder,
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(payment?.paymentStatus),
    instructorMemberId:
      resolveAccountPaymentMemberId(detail, row) ?? row.instructorMemberId,
  }

  const payeeExtras = payeeFields
    ? {
        nameEn: payeeFields.nameEn,
        genderBirthDisplay: payeeFields.genderBirthDisplay,
        phoneDisplay: payeeFields.phoneDisplay,
        emailDisplay: payeeFields.emailDisplay,
        addressDisplay: payeeFields.addressDisplay,
      }
    : undefined

  const base = settlement
    ? mapAccountPaymentDetailRemote(mergedRow, settlement)
    : buildAccountPaymentStatusDetail(
        mergedRow,
        buildFallbackBlocks(mergedRow),
        mergedRow.amount,
        {
          programName: mergedRow.programName,
          accountPaymentStatus: mergedRow.accountPaymentStatus,
          transferScheduledDate: mergedRow.transferScheduledDate,
          paidAt: mergedRow.paidAt,
          ...payeeExtras,
          plainBankAndNumber,
          plainHolder,
        }
      )

  if (!settlement && !payeeExtras && !plainBankAndNumber) return base

  return {
    ...base,
    basic: {
      ...base.basic,
      ...(payeeExtras ?? {}),
      settlementAccountBankNumberPart:
        [mergedRow.bankName, mergedRow.maskedAccountNo].filter(Boolean).join(' ') ||
        base.basic.settlementAccountBankNumberPart,
      settlementAccountHolderPart: maskAccountHolderForDisplay(mergedRow.accountHolder),
    },
    plainAccountForPaymentConfirm: {
      bankAndNumber:
        plainBankAndNumber || base.plainAccountForPaymentConfirm?.bankAndNumber || '-',
      holder:
        plainHolder ||
        base.plainAccountForPaymentConfirm?.holder ||
        mergedRow.instructorName,
    },
  }
}
