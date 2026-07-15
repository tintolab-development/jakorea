import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileTextOutlined, UserOutlined } from '@ant-design/icons'
import { ProgressStagesWidget } from '@/features/dashboard/ui/progress-stages-widget'
import { StatisticsCard } from '@/features/dashboard/ui/statistics-card'
import { PendingActionCard } from '@/features/dashboard/ui/pending-action-card'
import { DashboardWidgetSkeleton } from '@/features/dashboard/ui/dashboard-widget-skeleton'
import { WidgetTitleWithHandle } from '@/features/dashboard/ui/widget-title-with-handle'
import { ProgramLifecycleStatusText } from '@/shared/components/program-lifecycle-status-text'
import { SegmentedTab } from '@/shared/ui/segmented-tab'
import { LoadingButton } from '@/shared/ui'
import type { ProgramLifecycleStatus } from '@/types/domain'
import '@/features/dashboard/ui/dashboard-widget-table.css'
import '@/features/dashboard/ui/widget-card.css'
import '@/shared/ui/widget-more-button.css'
import { DsDemo, DsSection } from './section'

type DashboardTableRow = {
  id: string
  name: string
  status: ProgramLifecycleStatus
  applicants: string
}

const DASHBOARD_TABLE_ROWS: DashboardTableRow[] = [
  {
    id: '1',
    name: 'HSBC/HKU Business Case Competition',
    status: 'recruiting_students',
    applicants: '0 / 30',
  },
  {
    id: '2',
    name: 'JA Korea 대학생경제교육봉사단',
    status: 'recruiting_volunteers',
    applicants: '30 / 30',
  },
  {
    id: '3',
    name: 'Growth to Professional',
    status: 'education_in_progress',
    applicants: '5 / 80',
  },
]

const DASHBOARD_TABLE_COLUMNS: ColumnsType<DashboardTableRow> = [
  {
    title: '프로그램명',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '모집 신청 현황',
    dataIndex: 'status',
    key: 'status',
    width: 180,
    render: (status: ProgramLifecycleStatus) => <ProgramLifecycleStatusText status={status} />,
  },
  {
    title: '참여자 모집 현황',
    dataIndex: 'applicants',
    key: 'applicants',
    width: 150,
  },
]

function DashboardWidgetTitle({ title, count }: { title: string; count?: number }) {
  return (
    <WidgetTitleWithHandle>
      <span className="widget-card-title">{title}</span>
      {count != null ? (
        <Typography.Text className="dashboard-widget-table__header-total-count">
          총 {count}건
        </Typography.Text>
      ) : null}
    </WidgetTitleWithHandle>
  )
}

