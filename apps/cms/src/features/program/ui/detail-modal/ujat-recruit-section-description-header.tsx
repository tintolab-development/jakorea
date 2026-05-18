/** UJAT 모집 단락 — 내부 DetailInfoForm이 hideHeader일 때 단락 title·description을 DetailInfoForm 헤더 스타일로 노출 */
export function UjatRecruitSectionDescriptionHeader({
  title,
  description,
}: {
  title?: string
  description?: string | null
}) {
  const visibleDescription =
    description?.trim() && description.trim().length > 0 ? description.trim() : null
  if (!title && !visibleDescription) return null
  return (
    <header className="detail-info-form__header ujat-recruit-section-description-header">
      <div className="detail-info-form__header-lead">
        {title ? <h2 className="detail-info-form__title">{title}</h2> : null}
        {visibleDescription ? (
          <div className="detail-info-form__description">{visibleDescription}</div>
        ) : null}
      </div>
    </header>
  )
}
