/**
 * 푸터 관리 — 단일 흰 카드 안에 3개 섹션
 */

import { footerQueryKeys } from '@/features/footer/api/query-keys'
import { FOOTER_CHANGED_EVENT } from '@/features/footer/api/store'
import { FooterOrgInfoSection } from '@/features/footer/ui/org-info-section'
import { FooterRelatedLogosSection } from '@/features/footer/ui/related-logos-section'
import { FooterTopMenuSection } from '@/features/footer/ui/top-menu-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'

import './page.css'

export function FooterPage() {
  useInvalidateOnWindowEvent(FOOTER_CHANGED_EVENT, footerQueryKeys.all)

  return (
    <div className="site-footer-page">
      <div className="admin-list-card site-footer-card">
        <FooterTopMenuSection />
        <FooterOrgInfoSection />
        <FooterRelatedLogosSection />
      </div>
    </div>
  )
}
