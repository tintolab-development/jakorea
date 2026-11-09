/**
 * 원격 등록 설문의 `id`는 바인딩된 게시 version id다(`mapFormBindingToRegisteredSurvey`).
 * 결과 화면에 이 값을 넘기면 문항 구성을 version 단건 조회로 만든다.
 * 넘기지 않으면 템플릿 목록(FORM_TEMPLATE_READ)을 거쳐 Program Viewer(프로그램 상세)는 403이 난다.
 */
export function toSurveyTemplateVersionId(
  survey: { id: string } | null | undefined,
  remote: boolean
): number | undefined {
  if (!remote || survey == null) return undefined
  const value = Number(survey.id)
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined
}
