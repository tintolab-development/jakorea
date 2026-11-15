/**
 * 영수증 정산(참여자·봉사자) 「JA KOREA 정산 신청서」 — 시안 14680:103216.
 * `GET /api/admin/individual-settlement-applications/{id}/application-document` 응답(제출 스냅샷)만으로
 * 기존 지급조서 발급 미리보기(`PaymentStatementIssuanceViewModal`) 옵션을 만든다.
 *
 * - 회원·프로필·계좌 등 다른 API 값으로 빈 값을 채우지 않는다(소속 null → '-').
 * - 금액·합계를 재계산하지 않는다(공제 행은 서버가 음수로 준다).
 * - 계좌번호는 마스킹 응답값만 쓴다.
 */
import dayjs from 'dayjs'
import type {
  Line,
  SettlementApplicationDocumentResponse,
} from '@/shared/api/generated/settlement/schemas'
import type {
  PaymentOrderCalculationLineKind,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { formatDateDotWithWeekday } from '@/shared/utils/date'

/** 지급 목적 — 응답 paymentPurpose가 null이면 시안 문구(서버 PDF와 같음) */
export const RECEIPT_SETTLEMENT_PAYMENT_PURPOSE = '교통비·식사비·활동비 등 실비 지급'

function text(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function isDeduction(line: Line): boolean {
  return line.direction === 'DEDUCTION' || (line.amount ?? 0) < 0
}

function resolveLineKind(line: Line): PaymentOrderCalculationLineKind {
  if (isDeduction(line)) return 'withholding'
  const category = text(line.category)
  if (category.includes('교통')) return 'travel'
  if (category.includes('숙박')) return 'lodging'
  if (category.includes('식')) return 'meal'
  return 'activity'
}

function formatEducationDate(value: string | null | undefined): string {
  const raw = text(value)
  if (!raw) return ''
  return dayjs(raw).isValid() ? formatDateDotWithWeekday(raw) : raw
}

function buildBasicInfoValues(
  document: SettlementApplicationDocumentResponse
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const basic = document.basicInfo
  return {
    nameKo: text(basic?.name),
    nameEn: text(basic?.englishName),
    affiliation: text(basic?.affiliation),
    noAffiliation: false,
    addressRoad: text(basic?.homeAddress),
    addressDetail: text(basic?.homeAddressDetail),
    bankName: text(basic?.bank),
    accountNumber: text(basic?.accountNumberMasked),
    accountHolder: text(basic?.accountHolder),
    paymentPurpose: text(basic?.paymentPurpose) || RECEIPT_SETTLEMENT_PAYMENT_PURPOSE,
  }
}

/** 같은 교육 진행 일자·회차는 첫 열을 한 셀로 병합한다(응답 순서 유지). */
export function groupReceiptSettlementLinesIntoBlocks(
  lines: readonly Line[],
  settlementApplicationId: number
): PaymentOrderCalculationStatementSessionBlock[] {
  const blocks: PaymentOrderCalculationStatementSessionBlock[] = []
  const byKey = new Map<string, PaymentOrderCalculationStatementSessionBlock>()
  lines.forEach((line, index) => {
    const date = text(line.educationDate)
    const session = text(line.sessionLabel)
    const key = `${date}\u0000${session}`
    let block = byKey.get(key)
    if (!block) {
      block = {
        institutionName: '',
        lectureDateDisplay: formatEducationDate(date),
        lectureSessionDisplay: session,
        lines: [],
      }
      byKey.set(key, block)
      blocks.push(block)
    }
    block.lines.push({
      id: `receipt-settlement-${settlementApplicationId}-line-${index}`,
      // 항목 설명 열 = category, 구분 열 = description(없으면 '-')
      itemLabel: text(line.category),
      description: text(line.description),
      amount: line.amount ?? 0,
      kind: resolveLineKind(line),
    })
  })
  return blocks
}

export function buildReceiptSettlementPreviewOptions(input: {
  document: SettlementApplicationDocumentResponse
  settlementApplicationId: number
}): RenderFormParagraphBodyOptions {
  const { document, settlementApplicationId } = input
  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(document),
    paymentStatementBasicInfoHideResidentNumberRow: true,
    paymentStatementCalculationLines: {
      blocks: groupReceiptSettlementLinesIntoBlocks(document.lines ?? [], settlementApplicationId),
      formulaLabel: text(document.total?.formulaLabel),
      totalAmount: document.total?.amount ?? 0,
      hideInstitutionColumn: true,
      columnPreset: 'receipt-settlement',
    },
    paymentStatementDisplayMode: 'document',
  }
}

/** 미리보기 상단 파일명 — 서버 PDF 파일명 규칙(`[JA Korea] 정산 신청서_{성명}_{제출일 yyMMdd}`)과 같게 */
export function buildReceiptSettlementDocumentFileName(
  document: SettlementApplicationDocumentResponse
): string {
  const name = text(document.basicInfo?.name)
  const submitted = document.submittedAt ? dayjs(document.submittedAt) : null
  const date = submitted?.isValid() ? submitted.format('YYMMDD') : ''
  return ['[JA Korea] 정산 신청서', name, date].filter(Boolean).join('_')
}
