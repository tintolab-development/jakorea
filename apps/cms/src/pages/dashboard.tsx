/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { Row } from 'antd'
import { DndContext, DragOverlay, MeasuringStrategy, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSwappingStrategy, type SortingStrategy } from '@dnd-kit/sortable'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import { getDashboardWidgetsForUser, isWidgetResizable } from '@/shared/config/dashboard-config'
import { getRoleLabel } from '@/shared/ui'
import { canAdminAction } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import {
  useActiveProgramCount,
  useDashboardLayout,
  SortableWidgetSlot,
  DashboardSettingsModal,
  DashboardToolbar,
  DashboardWidgetRenderer,
  useOverallStatistics,
  useInstructorActivity,
  useDashboardDnd,
  getSlotHeight,
  useDashboardHome,
  useDashboardPreferences,
  usePersistDashboardLayout,
} from '@/features/dashboard'
import { DashboardWidgetDragOverlayShell } from '@/features/dashboard/ui/drag-overlay-shell'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import './dashboard.css'
import '@/features/dashboard/ui/widget-card.css'
/* 메뉴 바로가기 태그: Ant css-in-js보다 앞서 로드(중복 import는 Vite가 합침) */
import '@/features/dashboard/ui/menu-shortcut-widget.css'

/** rectSwappingStrategy에서 scaleX/scaleY를 항상 1로 고정 — 드롭 계산(swap)과 프리뷰를 맞춤 */
const noScaleRectSwappingStrategy: SortingStrategy = args => {
  const result = rectSwappingStrategy(args)
  if (!result) return null
  return { ...result, scaleX: 1, scaleY: 1 }
}

export function Dashboard() {
  const { user } = useAuthStore()
  const mockActiveProgramCount = useActiveProgramCount()
  const isAdmin = user?.role === 'ADMIN'
  const useRemoteDashboard = isAdmin && shouldUseDashboardRemoteApi()
  const { data: dashboardHome } = useDashboardHome(!!isAdmin)
  const { isFetched: preferencesFetched } = useDashboardPreferences(!!isAdmin)
  const preferencesReady = !useRemoteDashboard || preferencesFetched
  const roleCode = useSessionAdminRoleCode()
  const persistLayout = usePersistDashboardLayout(
    preferencesReady && canAdminAction({ roleCode, action: 'dashboardWrite' }),
    user?.role ?? null
  )
  const userRole = user?.role ?? null

  const instructorCount = dashboardHome?.memberCount ?? 0
  const activeProgramsCount =
    useRemoteDashboard && dashboardHome?.programCount != null
      ? dashboardHome.programCount
      : mockActiveProgramCount

  const userRoleLabel = useMemo(() => {
    if (!user) return ''
    if (user.role === 'ADMIN' && user.adminLevel) {
      return getAdminLevelLabel(user.adminLevel)
    }
    return getRoleLabel(user.role, user.adminLevel)
  }, [user?.role, user?.adminLevel])

  const isInstructorOrIndividual =
    (user?.role === 'INSTRUCTOR' || user?.role === 'INDIVIDUAL') && !!user?.instructorId

  /** 역할 위젯에 overall-statistics가 있을 때만 조회 (관리자 홈 기본 구성에는 없음) */
  const needsOverallStatistics = useMemo(() => {
    if (!isAdmin || !user) return false
    return getDashboardWidgetsForUser(user).some(w => w.type === 'overall-statistics-cards')
  }, [isAdmin, user])

  const { data: overallStatistics, loading: statisticsLoading } =
    useOverallStatistics(needsOverallStatistics)
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
  } = useDashboardLayout({ userRole: user?.role ?? null, user: user ?? undefined })

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const {
    activeId,
    overlayRect,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useDashboardDnd({
    orderedIds: displayOrder,
    setOrderedIds,
    userRole: user?.role ?? null,
    roleWidths: roleWidths as Record<string, 12 | 24>,
    displayItemsMeta,
    setWidgetWidth,
    getSlotRects,
    onLayoutSaved: persistLayout,
  })

  const handleResizeWidth = useCallback(
    (widgetId: string, newColSpan: 12 | 24) => {
      if (!userRole) return
      setWidgetWidth(userRole, widgetId, newColSpan)
      persistLayout()
    },
    [userRole, setWidgetWidth, persistLayout]
  )

  const widgetRendererProps = useMemo(
    () => ({
      overallStatistics,
      statisticsLoading,
      instructorActivity,
      instructorActivityLoading,
      instructorCount,
      user: user ?? undefined,
    }),
    [
      overallStatistics,
      statisticsLoading,
      instructorActivity,
      instructorActivityLoading,
      instructorCount,
      user,
    ]
  )

  return (
    <div
      className={`dashboard-container${prefersReducedMotion ? ' dashboard-container--reduced-motion' : ''}`}
    >
      <DashboardToolbar
        userName={user?.name}
        roleLabel={userRoleLabel}
        activeProgramsCount={activeProgramsCount}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      <DashboardSettingsModal
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={displayOrder} strategy={noScaleRectSwappingStrategy}>
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
                      userRole && isWidgetResizable(id) ? handleResizeWidth : undefined
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
            <DashboardWidgetDragOverlayShell
              widgetId={activeId}
              width={overlayRect?.width}
              height={overlayRect?.height}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
