type SessionFieldRow = {
  educationFormLabel?: string
  ipsTypeSummary?: string
  participationMethodLabel?: string
}

/**
 * 교육받은 교사 공통정보 저장 — 차시·일정 행의 교육형태·IPS·참여방식을
 * programs PATCH `generalCommonInfo`에 남긴다.
 * 일정 공통이면 폼의 공통 라벨을 행에 덮고, 일정별 상이면 행에 있는 값을 유지한다.
 */
export function stampTrainedTeachersSessionFields<T extends SessionFieldRow>(
  rows: T[] | undefined,
  fields: {
    educationFormScheduleDetail?: 'common' | 'perSchedule'
    ipsScheduleDetail?: 'common' | 'perSchedule'
    educationFormLabel?: string
    ipsTypeSummary?: string
  }
): T[] | undefined {
  if (!rows) return rows
  const stampEducation =
    fields.educationFormScheduleDetail !== 'perSchedule' && Boolean(fields.educationFormLabel)
  const stampIps = fields.ipsScheduleDetail !== 'perSchedule' && Boolean(fields.ipsTypeSummary)
  if (!stampEducation && !stampIps) return rows
  return rows.map(row => ({
    ...row,
    ...(stampEducation ? { educationFormLabel: fields.educationFormLabel } : {}),
    ...(stampIps ? { ipsTypeSummary: fields.ipsTypeSummary } : {}),
  }))
}
