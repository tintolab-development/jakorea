/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { Card, Row, Statistic, Button } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import {
  useDashboardWidgetOrderStore,
  buildDefaultDisplayItemIds,
  buildDisplayItemsMeta,
  type DisplayItemMeta,
  type DashboardWidgetOrderState,
} from '@/features/dashboard/model/dashboard-widget-order-store'
import { SortableWidgetSlot } from '@/features/dashboard/ui/sortable-widget-slot'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import { getRoleLabel } from '@/shared/ui'
import { useDashboardData } from '@/features/dashboard/model/use-dashboard-data'
import { mockInstructors } from '@/data/mock'
import { PendingActionsAlert } from '@/features/dashboard/ui/pending-actions-alert'
import { OverallStatisticsCards } from '@/features/dashboard/ui/overall-statistics-cards'
import { MonthlySettlementCard } from '@/features/dashboard/ui/monthly-settlement-card'
import { MonthlyApplicationCard } from '@/features/dashboard/ui/monthly-application-card'
import { ActiveProgramCard } from '@/features/dashboard/ui/active-program-card'
import { UnifiedActivityFeed } from '@/features/dashboard/ui/unified-activity-feed'
import { MyActivitySummary } from '@/features/dashboard/ui/my-activity-summary'
import { MyVolunteerActivitySummary } from '@/features/dashboard/ui/my-volunteer-activity-summary'
import { MyApplicationSummary } from '@/features/dashboard/ui/my-application-summary'
import { UpcomingSchedulesList } from '@/features/dashboard/ui/upcoming-schedules-list'
import { PendingTasksList } from '@/features/dashboard/ui/pending-tasks-list'
import { VolunteerPendingTasksList } from '@/features/dashboard/ui/volunteer-pending-tasks-list'
import { OverallProgramProgressCard } from '@/features/dashboard/ui/overall-program-progress-card'
// import { ProgramProgressWidget } from '@/features/dashboard/ui/program-progress-widget' // 임시 주석
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
import { PendingApplicationsCard } from '@/features/dashboard/ui/pending-applications-card'
import { PendingMatchingsCard } from '@/features/dashboard/ui/pending-matchings-card'
import { PendingSettlementsCard } from '@/features/dashboard/ui/pending-settlements-card'
import { PendingActionsRow } from '@/features/dashboard/ui/pending-actions-row'
import { NotificationWidget } from '@/features/dashboard/ui/notification-widget'
import { CustomerInquiryStatusWidget } from '@/features/dashboard/ui/customer-inquiry-status-widget'
import { ProgramScheduleWidget } from '@/features/dashboard/ui/program-schedule-widget'
import { MenuShortcutWidget } from '@/features/dashboard/ui/menu-shortcut-widget'
import { RecruitmentStatusWidget } from '@/features/dashboard/ui/recruitment-status-widget'
import { KpiAchievementWidget } from '@/features/dashboard/ui/kpi-achievement-widget'
import { DashboardSettingsModal } from '@/features/dashboard/ui/dashboard-settings-modal'
import {
  getOverallStatistics,
  type OverallStatistics,
} from '@/features/dashboard/api/statistics-service'
import {
  getInstructorActivitySummary,
  type InstructorActivitySummary,
} from '@/features/dashboard/api/instructor-activity-service'
import './dashboard.css'
import '@/features/widget-editor/ui/widget-card.css'

