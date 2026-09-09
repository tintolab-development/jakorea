/**
 * 강의비 산출 정보 단락 — 발급 양식 미리보기용 목 데이터.
 * 지급조서(발급용): 교육 진행 차시·총 학생 수·총 강의비는 기본값 없음.
 */

import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'

export const LECTURE_FEE_CALCULATION_SAMPLE_VALUES: LectureFeeCalculationAutofillValues = {
  lectureFeeType: '3급 강사비',
  feeBasisLeft: '1시간 당',
  feeBasisRight: '기본 : 240,000원',
  businessIncomeLeft: '해당 없음',
  businessIncomeRight: '기타 소득 8.8% 적용',
  sessionCount: '',
  sessionHours: '',
  transportFee: true,
  lodgingFee: true,
  totalStudents: '',
  totalLectureFee: '',
}

/** 정산 신청서 「강의비 산출 내역」— 교육 진행 차시·총 강의비는 기본값 없음 */
export const SETTLEMENT_APPLICATION_LECTURE_FEE_CALCULATION_SAMPLE_VALUES: LectureFeeCalculationAutofillValues =
  {
    ...LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
    sessionCount: '',
    sessionHours: '',
    totalLectureFee: '',
  }
