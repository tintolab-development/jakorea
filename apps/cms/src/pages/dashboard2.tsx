/**
 * 대시보드 페이지 2 (위젯 편집 가능)
 * 네이버웍스 스타일의 위젯 드래그앤드롭 및 편집 기능 제공
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { WidgetEditorDashboard } from '@/features/widget-editor/ui/widget-editor-dashboard'
import { EditToolbar } from '@/features/widget-editor/ui/edit-toolbar'
import { useWidgetEditorStore } from '@/features/widget-editor/model/widget-editor-store'
import { getDashboardWidgetsByRole } from '@/shared/config/dashboard-config'
import { getWidgetDefinition } from '@/features/widget-editor/lib/widget-registry'
import type { DashboardLayout } from '@/features/widget-editor/model/widget-types'
import './dashboard2.css'

// uuid 생성 헬퍼
function generateId(): string {
  return crypto.randomUUID()
}

export function Dashboard2() {
  const { user } = useAuthStore()
  const { draftState, initializeFromDefault } = useWidgetEditorStore()

  // 초기 위젯 로드 (기존 대시보드 설정 기반)
  useEffect(() => {
    if (!user?.role) return

    // 이미 위젯이 있으면 초기화하지 않음
    if (draftState.widgets.length > 0) {
      return
    }

    // 권한별 기본 위젯 구성 가져오기
    const defaultWidgets = getDashboardWidgetsByRole(user.role)

    // 위젯 인스턴스 생성
    const widgetInstances = defaultWidgets.map(widgetConfig => {
      const widgetDef = getWidgetDefinition(widgetConfig.type)
      if (!widgetDef) {
        return null
      }

      const instanceId = generateId()
      const preset = widgetDef.sizePresets[widgetDef.defaultSize]

      return {
        instance: {
          id: instanceId,
          widgetKey: widgetConfig.type,
          size: widgetDef.defaultSize,
          enabled: true,
        },
        layoutItem: {
          i: instanceId,
          x: 0,
          y: 0, // 임시, 실제로는 순서에 따라 배치
          w: preset.w,
          h: preset.h,
          minW: 2,
          minH: 2,
        },
      }
    }).filter(Boolean) as Array<{
      instance: { id: string; widgetKey: string; size: 'small' | 'large'; enabled: boolean }
      layoutItem: { i: string; x: number; y: number; w: number; h: number; minW: number; minH: number }
    }>

    if (widgetInstances.length === 0) {
      return
    }

    // 레이아웃 배치 (간단한 그리드 배치)
    const layoutItems = widgetInstances.map((item, index) => {
      const cols = 24
      const itemWidth = item.layoutItem.w
      const itemsPerRow = Math.floor(cols / itemWidth)
      const row = Math.floor(index / itemsPerRow)
      const col = (index % itemsPerRow) * itemWidth

      // 이전 행의 최대 높이 계산
      let currentY = 0
      for (let r = 0; r < row; r++) {
        const rowStart = r * itemsPerRow
        const rowEnd = Math.min(rowStart + itemsPerRow, widgetInstances.length)
        const rowItems = widgetInstances.slice(rowStart, rowEnd)
        const maxHeight = Math.max(...rowItems.map(i => i.layoutItem.h))
        currentY += maxHeight
      }

      return {
        ...item.layoutItem,
        x: col,
        y: currentY,
      }
    })

    // 초기 레이아웃 설정
    const initialLayout: DashboardLayout = {
      version: 1,
      breakpoints: {
        lg: layoutItems,
      },
      widgets: widgetInstances.map(item => item.instance),
    }

    // 스토어에 초기 레이아웃 설정
    initializeFromDefault(initialLayout)
  }, [user?.role, draftState.widgets.length, initializeFromDefault])

  return (
    <div className="dashboard2-container">
      <div className="dashboard2-toolbar">
        <EditToolbar />
      </div>
      <WidgetEditorDashboard />
    </div>
  )
}
