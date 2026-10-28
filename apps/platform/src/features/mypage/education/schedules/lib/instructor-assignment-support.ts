const INSTITUTION_ASSIGNMENT_PROGRAM_TYPES = new Set([
  'GENERAL_ORGANIZATION',
  'GEMINI_TRAINING',
  'GEMINI',
  'VISITING_TRAINING',
])

/**
 * 현재 응답 계약으로 기관 배정 현황을 조회할 수 있는 프로그램 유형 후보.
 * GENERAL_INDIVIDUAL은 기관 신청 관계가 없으므로 `supportsInstructorIndividualAssignment`로 따로 판단한다.
 * COMPANY_SCHOOL은 선택적 지원이므로 신규 overview API의 지원 여부 응답 전까지
 * 이 조회로 기관 배정 현황을 노출하지 않는다.
 */
export function supportsInstructorInstitutionAssignment(
  programType: string | null | undefined,
): boolean {
  return INSTITUTION_ASSIGNMENT_PROGRAM_TYPES.has(programType?.trim().toUpperCase() ?? '')
}

/**
 * 일반 개인형 강의현황 — 기관 신청 관계 없이 본인 배정 일정만 배정 현황 탭으로 노출한다.
 * 기존 강의 일정 탭은 유지한다.
 */
export function supportsInstructorIndividualAssignment(
  programType: string | null | undefined,
): boolean {
  return programType?.trim().toUpperCase() === 'GENERAL_INDIVIDUAL'
}

/** API가 숫자·문자 혼용으로 내려도 화면이 깨지지 않게 표시 문자열만 만든다. */
export function asAssignmentDisplayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function displayAssignmentValueOrDash(value: unknown): string {
  return asAssignmentDisplayText(value) || '-'
}

/**
 * 서버 역할 값 → 표시 라벨 (기획: 대표 강사·일반 강사, CMS `INSTRUCTOR_ROLE_LABELS`와 동일).
 * BE `GeminiPortalAssignmentSupport.instructorRole`: is_schedule_lead true → LEAD, false → ASSISTANT, 미설정 → null.
 */
export function formatInstructorRole(raw: unknown): string {
  const display = asAssignmentDisplayText(raw)
  const value = display.toUpperCase()
  if (!value) return '-'
  if (
    value === 'LEAD' ||
    value === 'MAIN' ||
    value === 'REPRESENTATIVE' ||
    value === '대표 강사' ||
    value.includes('LEAD')
  ) {
    return '대표 강사'
  }
  if (value === 'ASSISTANT' || value === '보조 강사' || value === 'GENERAL' || value === 'MEMBER' || value === '일반 강사' || value.includes('GENERAL')) {
    return '일반 강사'
  }
  return display || '-'
}

/** 자택과의 거리. 서버 값(km, 소수 둘째 자리)을 재계산하지 않고 단위만 붙인다. */
export function formatAssignmentDistanceKm(value: unknown): string {
  const text = asAssignmentDisplayText(value)
  return text ? `${text} km` : '-'
}

/**
 * 배정된 기관 목록 행 묶음.
 * 응답에 기관 id가 없어 (기관명 + 역할 + 담당학년)으로 묶는다. 같은 기관이어도 역할·학년이 다르면 다른 행.
 * 기관명이 없으면(개인형) 배정마다 한 행으로 둔다.
 * 서버 정렬 순서를 그대로 유지한다(행 순서는 묶음이 처음 나온 순서, 행 안의 줄은 응답 순서).
 */
export function groupAssignmentsByInstitution<
  T extends {
    assignmentId: number
    institutionName: string | null
    instructorRole?: unknown
    grade?: unknown
  },
>(items: readonly T[]): Array<{ key: string; items: T[] }> {
  const groups = new Map<string, T[]>()
  items.forEach(item => {
    const name = asAssignmentDisplayText(item.institutionName)
    const key = name
      ? `institution:${JSON.stringify([
          name,
          formatInstructorRole(item.instructorRole),
          asAssignmentDisplayText(item.grade),
        ])}`
      : `assignment:${item.assignmentId}`
    const current = groups.get(key)
    if (current) current.push(item)
    else groups.set(key, [item])
  })
  return Array.from(groups, ([key, groupItems]) => ({ key, items: groupItems }))
}

/**
 * 교육 일정 줄의 차시 자리 표시.
 * 일정형 + 복수 회차는 차시/회차 대신 일정명, 그 외는 `N차시`. 값이 없으면 '-'.
 */
export function formatAssignmentSessionLabel(
  item: { sessionNo: number | null; scheduleName: string | null },
  useScheduleName: boolean,
): string {
  if (useScheduleName) return asAssignmentDisplayText(item.scheduleName) || '-'
  return item.sessionNo != null ? `${item.sessionNo}차시` : '-'
}
