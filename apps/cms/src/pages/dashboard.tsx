/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row } from 'antd'
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import { getRoleLabel } from '@/shared/ui'
import { mockInstructors } from '@/data/mock'
import {
  useDashboardData,
  useDashboardWidgetOrderStore,
  buildDefaultDisplayItemIds,
  buildDisplayItemsMeta,
  SortableWidgetSlot,
  DashboardSettingsModal,
  DashboardToolbar,
  DashboardWidgetRenderer,
  useOverallStatistics,
  useInstructorActivity,
  useDashboardDnd,
  getSlotHeight,
  type DisplayItemMeta,
  type DashboardWidgetOrderState,
} from '@/features/dashboard'
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

  const isAdmin = user?.role === 'ADMIN'
  const isInstructorOrIndividual =
    (user?.role === 'INSTRUCTOR' || user?.role === 'INDIVIDUAL') && !!user?.instructorId

  const { data: overallStatistics, loading: statisticsLoading } =
    useOverallStatistics(!!isAdmin)
  const { data: instructorActivity, loading: instructorActivityLoading } =
    useInstructorActivity(!!isInstructorOrIndividual, user?.instructorId)

  const widgets = useMemo(
    () => getDashboardWidgetsByRole(user?.role ?? null),
    [user?.role]
  )
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

  const {
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useDashboardDnd(orderedIds, setOrderedIds, user?.role ?? null)

  const handleInstructorCardClick = useCallback(() => {
    navigate('/instructors')
  }, [navigate])

  const widgetRendererProps = useMemo(
    () => ({
      overallStatistics,
      statisticsLoading,
      instructorActivity,
      instructorActivityLoading,
      instructorCount,
      onInstructorCardClick: handleInstructorCardClick,
    }),
    [
      overallStatistics,
      statisticsLoading,
      instructorActivity,
      instructorActivityLoading,
      instructorCount,
      handleInstructorCardClick,
    ]
  )

  return (
    <div className="dashboard-container">
      <DashboardToolbar
        userName={user?.name}
        roleLabel={userRoleLabel}
        activeProgramsCount={activePrograms.count}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      <DashboardSettingsModal
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
      />

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

              const effectiveColSpan =
                (roleWidths[id] as 12 | 24 | undefined) ?? (meta.colSpan as 12 | 24)
              const slotHeight = getSlotHeight(id, effectiveColSpan, meta)

              return (
                <SortableWidgetSlot
                  key={id}
                  id={id}
                  colSpan={effectiveColSpan}
                  hasBuiltInHandle={meta.hasBuiltInHandle}
                  height={slotHeight}
                  onResizeWidth={
                    user?.role && id !== 'kpi-achievement-widget'
                      ? (newColSpan) => setWidgetWidth(user.role, id, newColSpan)
                      : undefined
                  }
                >
                  <DashboardWidgetRenderer
                    widgetType={id}
                    {...widgetRendererProps}
                  />
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
              <DashboardWidgetRenderer
                widgetType={activeId}
                {...widgetRendererProps}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
