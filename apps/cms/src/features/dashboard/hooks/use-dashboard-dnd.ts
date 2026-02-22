/**
 * 대시보드 DnD(드래그 앤 드롭) 로직 훅
 * 비즈니스 로직: orderedIds 변경 시 setOrderedIds(role, next) 호출 — 동일 유지
 */

import { useState, useCallback } from 'react'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export function useDashboardDnd(
  orderedIds: string[],
  setOrderedIds: (role: string, ids: string[]) => void,
  userRole: string | null
) {
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
      if (!over || active.id === over.id || !userRole) return
      const oldIndex = orderedIds.indexOf(active.id as string)
      const newIndex = orderedIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      const next = arrayMove(orderedIds, oldIndex, newIndex)
      setOrderedIds(userRole, next)
    },
    [orderedIds, setOrderedIds, userRole]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  return {
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
