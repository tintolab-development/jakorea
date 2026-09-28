function progressGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

function formatScheduleIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export interface ValidateTrainedTeachersCommonInfoDraftInput {
  educationStructure: string
  sessionRound: string
  scheduleDetails: Array<{ name?: string }>
  progressGroupsByDetail: string[][]
  educationScheduleLines?: (string | undefined | null)[]
}

/** RHF 밖 draft 필드 — 저장 전 한글 검증 메시지 */
export function validateTrainedTeachersCommonInfoDraft(
  input: ValidateTrainedTeachersCommonInfoDraftInput | null | undefined
): string | undefined {
  if (!input) return undefined

  const hideEducationSchedule =
    input.educationStructure === 'schedule' && input.sessionRound === 'multi'

  if (!hideEducationSchedule) {
    const lines = (input.educationScheduleLines ?? []).map(line => line?.trim() ?? '')
    if (!lines.some(Boolean)) {
      return '교육 진행 예정일을 입력해 주세요.'
    }
  }

  if (input.educationStructure === 'schedule') {
    for (let i = 0; i < input.scheduleDetails.length; i += 1) {
      const detail = input.scheduleDetails[i]
      const scheduleLabel =
        input.sessionRound === 'multi' ? '행사 일정' : '세부 일정'
      if (!detail.name?.trim()) {
        return `${scheduleLabel} ${formatScheduleIndex(i)}의 일정명을 입력해 주세요.`
      }

      if (input.sessionRound === 'single') {
        const groups = input.progressGroupsByDetail[i] ?? ['']
        for (let g = 0; g < groups.length; g += 1) {
          if (!groups[g]?.trim()) {
            if (groups.length > 1) {
              return `${scheduleLabel} ${formatScheduleIndex(i)}의 진행 시간(그룹 ${progressGroupLetter(g)})을 입력해 주세요.`
            }
            return `${scheduleLabel} ${formatScheduleIndex(i)}의 진행 시간을 입력해 주세요.`
          }
        }
      }
    }
  }

  return undefined
}
