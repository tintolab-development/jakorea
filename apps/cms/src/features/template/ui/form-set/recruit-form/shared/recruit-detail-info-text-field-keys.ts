/** 상세 정보 단락 텍스트 필드 라벨 → overlay 키 suffix */
export const RECRUIT_DETAIL_TEXT_FIELD_KEY_BY_LABEL: Record<string, string> = {
  '프로그램 설명': 'programDescription',
  '모집 안내': 'recruitmentGuide',
  '지원 방법': 'applicationMethod',
  '학습 지원 내용': 'learningSupportContent',
  기타사항: 'otherNotes',
}

export function resolveRecruitDetailTextFieldOverlayKey(
  overlayKeyPrefix: string,
  label: string
): string {
  const suffix = RECRUIT_DETAIL_TEXT_FIELD_KEY_BY_LABEL[label] ?? label
  return `${overlayKeyPrefix}.${suffix}`
}
