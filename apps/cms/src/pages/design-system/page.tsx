/**
 * CMS Design System — 독립 쇼케이스 (/design-system)
 * Layout·LNB 밖 전용 페이지. ADMIN만 접근.
 */

import { ButtonsSection } from './ui/buttons-section'
import { CalendarSection } from './ui/calendar-section'
import { DetailFormsSection } from './ui/detail-forms-section'
import { FiltersTablesSection } from './ui/filters-tables-section'
import { FormsExtrasSection } from './ui/forms-extras-section'
import { FormsSection } from './ui/forms-section'
import { FoundationsSection } from './ui/foundations-section'
import { ModalsExtendedSection } from './ui/modals-extended-section'
import { ModalsSection } from './ui/modals-section'
import { StatusExtendedSection } from './ui/status-extended-section'
import { StatusSection } from './ui/status-section'
import { DesignSystemToc } from './ui/toc'
import './page.css'

export function DesignSystemPage() {
  return (
    <div className="ds-page-shell">
      <div className="ds-page">
        <DesignSystemToc />
        <div className="ds-page__main">
          <header className="ds-page__hero">
            <p className="ds-page__eyebrow">CMS Design System</p>
            <h1 className="ds-page__title">Component Showcase</h1>
            <p className="ds-page__lead">
              CMS 페이지에서 실제로 쓰는 <code>shared/ui</code> · <code>shared/components</code>{' '}
              컴포넌트와 토큰을 한곳에서 확인합니다. Storybook이 아닌 앱 내 라이브 쇼케이스입니다.
            </p>
          </header>

          <FoundationsSection />
          <ButtonsSection />
          <FormsSection />
          <DetailFormsSection />
          <FormsExtrasSection />
          <FiltersTablesSection />
          <ModalsSection />
          <ModalsExtendedSection />
          <CalendarSection />
          <StatusSection />
          <StatusExtendedSection />
        </div>
      </div>
    </div>
  )
}

export default DesignSystemPage
