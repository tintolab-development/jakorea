import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { BasicInfoLayout, type BasicInfoLayoutResolved } from './user-basic-info-layout-resolver'
import { renderResolvedBasicInfoSections } from './user-basic-info-section-renderer'
import type {
  BasicInfoSectionRenderContext,
  BasicInfoSectionRenderers,
} from './user-basic-info-section-renderer'

/**
 * 기본 정보 레이아웃 렌더러
 * - SINGLE_CARD: 단일 DetailInfoForm
 * - SPLIT_CARD: 상·하 2개 DetailInfoForm
 *
 * 주의: 비즈니스 분기/섹션 선택 로직 없음. 전달된 섹션 노드만 배치한다.
 */
export function BasicInfoLayoutRenderer({
  resolution,
  caption,
  mode,
  shared,
  renderers,
}: {
  resolution: BasicInfoLayoutResolved
  caption?: ReactNode
  mode: 'view' | 'edit'
  shared: BasicInfoSectionRenderContext
  renderers: BasicInfoSectionRenderers
}) {
  const rendered = renderResolvedBasicInfoSections({
    resolution,
    shared,
    renderers,
  })

  if (resolution.layout === BasicInfoLayout.SPLIT_CARD) {
    return (
      <div className="user-basic-info-section__split-cards">
        <DetailInfoForm title="기본 정보" description={caption} mode={mode}>
          {rendered.meta ?? null}
        </DetailInfoForm>
        <DetailInfoForm
          title="기본 정보 — 성명·연락처 등"
          hideHeader
          className="user-basic-info-section user-basic-info-section--school-teacher-profile-card"
          mode={mode}
        >
          {rendered.profile ?? null}
        </DetailInfoForm>
      </div>
    )
  }

  return (
    <DetailInfoForm title="기본 정보" description={caption} className="user-basic-info-section" mode={mode}>
      {rendered.single ?? null}
    </DetailInfoForm>
  )
}