export function DashboardSection() {
  return (
    <DsSection
      id="dashboard"
      title="Dashboard layouts"
      description="대시보드 홈의 presentational 패턴(50%/100% 배치·통계 카드·대기 카드·테이블 셸·스켈레톤). 도메인 위젯 본체·DnD는 Not catalogued."
    >
      <p className="ds-note">
        정적 데모만 제공합니다. API·설정 store·역할 ACL이 결합된 위젯은 공용으로 승격하지 않습니다.
        감사 표:{' '}
        <code>apps/cms/docs/design-system/dashboard-widget-catalog-audit.md</code>
      </p>

      <DsDemo label="50% / 100% — StatisticsCard + ProgressStagesWidget">
        <div className="ds-dashboard-grid">
          <div className="ds-dashboard-grid__half">
            <StatisticsCard
              title="전체 프로그램"
              value={25}
              suffix="개"
              tags={[
                { color: 'green', label: '진행 중 12' },
                { color: 'blue', label: '예정 8' },
              ]}
              to="/design-system#dashboard"
            />
          </div>
          <div className="ds-dashboard-grid__half">
            <StatisticsCard
              title="모집 신청"
              value={138}
              suffix="건"
              tags={[
                { color: 'gold', label: '검토 대기 17' },
                { color: 'cyan', label: '오늘 6' },
              ]}
              to="/design-system#dashboard"
            />
          </div>
          <div className="ds-dashboard-grid__half">
            <StatisticsCard
              title="등록된 강사"
              value={42}
              prefix={<UserOutlined />}
              suffix="명"
              to="/design-system#dashboard"
            />
          </div>
          <Card
            className="widget-card ds-dashboard-grid__full"
            bordered={false}
            title={<DashboardWidgetTitle title="프로그램 진행 현황" />}
          >
            <ProgressStagesWidget
              firstCardVariant="teal"
              showDividerAfterFirstCard
              showBottomDivider={false}
              stages={[
                { key: 'all', label: '전체 프로그램', count: 25 },
                { key: 'planned', label: '진행 예정', count: 8, showArrowAfter: true },
                { key: 'recruiting', label: '모집 중', count: 5, showArrowAfter: true },
                { key: 'progress', label: '진행 중', count: 9, showArrowAfter: true },
                { key: 'completed', label: '완료', count: 3 },
              ]}
            />
          </Card>
        </div>
      </DsDemo>

      <DsDemo label="PendingActionCard (대기 신청·매칭·정산 공통)">
        <div className="ds-dashboard-grid">
          <div className="ds-dashboard-grid__half">
            <PendingActionCard
              title="대기 중인 신청"
              value={12}
              prefix={<FileTextOutlined />}
              suffix="건"
              to="/design-system#dashboard"
            />
          </div>
          <div className="ds-dashboard-grid__half">
            <PendingActionCard
              title="대기 없음 예시"
              value={0}
              suffix="건"
              to="/design-system#dashboard"
            />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="테이블형 위젯 셸 (widget-card + 더보기 + cms-data-table--widget)" className="ds-demo--table">
        <Card
          className="widget-card dashboard-widget-table dashboard-widget-table--recruitment"
          bordered={false}
          title={<DashboardWidgetTitle title="모집 신청 현황" count={DASHBOARD_TABLE_ROWS.length} />}
          extra={
            <LoadingButton type="link" className="widget-more-button">
              더보기
            </LoadingButton>
          }
        >
          <Table<DashboardTableRow>
            className="cms-data-table cms-data-table--widget dashboard-widget-table__data"
            rowKey="id"
            columns={DASHBOARD_TABLE_COLUMNS}
            dataSource={DASHBOARD_TABLE_ROWS}
            pagination={false}
            size="middle"
          />
        </Card>
      </DsDemo>

      <DsDemo label="DashboardWidgetSkeleton + SegmentedTab (일정 툴바 교차)">
        <div className="ds-dashboard-grid">
          <div className="ds-dashboard-grid__half">
            <DashboardWidgetSkeleton loading height={120} />
          </div>
          <div className="ds-dashboard-grid__half ds-dashboard-segmented">
            <p className="ds-demo__label" style={{ marginBottom: 8 }}>
              월간/주간은 Navigation의 SegmentedTab — 일정 위젯 본체는 Not catalogued
            </p>
            <SegmentedTab
              size="medium"
              value="month"
              onChange={() => undefined}
              options={[
                { label: '월간', value: 'month' },
                { label: '주간', value: 'week' },
              ]}
            />
          </div>
        </div>
      </DsDemo>

      <p className="ds-note">
        <strong>Not catalogued</strong> — 위젯 본체·홈 크롬:{' '}
        <code>ProgramScheduleWidget</code>, <code>MenuShortcutWidget</code>,{' '}
        <code>KpiAchievementWidget</code>, <code>RecruitmentStatusWidget</code>,{' '}
        <code>CustomerInquiryStatusWidget</code>, <code>LogAlertsWidget</code>,{' '}
        <code>NotificationWidget</code>, <code>OverallStatisticsCards</code>(데이터 바인딩), my-* /
        feed / pending lists, <code>SortableWidgetSlot</code>, <code>DashboardSettingsModal</code>,{' '}
        <code>DashboardToolbar</code>. 패턴·카드만 위 데모에서 고정하고 본체는 <code>/</code>에서
        확인합니다.
      </p>
    </DsSection>
  )
}
