import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/features/settlement-management/model/account-payments-list'
import {
  ACCOUNT_PAYMENT_STATUS_LABELS,
  isReceiptAccountPayment,
} from '@/features/settlement-management/model/account-payments-list'
import type {
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { formatGenderBirthDisplayLine } from '@/features/user/api/format-gender-birth-display'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type {
  AccountPaymentDetailResponse,
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
} from '@/shared/api/generated/settlement/schemas'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import { readSettlementRecognizedSessionCount } from '@/features/settlement-management/api/shared/settlement-recognized-session-count'
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

/**
 * 예금주 표시 — 서버 값을 그대로 쓴다(FE 재마스킹 없음, 기획 2026-11-12 Q3: 계좌 지급 상세는 원문).
 * `[E2E-SETTLE] 김정산`처럼 대괄호 접두어만 벗긴다. `[**산`처럼 서버 마스킹이 접두어와 섞여 깨진 값은 `***`.
 */
export function formatAccountHolderForDisplay(value: string | null | undefined): string {
  const raw = value?.trim()
  if (!raw) return '-'
  const stripped = raw.replace(/^\[[^\]]*]\s*/, '').trim()
  const source = stripped || raw
  if (source.includes('*') && (source.startsWith('[') || /^\*/.test(source))) return '***'
  return source
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

  // 영수증 건은 서버가 보낸 실비 항목만 그린다(강사비·원천징수 행을 빈 값으로 만들지 않는다, E3)
  if (lines.length === 0 && !isReceiptAccountPayment(row)) {
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
    recognizedSessionCount?: number | null
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
  const holderDisplay = formatAccountHolderForDisplay(row.accountHolder)

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
      // 프로그램 진행 회차(완료/전체 회차)는 정산 상세만. 차시 라벨·일정명(sessionLabel)으로 대체하지 않는다.
      programSessionProgressDisplay: extras?.programSessionProgressDisplay ?? '-',
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
      recognizedSessionCount: extras?.recognizedSessionCount ?? null,
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

  // 영수증 건: 강사 전용 값(강사비 기준·사업소득자)은 '-' (E3)
  const receipt = isReceiptAccountPayment(row)
  const detail = buildAccountPaymentStatusDetail(row, blocks, totalAmount, {
    programName: settlement.programNameKo ?? row.programName,
    businessPeriodDisplay: formatBusinessPeriodDisplay({
      period: settlement.period,
      businessPeriodStart: settlement.businessPeriodStart,
      businessPeriodEnd: settlement.businessPeriodEnd,
      formatDate: formatTransferDateDisplay,
    }),
    programSessionProgressDisplay: formatProgramSessionProgressDisplay(settlement),
    lectureFeeStandardTitle: receipt
      ? '-'
      : formatLectureFeeStandardTitle(settlement.lectureFeeStandardTitle),
    lectureFeeStandardAmount: receipt
      ? '-'
      : formatWonAmountDisplay(settlement.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: receipt
      ? '-'
      : formatBusinessIncomeEarnerLabel(settlement.businessIncomeEarnerLabel),
    recognizedSessionCount: readSettlementRecognizedSessionCount(settlement),
    paidAt: settlement.paidAt ?? row.paidAt,
  })
  if (!receipt) return detail
  return {
    ...detail,
    isReceiptPayment: true,
    receiptAttachments: (settlement.attachments ?? [])
      .filter(file => typeof file.fileObjectId === 'number' && file.fileObjectId > 0)
      .map(file => ({
        fileObjectId: file.fileObjectId as number,
        fileName: file.fileName?.trim() || '-',
        ...(file.contentType ? { contentType: file.contentType } : {}),
        ...(file.fileSize != null ? { fileSize: file.fileSize } : {}),
        ...(file.itemType ? { itemType: file.itemType } : {}),
        ...(file.applicationItemId != null ? { applicationItemId: file.applicationItemId } : {}),
      })),
  }
}

/**
 * 계좌 지급 현황 상세의 payee가 RAW(정책 CMS-09)이면 정산 계좌 원문. `*`가 섞인 값은 원문으로 보지 않는다.
 * sensitiveAccount가 우선이고, 없을 때만 쓴다.
 */
function readPayeeRawAccount(
  payee: SettlementFrontendResponse['payee']
): { bankAndNumber: string; holder?: string } | undefined {
  if (payee?.privacyMaskingLevel !== 'RAW') return undefined
  const accountNumber = payee.accountNumber?.trim()
  if (!accountNumber || accountNumber.includes('*')) return undefined
  const holder = payee.accountHolder?.trim()
  return {
    bankAndNumber: [payee.bankName?.trim(), accountNumber].filter(Boolean).join(' '),
    ...(holder && !holder.includes('*') ? { holder } : {}),
  }
}

/** `[E2E-SETTLE] 김정산`처럼 대괄호 접두어가 있으면 벗긴 원문 예금주 */
function stripAccountHolderPrefix(value: string): string {
  const raw = value.trim()
  return raw.replace(/^\[[^\]]*]\s*/, '').trim() || raw
}

/**
 * `GET /api/admin/account-payments/{id}`만 사용한다.
 * 권한 설정 V1.1 [고객사 확인]: 계좌 지급 현황 상세는 계좌번호를 기본 노출한다(목록은 미포함, 상세 진입 시 조회 이력 자동 기록).
 * 기획 2026-11-12 Q3: 성별·생년월일·연락처·이메일·자택 주소·정산 계좌(계좌번호·예금주)는 모두 원문이다.
 * FE는 다시 가리지 않고 서버 값을 그대로 표시한다(진입 자동 기록 「정산금의 계좌 지급 처리를 위함」은 서버).
 * 표시 계좌 = sensitiveAccount 원문 → 없으면 payee RAW 계좌 → 그래도 없으면 payment.maskedAccountNo(서버 마스킹).
 * 성별·연락처 등 = settlement.payee(계좌 지급 상세는 RAW)를 그대로 매핑, 없으면 `-`. 주민번호는 이 화면에 넣지 않는다.
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
  const payeeRawAccount = readPayeeRawAccount(settlement?.payee)
  const sensitiveBankAndNumber = sensitiveAccount
    ? [sensitiveAccount.bankName, sensitiveAccount.accountNo].filter(Boolean).join(' ') || undefined
    : undefined
  const plainBankAndNumber = sensitiveAccount?.accountNo?.trim()
    ? sensitiveBankAndNumber
    : (payeeRawAccount?.bankAndNumber ?? sensitiveBankAndNumber)
  const plainHolder =
    sensitiveAccount?.accountHolder?.trim() || payeeRawAccount?.holder || undefined
  /** 상세 표시용 원문 — 계좌번호가 있을 때만(은행명만 있으면 서버 마스킹 표시를 유지) */
  const displayPlainBankAndNumber =
    sensitiveAccount?.accountNo?.trim() || payeeRawAccount ? plainBankAndNumber : undefined

  // 표시 예금주: 원문(sensitive·payee RAW)이 있으면 접두어만 제거. 없으면 서버 값을 그대로.
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
    ...(payment?.payeeType ? { payeeType: payment.payeeType } : {}),
    ...(payment?.sourceType?.trim() ? { sourceType: payment.sourceType.trim() } : {}),
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

  const programId =
    settlement?.programId?.toString().trim() ||
    (mergedRow.programId != null ? String(mergedRow.programId) : undefined)
  // BE 응답 필드(OpenAPI AccountPaymentDetailResponse.programType). 생성 타입 갱신 전이라 좁혀 읽는다.
  const programType =
    (detail as AccountPaymentDetailResponse & { programType?: string | null }).programType?.trim() ||
    undefined

  if (!settlement && !payeeExtras && !plainBankAndNumber) return { ...base, programId, programType }

  return {
    ...base,
    programId,
    programType,
    basic: {
      ...base.basic,
      ...(payeeExtras ?? {}),
      settlementAccountBankNumberPart:
        displayPlainBankAndNumber ||
        [mergedRow.bankName, mergedRow.maskedAccountNo].filter(Boolean).join(' ') ||
        base.basic.settlementAccountBankNumberPart,
      settlementAccountHolderPart: plainHolder
        ? stripAccountHolderPrefix(plainHolder)
        : formatAccountHolderForDisplay(mergedRow.accountHolder),
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
