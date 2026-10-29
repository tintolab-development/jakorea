import type { ProgramDetail, ProgramSession } from '../model/types.ts'

const PRE_EDUCATION_PATTERN = /^사전\s*교육/

/**
 * 공개 상세 커리큘럼 행 제목.
 * 커리큘럼형 복수 회차에서 title이 진행 차시 값("1"~"N", 끝 「차시」 허용)일 때만 `N차시`로 붙인다.
 * 사전 교육 행·단원명·빈 값·0은 title 원문 그대로 둔다.
 */
export function curriculumSessionTitle(
  program: Pick<ProgramDetail, 'educationStructure' | 'sessionRound'>,
  session: Pick<ProgramSession, 'sessionLabel' | 'title'>
): string {
  const value = (session.title ?? '').trim()
  if (program.educationStructure !== 'curriculum' || program.sessionRound !== 'multi') {
    return value
  }
  if (
    PRE_EDUCATION_PATTERN.test((session.sessionLabel ?? '').trim()) ||
    PRE_EDUCATION_PATTERN.test(value)
  ) {
    return value
  }

  const sessionNumber = value.replace(/차시\s*$/, '').trim()
  if (/^\d+$/.test(sessionNumber) && Number(sessionNumber) > 0) {
    return `${sessionNumber}차시`
  }
  return value
}
