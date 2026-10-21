/**
 * 강사비 등급 — BE 코드·화면 라벨 단일 정의
 *
 * | 내부 의미 | BE 코드  | 화면 표기   |
 * |-----------|----------|-------------|
 * | 1등급     | GRADE_1  | 1급 강사비  |
 * | 2등급     | GRADE_2  | 2급 강사비  |
 * | 3등급     | GRADE_3  | 3급 강사비  |
 *
 * 회원 프로필 `defaultFeeGrade`는 레벨 숫자(`1`·`2`·`3`)로도 오므로 표시 변환 시 함께 허용한다.
 * 특강(`SPECIAL`)은 강사 회원 강사비 등급이 아니다. 프로그램 지급 방식(`SPECIAL_LECTURE`)만 사용한다.
 */

export const INSTRUCTOR_FEE_GRADE_CODES = ['GRADE_1', 'GRADE_2', 'GRADE_3'] as const

export type InstructorFeeGradeCode = (typeof INSTRUCTOR_FEE_GRADE_CODES)[number]

export const INSTRUCTOR_FEE_GRADE_LABELS: Record<InstructorFeeGradeCode, string> = {
  GRADE_1: '1급 강사비',
  GRADE_2: '2급 강사비',
  GRADE_3: '3급 강사비',
}

/** 셀렉트 옵션 — value는 화면 라벨 (BE 전송 시 코드로 변환) */
export const INSTRUCTOR_FEE_GRADE_LABEL_OPTIONS: { value: string; label: string }[] =
  INSTRUCTOR_FEE_GRADE_CODES.map(code => ({
    value: INSTRUCTOR_FEE_GRADE_LABELS[code],
    label: INSTRUCTOR_FEE_GRADE_LABELS[code],
  }))

/** `GRADE_1` · `1` · `1급` · `1급 강사비` → `GRADE_1` */
export function toInstructorFeeGradeCode(
  raw: string | null | undefined
): InstructorFeeGradeCode | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  const match =
    /^GRADE_([123])$/i.exec(trimmed) ?? /^([123])(?:급)?(?:\s*강사비)?$/u.exec(trimmed)
  return match ? (`GRADE_${match[1]}` as InstructorFeeGradeCode) : undefined
}

/** 알려진 등급이면 `N급 강사비`, 아니면 원문(trim) 그대로 */
export function formatInstructorFeeGradeLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  const code = toInstructorFeeGradeCode(trimmed)
  return code ? INSTRUCTOR_FEE_GRADE_LABELS[code] : trimmed
}
