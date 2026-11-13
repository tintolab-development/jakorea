import { useLocation } from 'react-router-dom'
import { isFormTemplateSeedPreviewActive } from '@/features/template/lib/form-template-seed-preview'
import './seed-preview-banner.css'

/** 로컬 개발 `/templates?seed=1` 상태 표시. 꺼져 있거나 운영·QA 빌드면 아무것도 그리지 않는다. */
export function TemplateSeedPreviewBanner() {
  // 주소가 바뀔 때마다 다시 판정한다(`?seed=0`으로 끄기 포함).
  const location = useLocation()
  void location.search
  if (!isFormTemplateSeedPreviewActive()) return null
  return (
    <div className="template-seed-preview-banner" role="status">
      시드 보기 중 · 서버 저장본이 아닌 프론트 시드입니다 · 저장 안 됨 (?seed=0으로 끄기)
    </div>
  )
}
