/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 * Phase 5: 최근 활동 목록 추가
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 1 (대시보드 고도화): 즉시 처리 필요 작업, 월별 정산 현황, 통합 활동 피드
 */

import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, message } from 'antd'
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
  reorderToAvoidTopGap,
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
  const setOrderedIdsRaw = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.setOrderedIds)
  const widthByRole = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.widthByRole)
  const setWidgetWidth = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.setWidgetWidth)
  const roleWidths = widthByRole[user?.role ?? ''] ?? {}

  const getColSpanForId = useCallback(
    (id: string): 12 | 24 => {
      const w = roleWidths[id]
      if (w !== undefined) return w
      const meta = displayItemsMeta.find((m: DisplayItemMeta) => m.id === id)
      return (meta?.colSpan as 12 | 24) ?? 24
    },
    [roleWidths, displayItemsMeta]
  )

  /** 상단 빈 영역 방지: 50% 다음 100%면 순서 바꿔서 표시·저장 */
  const displayOrder = useMemo(
    () => reorderToAvoidTopGap(orderedIds, getColSpanForId),
    [orderedIds, getColSpanForId]
  )
  const setOrderedIds = useCallback(
    (role: string, next: string[]) => {
      setOrderedIdsRaw(role, reorderToAvoidTopGap(next, getColSpanForId))
    },
    [setOrderedIdsRaw, getColSpanForId]
  )

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const getSlotRects = useCallback(() => {
    const rowEl = rowRef.current
    if (!rowEl) return []
    return displayOrder
      .map(id => {
        const slot = rowEl.querySelector(`[data-dashboard-slot-id="${id}"]`)
        return slot ? { id, rect: slot.getBoundingClientRect() } : null
      })
      .filter((x): x is { id: string; rect: DOMRect } => x != null)
  }, [displayOrder])

  const {
    activeId,
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
    onLayoutSaved: () => message.success('위젯 위치가 저장되었습니다.'),
  })

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
          <div ref={rowRef} className="dashboard-widget-row-wrapper">
            <Row gutter={[16, 20]} align="stretch">
            {displayOrder.map((id: string) => {
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
