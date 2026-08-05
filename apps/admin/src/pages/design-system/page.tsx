/**
 * Admin Design System — 독립 쇼케이스 (/design-system)
 * Layout·LNB 밖 전용 페이지. 이식된 shared/ui 컴포넌트만 수록.
 */

import { useEffect } from 'react'
import { ButtonsSection } from './ui/buttons-section'
import { DetailFormsSection } from './ui/detail-forms-section'
import { FoundationsSection } from './ui/foundations-section'
import { FormsSection } from './ui/forms-section'
import { ListLayoutSection } from './ui/list-layout-section'
import { ModalsSection } from './ui/modals-section'
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
            <p className="ds-page__eyebrow">Admin Design System</p>
            <h1 className="ds-page__title">Component Showcase</h1>
            <p className="ds-page__lead">
              홈페이지 어드민(<code>apps/admin</code>)에 이식된 CMS 디자인 시스템 컴포넌트
              카탈로그입니다. SSOT는 <code>theme-provider</code> + <code>shared/ui</code>이며, CMS
              전체 카탈로그와 1:1은 아닙니다.
            </p>
          </header>

          <FoundationsSection />
          <ButtonsSection />
          <FormsSection />
          <DetailFormsSection />
          <ListLayoutSection />
          <ModalsSection />
        </div>
      </div>
    </div>
  )
}

export default DesignSystemPage
