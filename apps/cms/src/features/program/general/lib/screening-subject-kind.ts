/** 일반 프로그램 신청 심사 UI — 봉사자 / 개인 참여자 구분 */
export type ScreeningSubjectKind = 'volunteer' | 'participant'

export function screeningApplicantNameLabel(kind: ScreeningSubjectKind): string {
  return kind === 'participant' ? '신청자명' : '신청 봉사자명'
}

export function screeningApplicantNamePlaceholder(kind: ScreeningSubjectKind): string {
  return kind === 'participant' ? '신청자명을 입력하세요' : '봉사자명을 입력하세요'
}

export function screeningDocPassedListTitle(kind: ScreeningSubjectKind): string {
  return kind === 'participant' ? '참여자 1차 서류 합격자 목록' : '봉사자 1차 서류 합격자 목록'
}

export function screeningInterview2ListTitle(kind: ScreeningSubjectKind): string {
  return kind === 'participant' ? '참여자 2차 면접 대상자 목록' : '봉사자 2차 면접 대상자 목록'
}

export function screeningWithdrawConfirmContent(
  kind: ScreeningSubjectKind,
  name: string
): string {
  return kind === 'participant'
    ? `${name} 참여자를 활동 포기 처리하시겠습니까?`
    : `${name} 봉사자를 활동 포기 처리하시겠습니까?`
}

export function screeningWithdrawCompleteContent(
  kind: ScreeningSubjectKind,
  name: string
): string {
  return kind === 'participant'
    ? `${name} 참여자가 활동 포기 처리되었습니다.`
    : `${name} 봉사자가 활동 포기 처리되었습니다.`
}

export function screeningDocPassedDetailTitle(kind: ScreeningSubjectKind, name: string): string {
  return kind === 'participant'
    ? `참여자 1차 서류 합격자 상세 (${name})`
    : `봉사자 1차 서류 합격자 상세 (${name})`
}

export function screeningInterview2DetailTitle(kind: ScreeningSubjectKind, name: string): string {
  return kind === 'participant'
    ? `참여자 2차 면접 대상자 상세 (${name})`
    : `봉사자 2차 면접 대상자 상세 (${name})`
}

export function screeningDoc1DetailTitle(kind: ScreeningSubjectKind, name: string): string {
  return kind === 'participant'
    ? `참여자 1차 서류 심사 대상자 상세 (${name})`
    : `봉사자 1차 서류 심사 대상자 상세 (${name})`
}

/** 참여자 면접 심사 탭별 상세 모달 제목 (activeTab 기준) */
export function resolveGeneralParticipantApplicantDetailTitle(
  activeTab: string,
  name: string
): string | null {
  if (activeTab === 'part_doc1') return screeningDoc1DetailTitle('participant', name)
  if (activeTab === 'part_doc_passed') return screeningDocPassedDetailTitle('participant', name)
  if (activeTab === 'part_interview2') return screeningInterview2DetailTitle('participant', name)
  return null
}

export function resolveGeneralApplicantDetailModalTitle(
  activeLnb: string,
  activeTab: string,
  meta: { title: string; breadcrumbLabel: string; kind: 'institution' | 'individual' | 'instructor' }
): string {
  if (activeLnb === 'institution_applications' && meta.kind === 'individual') {
    const screeningTitle = resolveGeneralParticipantApplicantDetailTitle(activeTab, meta.breadcrumbLabel)
    if (screeningTitle) return screeningTitle
  }
  return meta.title
}
