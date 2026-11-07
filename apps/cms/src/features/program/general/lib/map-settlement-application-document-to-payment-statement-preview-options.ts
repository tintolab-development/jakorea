/**
 * 확정 전 정산 신청서 지급조서 — `GET /api/admin/settlement-applications/{id}/application-document`
 * 응답(제출 스냅샷)만으로 지급조서 미리보기 옵션을 만든다.
 *
 * - 회원·강사 프로필·계좌·정산 상세 등 다른 API 값으로 빈 값을 채우지 않는다.
 * - affiliation / educationStartAt·EndAt / recognizedSessionCount 가 null이면 값 없음 그대로 둔다.
 *   (recognizedSessionCount를 educationSessionCount로 대체하지 않음)
 * - 금액·차시·시간을 재계산하지 않는다.
 * - 주민번호·계좌번호는 마스킹 응답값만 사용한다.
 */
import dayjs from 'dayjs'
import type {
  CalcInfo,
  CalcInfoInstructorFeeCalculationUnit,
  Line,
  SettlementApplicationDocumentResponse,
} from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrderCalculationLineKind } from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { formatInstructorFeeGradeLabel } from '@/shared/constants/instructor-fee-grade'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'

/** 관리자 지급조서 화면 강사비 책정 단위 라벨 */
export const INSTRUCTOR_FEE_CALCULATION_UNIT_LABELS: Record<
  NonNullable<CalcInfoInstructorFeeCalculationUnit>,
  string
> = {
  PER_HOUR: '1시간당',
  PER_CLASS: '출강 1회당',
  PER_SESSION: '차시당',
  PER_LECTURE: '강의 1회당',
}

