/**
 * 푸터 관리 — 상단 메뉴 / 기관 정보 / 유관기관 로고 카드 3개
 */

import { FooterOrgInfoSection } from '@/features/footer/ui/org-info-section'
import { FooterRelatedLogosSection } from '@/features/footer/ui/related-logos-section'
import { FooterTopMenuSection } from '@/features/footer/ui/top-menu-section'

import './page.css'

export function FooterPage() {
  return (
    <div className="site-footer-page">
      <FooterTopMenuSection />
      <FooterOrgInfoSection />
      <FooterRelatedLogosSection />
    </div>
  )
}
