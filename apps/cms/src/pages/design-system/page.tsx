/**
 * CMS Design System — 독립 쇼케이스 (/design-system)
 * Layout·LNB 밖 전용 페이지. 비로그인 포함 공개 접근.
 */

import { useEffect } from 'react'
import { ButtonsSection } from './ui/buttons-section'
import { CalendarSection } from './ui/calendar-section'
import { DashboardSection } from './ui/dashboard-section'
import { DetailFormsSection } from './ui/detail-forms-section'
import { DoDontSection } from './ui/do-dont-section'
import { FeedbackSection } from './ui/feedback-section'
import { FiltersTablesSection } from './ui/filters-tables-section'
import { FormsExtrasSection } from './ui/forms-extras-section'
import { FormsSection } from './ui/forms-section'
import { PostsAttachmentsSection } from './ui/posts-attachments-section'
import { FoundationsSection } from './ui/foundations-section'
import { ImpactAuditSection } from './ui/impact-audit-section'
import { EditorSection } from './ui/editor-section'
import { ModalCatalogSection } from './ui/modal-catalog-section'
import { ModalProcessSection } from './ui/modal-process-section'
import { ModalsExtendedSection } from './ui/modals-extended-section'
import { ModalsSection } from './ui/modals-section'
import { NavigationSection } from './ui/navigation-section'
import { StatusExtendedSection } from './ui/status-extended-section'
import { StatusSection } from './ui/status-section'
import { DesignSystemToc } from './ui/toc'
import './page.css'

export function DesignSystemPage() {
  useEffect(() => {
    document.body.classList.add('ds-page-active')
    return () => {
      document.body.classList.remove('ds-page-active')
    }
  }, [])

  return (
    <div className="ds-page-shell">
      <div className="ds-page">
        <DesignSystemToc />
        <div className="ds-page__main">
          <header className="ds-page__hero">
            <p className="ds-page__eyebrow">CMS Design System</p>
            <h1 className="ds-page__title">Component Showcase</h1>
            <p className="ds-page__lead">
              CMS 전용 라이브 카탈로그입니다. 제품 룩 SSOT는{' '}
              <code>theme-provider</code> + <code>shared/ui</code> ·{' '}
              <code>shared/components</code>이며, 이 페이지는 동일 Current를 검증합니다. Storybook이
              아니며 Platform·<code>packages/ui</code>와는 분리됩니다.
            </p>
            <div className="ds-coverage-legend" aria-label="컴포넌트 분류 범례">
              <span className="ds-coverage-legend__item ds-coverage-legend__item--current">
                Current
              </span>
              <span>신규 화면 사용 가능</span>
              <span className="ds-coverage-legend__item ds-coverage-legend__item--deferred">
                Not catalogued
              </span>
              <span>고아 · 내부 구현 · 도메인 화면 전체</span>
            </div>
          </header>

          <FoundationsSection />
          <ImpactAuditSection />
          <ButtonsSection />
          <FormsSection />
          <PostsAttachmentsSection />
          <DetailFormsSection />
          <FormsExtrasSection />
          <EditorSection />
          <FiltersTablesSection />
          <DashboardSection />
          <ModalsSection />
          <ModalCatalogSection />
          <ModalProcessSection />
          <ModalsExtendedSection />
          <CalendarSection />
          <StatusSection />
          <StatusExtendedSection />
          <NavigationSection />
          <FeedbackSection />
          <DoDontSection />
        </div>
      </div>
    </div>
  )
}

export default DesignSystemPage
