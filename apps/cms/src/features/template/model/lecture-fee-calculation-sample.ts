/**
 * 강의비 산출 정보 단락 — 발급 양식 미리보기용 목 데이터
 */

import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'

export const LECTURE_FEE_CALCULATION_SAMPLE_VALUES: LectureFeeCalculationAutofillValues = {
  lectureFeeType: '3급 강사비',
  feeBasisLeft: '1시간 당',
  feeBasisRight: '기본 : 240,000원',
  businessIncomeLeft: '해당 없음',
  businessIncomeRight: '기타 소득 8.8% 적용',
  sessionCount: '12',
  sessionHours: '40',
  transportFee: true,
  lodgingFee: true,
  totalStudents: '120',
  totalLectureFee: '2,880,000',
}
