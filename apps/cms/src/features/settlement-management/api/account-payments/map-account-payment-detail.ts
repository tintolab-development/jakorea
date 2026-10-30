import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/features/settlement-management/model/account-payments-list'
import { ACCOUNT_PAYMENT_STATUS_LABELS } from '@/features/settlement-management/model/account-payments-list'
import type {
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type {
  AccountPaymentDetailResponse,
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
} from '@/shared/api/generated/settlement/schemas'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/shared/map-frontend-fields'
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
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTransferDateDisplay(iso: string): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  const dow = KO_WEEKDAY[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
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
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  if (!year || !month || !day) return '-'

  const dow = KO_WEEKDAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}(${dow})`
}

function formatLectureDateDisplay(iso: string | null | undefined): string {
  if (!iso) return '-'
  return formatTransferDateDisplay(iso)
}

function toRoundSessionLabel(label: string): string {
  return label.replace(/차시/g, '회차')
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
  lectureSessionDisplay?: string,
  sessionOrdinal?: number
): string {
  const fromApi = lectureSessionDisplay?.trim()
  if (fromApi) return toRoundSessionLabel(fromApi)
  if (sessionOrdinal != null) return toRoundSessionLabel(formatLectureSessionLabel(sessionOrdinal))
  if (row.sessionLabel && row.sessionLabel !== '-') return toRoundSessionLabel(row.sessionLabel)
  return '-'
}

function mapFrontendItemToCalcLine(
  item: SettlementFrontendItemResponse,
  index: number
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  return {
    id: `calc-line-api-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '-',
    amount,
    kind: mapSettlementFrontendItemTypeToLineKind(item.type, amount),
    basisDetail: mapCalculationDetailToBasisDetail(item.calculationDetail),
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
      lectureSessionDisplay: resolveSessionDisplay(
        row,
        settlement.lectureSessionDisplay,
        settlement.sessionOrdinal
      ),
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

function formatBirthDisplay(
  birthDate: string | null | undefined,
  birthYear: number | null | undefined
): string {
  const dateRaw = birthDate?.trim()
  if (dateRaw) {
    const api = toApiBirthDate(dateRaw)
    if (api) {
      const [y, m, d] = api.split('-')
      if (y && m && d) return `${y}. ${m}. ${d}`
    }
    return dateRaw
  }
  if (birthYear != null && Number.isFinite(birthYear)) {
    return `${birthYear}. **. **`
  }
  return '-'
}

function formatGenderBirthDisplay(
  gender: string | null | undefined,
  birthDate: string | null | undefined,
  birthYear: number | null | undefined
): string {
  const genderPart = toDisplayGender(gender)
  const birthPart = formatBirthDisplay(birthDate, birthYear)
  if (genderPart === '-' && birthPart === '-') return '-'
  return `${genderPart} | ${birthPart}`
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
  const birthApi = toApiBirthDate(member?.birthDate)
  const birthYear =
    member?.birthYear ?? (birthApi ? Number(birthApi.slice(0, 4)) : undefined)
  const genderPart = member?.gender?.trim() ? '**' : '-'
  const birthPart =
    birthYear != null && Number.isFinite(birthYear) ? `${birthYear}. **. **` : '-'
  const genderBirthDisplay =
    genderPart === '-' && birthPart === '-' ? '-' : `${genderPart} | ${birthPart}`

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
  }
): AccountPaymentStatusDetail {
  const bankAndNumber = [row.bankName, row.maskedAccountNo].filter(Boolean).join(' ') || '-'
  const accountPaymentStatus = extras?.accountPaymentStatus ?? row.accountPaymentStatus

  return {
    basic: {
      nameKo: row.instructorName,
      nameEn: '-',
      // 성별·생년월일·연락처·이메일·주소는 계좌 지급 GET에 없다. BE_HANDOFF_REQUIRED.
      genderBirthDisplay: '-',
      scheduleChangeCancelCount: undefined,
      phoneDisplay: '-',
      emailDisplay: '-',
      addressDisplay: '-',
      settlementAccountBankNumberPart: bankAndNumber,
      settlementAccountHolderPart: row.accountHolder?.trim() || '-',
      programName: extras?.programName ?? row.programName,
      programSessionProgressDisplay:
        extras?.programSessionProgressDisplay ??
        (row.sessionLabel !== '-' ? toRoundSessionLabel(row.sessionLabel) : '-'),
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
      bankAndNumber,
      holder: row.accountHolder?.trim() || row.instructorName,
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
    programSessionProgressDisplay: toRoundSessionLabel(formatProgramSessionProgressDisplay(settlement)),
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
 * 성별·생년월일·연락처·이메일·주소는 이 응답에 없으면 `-`로 둔다.
 * 계좌 원문은 sensitiveAccount만 사용한다.
 */
export function mapAccountPaymentDetailFromGetApi(
  row: AccountPaymentRow,
  detail: AccountPaymentDetailResponse
): AccountPaymentStatusDetail {
  const payment = detail.payment
  const settlement = detail.settlement ?? undefined
  const sensitiveAccount = detail.sensitiveAccount

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
    sessionLabel:
      payment?.sessionLabel?.trim() ||
      (payment?.sessionOrdinal != null
        ? formatLectureSessionLabel(payment.sessionOrdinal)
        : undefined) ||
      row.sessionLabel,
    lectureDate: payment?.lectureDate ?? row.lectureDate,
    amount: payment?.netPaymentAmount ?? row.amount,
    transferScheduledDate:
      payment?.scheduledPaymentDate ?? settlement?.expectedTransferDate ?? row.transferScheduledDate,
    paidAt: payment?.paidAt ?? settlement?.paidAt ?? row.paidAt,
    bankName: sensitiveAccount?.bankName?.trim() || payment?.bankName || row.bankName,
    maskedAccountNo:
      sensitiveAccount?.accountNo?.trim() || payment?.maskedAccountNo || row.maskedAccountNo,
    accountHolder:
      sensitiveAccount?.accountHolder?.trim() || payment?.accountHolder || row.accountHolder,
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(payment?.paymentStatus),
    instructorMemberId:
      resolveAccountPaymentMemberId(detail, row) ?? row.instructorMemberId,
  }

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
        }
      )

  return base
}
