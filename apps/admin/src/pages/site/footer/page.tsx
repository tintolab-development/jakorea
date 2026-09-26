/**
 * 푸터 관리 — 단일 흰 카드 안에 3개 섹션
 */

import { FooterOrgInfoSection } from '@/features/footer/ui/org-info-section'
import { FooterRelatedLogosSection } from '@/features/footer/ui/related-logos-section'
import { FooterTopMenuSection } from '@/features/footer/ui/top-menu-section'

import './page.css'

export function FooterPage() {
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
