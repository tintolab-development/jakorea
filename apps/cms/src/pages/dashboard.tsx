/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, message } from 'antd'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, type SortingStrategy } from '@dnd-kit/sortable'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import { isWidgetResizable } from '@/shared/config/dashboard-config'
import { getRoleLabel } from '@/shared/ui'
import { mockInstructors } from '@/data/mock'
import {
  useDashboardData,
  useDashboardLayout,
  SortableWidgetSlot,
  DashboardSettingsModal,
  DashboardToolbar,
  DashboardWidgetRenderer,
  useOverallStatistics,
  useInstructorActivity,
  useDashboardDnd,
  getSlotHeight,
} from '@/features/dashboard'
import './dashboard.css'
import '@/features/dashboard/ui/widget-card.css'
/* 메뉴 바로가기 태그: Ant css-in-js보다 앞서 로드(중복 import는 Vite가 합침) */
import '@/features/dashboard/ui/menu-shortcut-widget.css'

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

  const { data: overallStatistics, loading: statisticsLoading } = useOverallStatistics(!!isAdmin)
  const { data: instructorActivity, loading: instructorActivityLoading } = useInstructorActivity(
    !!isInstructorOrIndividual,
    user?.instructorId
  )

  const {
    displayOrder,
    displayItemsMeta,
    roleWidths,
    setOrderedIds,
    setWidgetWidth,
    getSlotRects,
    rowRef,
  } = useDashboardLayout({ userRole: user?.role ?? null })

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const { activeId, sensors, handleDragStart, handleDragMove, handleDragEnd, handleDragCancel } =
    useDashboardDnd({
      orderedIds: displayOrder,
      setOrderedIds,
      userRole: user?.role ?? null,
      roleWidths: roleWidths as Record<string, 12 | 24>,
      displayItemsMeta,
      setWidgetWidth,
      getSlotRects,
      onLayoutSaved: () => message.success('위젯 위치가 저장되었습니다.'),
    })

  const handleInstructorCardClick = useCallback(() => {
    navigate('/users/list?kind=instructors')
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
    <div
      className={`dashboard-container${prefersReducedMotion ? ' dashboard-container--reduced-motion' : ''}`}
    >
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
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={displayOrder} strategy={noScaleRectSortingStrategy}>
          <div
            ref={rowRef}
            className="dashboard-widget-row-wrapper"
            data-dragging={activeId ? 'true' : undefined}
          >
            <Row gutter={[32, 32]} align="stretch">
              {displayOrder.flatMap((id: string) => {
                const meta = displayItemsMeta.find(m => m.id === id)
                if (!meta) return []

                const effectiveColSpan =
                  (roleWidths[id] as 12 | 24 | undefined) ?? (meta.colSpan as 12 | 24)
                const slotHeight = getSlotHeight(effectiveColSpan, meta)

                return [
                  <SortableWidgetSlot
                    key={id}
                    id={id}
                    colSpan={effectiveColSpan}
                    hasBuiltInHandle={meta.hasBuiltInHandle}
                    height={slotHeight}
                    onResizeWidth={
                      user?.role && isWidgetResizable(id)
                        ? newColSpan => setWidgetWidth(user.role, id, newColSpan)
                        : undefined
                    }
                  >
                    <DashboardWidgetRenderer widgetType={id} {...widgetRendererProps} />
                  </SortableWidgetSlot>,
                ]
              })}
            </Row>
          </div>
        </SortableContext>
        <DragOverlay
          adjustScale={false}
          dropAnimation={
            prefersReducedMotion
              ? null
              : {
                  duration: 280,
                  easing: 'cubic-bezier(0.2, 0, 0, 1)',
                }
          }
        >
          {activeId ? (
            <div className="dashboard-widget-drag-overlay">
              <DashboardWidgetRenderer widgetType={activeId} {...widgetRendererProps} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