/** rectSortingStrategy에서 scaleX/scaleY를 항상 1로 고정 — 위젯 크기 변형 없이 위치만 이동 */
const noScaleRectSortingStrategy: SortingStrategy = args => {
  const result = rectSortingStrategy(args)
  if (!result) return null
  return { ...result, scaleX: 1, scaleY: 1 }
}

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { activePrograms } = useDashboardData()
  const instructorCount = mockInstructors.length

  const userRoleLabel = useMemo(() => {
    if (!user) return ''
    if (user.role === 'ADMIN' && user.adminLevel) {
      return getAdminLevelLabel(user.adminLevel)
    }
    return getRoleLabel(user.role, user.adminLevel)
  }, [user?.role, user?.adminLevel])
  const [overallStatistics, setOverallStatistics] = useState<OverallStatistics | null>(null)
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [instructorActivity, setInstructorActivity] = useState<InstructorActivitySummary | null>(
    null
  )
  const [instructorActivityLoading, setInstructorActivityLoading] = useState(false)

  // 권한별 위젯 구성
  const widgets = useMemo(() => {
    return getDashboardWidgetsByRole(user?.role || null)
  }, [user?.role])

  // DnD: 정렬 단위 id 목록 및 메타
  const defaultIds = useMemo(() => buildDefaultDisplayItemIds(widgets), [widgets])
  const displayItemsMeta = useMemo(() => buildDisplayItemsMeta(widgets), [widgets])
  const orderedIds = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) =>
    s.getOrderedIds(user?.role ?? null, defaultIds)
  )
  const setOrderedIds = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.setOrderedIds)
  const widthByRole = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.widthByRole)
  const setWidgetWidth = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.setWidgetWidth)
  const roleWidths = widthByRole[user?.role ?? ''] ?? {}

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (!over || active.id === over.id || !user?.role) return
      const oldIndex = orderedIds.indexOf(active.id as string)
      const newIndex = orderedIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      const next = arrayMove(orderedIds, oldIndex, newIndex)
      setOrderedIds(user.role, next)
    },
    [orderedIds, setOrderedIds, user?.role]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  // 관리자일 경우 전체 통계 데이터 로드
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setOverallStatistics(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      setStatisticsLoading(true)
      try {
        const data = await getOverallStatistics()
        if (!cancelled) {
          setOverallStatistics(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('통계 데이터 로드 실패:', error)
        }
      } finally {
        if (!cancelled) {
          setStatisticsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.role])

  // 강사/개인(참여자)일 경우 본인 활동 데이터 로드
  useEffect(() => {
    if (!((user?.role === 'INSTRUCTOR' || user?.role === 'INDIVIDUAL') && user?.instructorId)) {
      setInstructorActivity(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      if (!user.instructorId) return

      setInstructorActivityLoading(true)
      try {
        const data = await getInstructorActivitySummary(user.instructorId)
        if (!cancelled) {
          setInstructorActivity(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('활동 데이터 로드 실패:', error)
        }
      } finally {
        if (!cancelled) {
          setInstructorActivityLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.role, user?.instructorId])

  // 위젯 타입에 따라 컴포넌트 렌더링
  const renderWidget = (widgetType: string) => {
    switch (widgetType) {
      case 'pending-actions-alert':
        return <PendingActionsAlert />
      case 'overall-statistics-cards':
        if (!overallStatistics) {
          return (
            <Card loading={statisticsLoading}>
              <div style={{ height: 150 }} />
            </Card>
          )
        }
        return <OverallStatisticsCards statistics={overallStatistics} loading={statisticsLoading} />
      case 'overall-program-progress-card':
        return <OverallProgramProgressCard />
      // case 'program-progress-widget':
      //   return <ProgramProgressWidget /> // 임시 주석
      case 'program-progress-tabs-table':
        return <ProgramProgressTabsTable />
      case 'pending-actions-row':
        return <PendingActionsRow />
      case 'pending-applications-card':
        return <PendingApplicationsCard />
      case 'pending-matchings-card':
        return <PendingMatchingsCard />
      case 'pending-settlements-card':
        return <PendingSettlementsCard />
      case 'monthly-settlement-card':
        return <MonthlySettlementCard />
      case 'monthly-application-card':
        return <MonthlyApplicationCard />
      case 'active-program-card':
        return <ActiveProgramCard />
      case 'instructor-count-card':
        return (
          <Card
            hoverable
            onClick={() => navigate('/instructors')}
            style={{ height: '100%', cursor: 'pointer' }}
          >
            <Statistic
              title="등록된 강사"
              value={instructorCount}
              suffix="명"
              valueStyle={{ color: '#000000', fontWeight: 'bold' }}
            />
          </Card>
        )
      case 'unified-activity-feed':
        return <UnifiedActivityFeed pageSize={10} />
      case 'my-activity-summary':
        return <MyActivitySummary />
      case 'my-volunteer-activity-summary':
        return <MyVolunteerActivitySummary />
      case 'my-application-summary':
        return <MyApplicationSummary />
      case 'upcoming-schedules-list':
        if (!instructorActivity) {
          return (
            <Card loading={instructorActivityLoading}>
              <div style={{ height: 200 }} />
            </Card>
          )
        }
        return (
          <UpcomingSchedulesList
            schedules={instructorActivity.schedules.upcoming}
            loading={instructorActivityLoading}
          />
        )
      case 'pending-tasks-list':
        if (!instructorActivity) {
          return (
            <Card loading={instructorActivityLoading}>
              <div style={{ height: 200 }} />
            </Card>
          )
        }
        return (
          <PendingTasksList
            reportPending={instructorActivity.pendingTasks.reportPending}
            settlementPending={instructorActivity.pendingTasks.settlementPending}
            settlementTasks={instructorActivity.pendingTasks.settlementTasks}
            loading={instructorActivityLoading}
          />
        )
      case 'volunteer-pending-tasks-list':
        if (!instructorActivity) {
          return (
            <Card loading={instructorActivityLoading}>
              <div style={{ height: 200 }} />
            </Card>
          )
        }
        return (
          <VolunteerPendingTasksList
            reportPending={instructorActivity.pendingTasks.reportPending}
            reportTasks={[]} // TODO: API 연동 시 실제 작업 목록 전달
            loading={instructorActivityLoading}
          />
        )
      case 'notification-widget':
        return <NotificationWidget />
      case 'customer-inquiry-status-widget':
        return <CustomerInquiryStatusWidget />
      case 'program-schedule-widget':
        return <ProgramScheduleWidget />
      case 'menu-shortcut-widget':
        return <MenuShortcutWidget />
      case 'recruitment-status-widget':
        return <RecruitmentStatusWidget />
      case 'kpi-achievement-widget':
        return <KpiAchievementWidget />
      default:
        return null
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          <h2 className="dashboard-toolbar-title">
            {user?.name} {userRoleLabel}님, 반갑습니다!
          </h2>
          <span className="dashboard-toolbar-description">
            진행 프로젝트 {activePrograms.count}건
          </span>
        </div>
        <div className="dashboard-toolbar-right">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setSettingsModalOpen(true)}
          >
            대시보드 설정
          </Button>
        </div>
      </div>

      <DashboardSettingsModal
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
      />

      {/* 권한별 위젯 렌더링 (DnD: 햄버거 핸들에서만 드래그) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={orderedIds} strategy={noScaleRectSortingStrategy}>
          <Row gutter={[16, 16]} align="stretch">
            {orderedIds.map((id: string) => {
              const meta = displayItemsMeta.find((m: DisplayItemMeta) => m.id === id)
              if (!meta) return null

              const widgetComponent = renderWidget(id)
              if (!widgetComponent) return null

              const effectiveColSpan = (roleWidths[id] as 12 | 24 | undefined) ?? (meta.colSpan as 12 | 24)
              const resizable = id !== 'kpi-achievement-widget'

              return (
                <SortableWidgetSlot
                  key={id}
                  id={id}
                  colSpan={effectiveColSpan}
                  hasBuiltInHandle={meta.hasBuiltInHandle}
                  height={meta.height}
                  onResizeWidth={resizable ? newColSpan => {
                    if (user?.role) setWidgetWidth(user.role, id, newColSpan)
                  } : undefined}
                >
                  {widgetComponent}
                </SortableWidgetSlot>
              )
            })}
          </Row>
        </SortableContext>
        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {activeId ? (
            <div className="dashboard-widget-drag-overlay">
              {renderWidget(activeId)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
