/** UJAT 모집 단락 — 내부 DetailInfoForm이 hideHeader일 때 단락 title만 DetailInfoForm 헤더 스타일로 노출 */
export function UjatRecruitSectionDescriptionHeader({ title }: { title?: string }) {
  if (!title?.trim()) return null
  return (
    <header className="detail-info-form__header ujat-recruit-section-description-header">
      <div className="detail-info-form__header-lead">
        <h2 className="detail-info-form__title">{title.trim()}</h2>
      </div>
    </header>
  )
}
