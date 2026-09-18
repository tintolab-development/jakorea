/**
 * TODO(temp-mock): 열여라 참깨 — 로컬 mock 액션 (검증 후 삭제)
 */

export function downloadTempMockTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildTempMockLectureReportFileContent(input: {
  programTitle?: string
  instructorName?: string
  schoolName?: string
  scheduleLabel?: string
}): string {
  return [
    '[Mock] 강의보고서',
    `프로그램: ${input.programTitle ?? '열여라 참깨'}`,
    `강사: ${input.instructorName ?? '-'}`,
    `기관: ${input.schoolName ?? '-'}`,
    `일정: ${input.scheduleLabel ?? '-'}`,
    '',
    '본 파일은 temp mock 프로그램 검증용 placeholder입니다.',
  ].join('\n')
}

export function buildTempMockSurveyShareUrl(programId: string, surveyId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mock.jakorea.local'
  return `${origin}/mock/programs/${programId}/surveys/${surveyId}`
}
