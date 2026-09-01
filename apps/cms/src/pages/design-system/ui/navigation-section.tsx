import { useState } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { AppBreadcrumb } from '@/shared/ui/app-breadcrumb'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { PageHeader } from '@/shared/ui/page-header'
import { SegmentedTab } from '@/shared/ui/segmented-tab'
import { ViewModeToggle } from '@/shared/components/view-mode'
import { CmsButton } from '@/shared/ui/cms-button'
import { DsDemo, DsSection } from './section'

export function NavigationSection() {
  const [textTab, setTextTab] = useState<'info' | 'apps' | 'history'>('info')
  const [segment, setSegment] = useState('month')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  return (
    <DsSection
      id="navigation"
      title="Navigation"
      description="페이지 헤더·브레드크럼·탭·보기 모드 전환 등 화면 chrome 패턴입니다."
    >
      <DsDemo label="PageHeader">
        <PageHeader
          title="디자인 시스템"
          description="CMS 공통 UI 쇼케이스"
          actions={
            <CmsButton variant="primary" size="medium">
              액션
            </CmsButton>
          }
        />
      </DsDemo>

      <DsDemo label="AppBreadcrumb">
        <AppBreadcrumb
          items={[
            { label: '관리', path: '/' },
            { label: '디자인 시스템', path: '/design-system' },
            { label: 'Navigation' },
          ]}
        />
      </DsDemo>

      <DsDemo label="CmsTextTabs / SegmentedTab sizes">
        <div className="ds-demo__stack" style={{ maxWidth: '100%' }}>
          <CmsTextTabs
            activeKey={textTab}
            onChange={setTextTab}
            items={[
              { key: 'info', label: '기본 정보' },
              { key: 'apps', label: '신청 현황' },
              { key: 'history', label: '이력' },
            ]}
          />
          <div className="ds-demo__row">
            <SegmentedTab
              size="small"
              value={segment}
              onChange={setSegment}
              options={[
                { label: '월간', value: 'month' },
                { label: '주간', value: 'week' },
              ]}
            />
            <SegmentedTab
              size="medium"
              value={segment}
              onChange={setSegment}
              options={[
                { label: '월간', value: 'month' },
                { label: '주간', value: 'week' },
              ]}
            />
            <SegmentedTab
              size="mediumCompact"
              value={segment}
              onChange={setSegment}
              options={[
                { label: '예정', value: 'month' },
                { label: '완료', value: 'week' },
              ]}
            />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="ViewModeToggle">
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'list', label: '목록 보기', icon: <UnorderedListOutlined /> },
            { value: 'calendar', label: '캘린더 보기', icon: <CalendarOutlined /> },
          ]}
        />
        <p className="ds-demo__label" style={{ marginTop: 8 }}>
          현재 모드: {viewMode}
        </p>
      </DsDemo>
    </DsSection>
  )
}
