/**
 * 강사비 배정 단위. FE 표시: PER_HOUR/PER_CLASS=차시당(PER_HOUR는 레거시), PER_SESSION/PER_LECTURE=출강 1회당, FIXED=단위 없이 금액만.
 */
export type MemberLectureFeePreviewInstructorFeeCalculationUnit = typeof MemberLectureFeePreviewInstructorFeeCalculationUnit[keyof typeof MemberLectureFeePreviewInstructorFeeCalculationUnit] | null;


export const MemberLectureFeePreviewInstructorFeeCalculationUnit = {
  PER_HOUR: 'PER_HOUR',
  PER_CLASS: 'PER_CLASS',
  PER_SESSION: 'PER_SESSION',
  PER_LECTURE: 'PER_LECTURE',
  FIXED: 'FIXED',
} as const;
