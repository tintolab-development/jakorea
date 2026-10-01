import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'

/** UJAT 모집 단락 — 내부 DetailInfoForm이 hideHeader일 때 단락 title만 DetailInfoForm 헤더 스타일로 노출 */
export function UjatRecruitSectionDescriptionHeader({
  title,
  highlightParagraphId,
}: {
  title?: string
  highlightParagraphId?: string
}) {
  if (!title?.trim()) return null
  return (
    <FormParagraphSectionHeader
      title={title.trim()}
      surface="responseEntry"
      titleAligned
      highlightParagraphId={highlightParagraphId}
    />
  )
}