/** 템플릿 autofill 값은 문자열 계약이라 값 없음은 '' (화면 placeholder는 템플릿 공통 규칙) */
function text(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function formatWon(value: number | null | undefined): string {
  return value != null ? `${value.toLocaleString('ko-KR')}원` : ''
}

function formatCount(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}

export function formatInstructorFeeCalculationUnitLabel(
  unit: CalcInfo['instructorFeeCalculationUnit']
): string {
  if (!unit) return ''
  return INSTRUCTOR_FEE_CALCULATION_UNIT_LABELS[unit] ?? ''
}

/** educationStartAt/EndAt(ISO instant) → `YYYY.MM.DD(요일) HH:mm ~ HH:mm`. 둘 중 하나라도 없으면 값 없음 */
export function formatEducationTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  if (!startAt || !endAt) return ''
  const start = dayjs(startAt)
  const end = dayjs(endAt)
  if (!start.isValid() || !end.isValid()) return ''
  return `${formatDateDotWithWeekday(start)} ${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
}

function formatBusinessIncome(value: boolean | null | undefined): string {
  if (value === true) return '해당'
  if (value === false) return '해당 없음'
  return ''
}

function splitMaskedResidentNumber(masked: string | null | undefined): {
  residentFront: string
  residentBack: string
} {
  const value = text(masked)
  if (!value) return { residentFront: '', residentBack: '' }
  const dash = value.indexOf('-')
  if (dash < 0) return { residentFront: value, residentBack: '' }
  return { residentFront: value.slice(0, dash), residentBack: value.slice(dash + 1) }
}

function resolveLineKind(line: Line): PaymentOrderCalculationLineKind {
  if (line.direction === 'DEDUCTION') return 'withholding'
  const category = text(line.category)
  if (category.includes('교통')) return 'travel'
  if (category.includes('숙박')) return 'lodging'
  if (category.includes('식')) return 'meal'
  if (category.includes('활동')) return 'activity'
  return 'lecture_fee'
}

function buildBasicInfoValues(
  document: SettlementApplicationDocumentResponse
): Partial<PaymentStatementBasicInfoAutofillValues> {
  const basic = document.basicInfo
  return {
    nameKo: text(basic?.name),
    nameEn: text(basic?.englishName),
    ...splitMaskedResidentNumber(basic?.residentNumberMasked),
    affiliation: text(basic?.affiliation),
    noAffiliation: false,
    addressRoad: text(basic?.homeAddress),
    addressDetail: text(basic?.homeAddressDetail),
    bankName: text(basic?.bank),
    accountNumber: text(basic?.accountNumberMasked),
    accountHolder: text(basic?.accountHolder),
    paymentPurpose: text(basic?.paymentPurpose),
  }
}

function buildLectureFeeCalculationValues(
  calcInfo: CalcInfo | null | undefined
): Partial<LectureFeeCalculationAutofillValues> {
  return {
    lectureFeeType: calcInfo?.lectureFeeType
      ? formatInstructorFeeGradeLabel(calcInfo.lectureFeeType)
      : '',
    feeBasisLeft: formatInstructorFeeCalculationUnitLabel(calcInfo?.instructorFeeCalculationUnit),
    feeBasisRight: formatWon(calcInfo?.instructorFeeAmount),
    businessIncomeLeft: formatBusinessIncome(calcInfo?.businessIncomeYn),
    businessIncomeRight: '',
    // 교육 진행 차시 = 인정 차시. educationSessionCount(회차 번호)로 대체하지 않는다.
    sessionCount: formatCount(calcInfo?.recognizedSessionCount),
    sessionHours: '',
    transportFee: false,
    lodgingFee: false,
    totalStudents: formatCount(calcInfo?.totalStudentCount),
    totalLectureFee:
      calcInfo?.totalLectureFee != null ? calcInfo.totalLectureFee.toLocaleString('ko-KR') : '',
  }
}

function buildCalculationLines(
  document: SettlementApplicationDocumentResponse,
  applicationId: number
): PaymentStatementCalculationLinesViewModel {
  const lines = document.lines ?? []
  const first = lines[0]
  const educationTime = formatEducationTimeRange(
    document.calcInfo?.educationStartAt,
    document.calcInfo?.educationEndAt
  )

  return {
    blocks: [
      {
        institutionName: text(first?.institutionName),
        lectureDateDisplay: educationTime || text(first?.educationDate),
        lectureSessionDisplay: text(first?.sessionLabel),
        lines: lines.map((line, index) => ({
          id: `settlement-application-${applicationId}-line-${index}`,
          itemLabel: text(line.category),
          description: text(line.description),
          amount: line.amount ?? 0,
          kind: resolveLineKind(line),
        })),
      },
    ],
    formulaLabel: text(document.total?.formulaLabel),
    totalAmount: document.total?.amount ?? 0,
  }
}

export function buildPaymentStatementPreviewOptionsFromApplicationDocument(input: {
  document: SettlementApplicationDocumentResponse
  settlementApplicationId: number
  /** 개인형 프로그램 — 산출 내역 「참여 기관명」열 미노출 */
  hideInstitutionColumn?: boolean
}): RenderFormParagraphBodyOptions {
  return {
    paymentStatementBasicInfoValues: buildBasicInfoValues(input.document),
    lectureFeeCalculationValues: buildLectureFeeCalculationValues(input.document.calcInfo),
    paymentStatementCalculationLines: {
      ...buildCalculationLines(input.document, input.settlementApplicationId),
      ...(input.hideInstitutionColumn ? { hideInstitutionColumn: true } : {}),
    },
    paymentStatementDisplayMode: 'document',
  }
}

/**
 * 산출 내역서(프로그램형) — 확정 전 신청서 행.
 * 프로그램 맥락(프로그램명·기간·처리 현황)은 이미 받은 정산 목록 행 기반 base를 쓰고,
 * 강사비 책정·사업소득·산출 행·합계는 신청서 문서 스냅샷으로만 채운다.
 */
export function applyApplicationDocumentToProgramCalculationStatement(
  base: PaymentOrderProgramCalculationStatement,
  document: SettlementApplicationDocumentResponse,
  settlementApplicationId: number
): PaymentOrderProgramCalculationStatement {
  if (base.context !== 'program') return base
  const calcInfo = document.calcInfo
  const linesModel = buildCalculationLines(document, settlementApplicationId)
  const recognizedSessionCount = calcInfo?.recognizedSessionCount
  const [block] = linesModel.blocks

  return {
    ...base,
    basic: {
      ...base.basic,
      lectureFeeStandardTitle: [
        calcInfo?.lectureFeeType ? formatInstructorFeeGradeLabel(calcInfo.lectureFeeType) : '',
        formatInstructorFeeCalculationUnitLabel(calcInfo?.instructorFeeCalculationUnit),
      ]
        .filter(Boolean)
        .join(' · '),
      lectureFeeStandardAmount: formatWon(calcInfo?.instructorFeeAmount),
      businessIncomeEarnerLabel: formatBusinessIncome(calcInfo?.businessIncomeYn),
    },
    blocks: block
      ? [
          {
            ...block,
            // 교육 진행 차시 = 인정 차시. educationSessionCount로 대체하지 않는다.
            lectureSessionDisplay:
              recognizedSessionCount != null ? `${recognizedSessionCount}차시` : '',
          },
        ]
      : [],
    formulaLabel: linesModel.formulaLabel,
    totalAmount: linesModel.totalAmount,
  }
}

/** 신청서 지급조서 조회 오류 안내 (401은 공통 로그인 만료 처리) */
export function getSettlementApplicationDocumentErrorMessage(error: unknown): string {
  const status = getApiErrorHttpStatus(error)
  if (status === 403) return '정산 신청서를 조회할 권한 또는 프로그램 접근 범위가 없습니다.'
  if (status === 404) return '해당 정산 신청서 또는 revision을 조회할 수 없습니다.'
  if (status === 400) return '잘못된 revision 번호입니다.'
  return getSettlementApiErrorMessage(error, '지급조서를 불러오지 못했습니다.')
}
