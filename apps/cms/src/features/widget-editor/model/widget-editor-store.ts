/**
 * 위젯 편집기 상태 관리 스토어 (Zustand)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardLayout, WidgetInstance, WidgetEditorState } from './widget-types'
import {
  loadLayout,
  saveLayout,
  createDefaultLayout,
} from '../api/widget-storage-service'
import { getWidgetDefinition } from '../lib/widget-registry'
import type { Layout } from 'react-grid-layout'

interface WidgetEditorStore extends WidgetEditorState {
  /** 드래그 중일 때 true (위젯 내부 포인터 비활성화용) */
  isDragging: boolean
  /** 리사이즈 중일 때 true (위젯 내부 포인터 비활성화용) */
  isResizing: boolean
  // Actions
  setEditMode: (enabled: boolean) => void
  setDragging: (value: boolean) => void
  setResizing: (value: boolean) => void
  addWidget: (widgetKey: string, instanceId: string) => void
  removeWidget: (instanceId: string) => void
  updateLayout: (layout: Layout[], breakpoint?: 'lg' | 'md' | 'sm') => void
  toggleWidgetSize: (instanceId: string) => void
  saveChanges: () => void
  cancelChanges: () => void
  reset: () => void
  initializeFromDefault: (layout: DashboardLayout) => void
}

/**
 * 초기 상태 생성
 */
function createInitialState(): WidgetEditorState {
  const loaded = loadLayout()
  const initialState: DashboardLayout = loaded || createDefaultLayout()

  return {
    committedState: initialState,
    draftState: { ...initialState },
    editMode: false,
    isDirty: false,
  }
}

export const useWidgetEditorStore = create<WidgetEditorStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      isDragging: false,
      isResizing: false,

      /**
       * 드래그 중 상태 (onDragStart/onDragStop에서 설정)
       */
      setDragging: (value: boolean) => set({ isDragging: value }),

      /**
       * 리사이즈 중 상태 (onResizeStart/onResizeStop에서 설정)
       */
      setResizing: (value: boolean) => set({ isResizing: value }),

      /**
       * 편집 모드 토글
       */
      setEditMode: (enabled: boolean) => {
        if (enabled) {
          // 편집 모드 진입: committedState를 draftState로 복사
          set({
            editMode: true,
            draftState: { ...get().committedState },
            isDirty: false,
          })
        } else {
          // 편집 모드 종료: 변경사항이 있으면 확인 필요 (여기서는 바로 취소)
          set({
            editMode: false,
            draftState: { ...get().committedState },
            isDirty: false,
          })
        }
      },

      /**
       * 위젯 추가
       */
      addWidget: (widgetKey: string, instanceId: string) => {
        const { draftState } = get()
        const widgetDef = getWidgetDefinition(widgetKey)
        
        if (!widgetDef) {
          console.error(`위젯 정의를 찾을 수 없습니다: ${widgetKey}`)
          return
        }

        const defaultSize = widgetDef.defaultSize
        const preset = widgetDef.sizePresets[defaultSize]

        const newWidget: WidgetInstance = {
          id: instanceId,
          widgetKey,
          size: defaultSize,
          enabled: true,
        }

        // 위젯 목록에 추가
        const updatedWidgets = [...draftState.widgets, newWidget]

        // 레이아웃에 추가 (최하단 배치)
        const currentLayout = draftState.breakpoints?.lg || []
        const maxY = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), -1)
        
        const newLayoutItem = {
          i: instanceId,
          x: 0,
          y: maxY + 1,
          w: preset.w,
          h: preset.h,
          minW: 2,
          minH: 2,
        }

        const updatedLayout = [...currentLayout, newLayoutItem]

        set({
          draftState: {
            ...draftState,
            widgets: updatedWidgets,
            breakpoints: {
              ...draftState.breakpoints,
              lg: updatedLayout,
            },
          },
          isDirty: true,
        })
      },

      /**
       * 위젯 제거
       */
      removeWidget: (instanceId: string) => {
        const { draftState } = get()
        const updatedWidgets = draftState.widgets.filter(w => w.id !== instanceId)
        const currentLayout = draftState.breakpoints?.lg || []
        const updatedLayout = currentLayout.filter(item => item.i !== instanceId)

        set({
          draftState: {
            ...draftState,
            widgets: updatedWidgets,
            breakpoints: {
              ...draftState.breakpoints,
              lg: updatedLayout,
            },
          },
          isDirty: true,
        })
      },

      /**
       * 레이아웃 업데이트 (드래그/리사이즈 시)
       */
      updateLayout: (layout: Layout[], breakpoint: 'lg' | 'md' | 'sm' = 'lg') => {
        const { draftState } = get()
        set({
          draftState: {
            ...draftState,
            breakpoints: {
              ...draftState.breakpoints,
              [breakpoint]: layout,
            },
          },
          isDirty: true,
        })
      },

      /**
       * 위젯 크기 토글 (small <-> large)
       */
      toggleWidgetSize: (instanceId: string) => {
        const { draftState } = get()
        const widget = draftState.widgets.find(w => w.id === instanceId)
        if (!widget) return

        const widgetDef = getWidgetDefinition(widget.widgetKey)
        if (!widgetDef) {
          console.error(`위젯 정의를 찾을 수 없습니다: ${widget.widgetKey}`)
          return
        }

        // 크기 토글
        const newSize: 'small' | 'large' = widget.size === 'small' ? 'large' : 'small'
        const preset = widgetDef.sizePresets[newSize]
        
        // 위젯 업데이트
        const updatedWidgets = draftState.widgets.map(w =>
          w.id === instanceId ? { ...w, size: newSize } : w
        )

        // 레이아웃 업데이트 (프리셋에 따라 w/h 변경)
        const currentLayout = draftState.breakpoints?.lg || []
        const updatedLayout = currentLayout.map(item => {
          if (item.i === instanceId) {
            return {
              ...item,
              w: preset.w,
              h: preset.h,
            }
          }
          return item
        })

        set({
          draftState: {
            ...draftState,
            widgets: updatedWidgets,
            breakpoints: {
              ...draftState.breakpoints,
              lg: updatedLayout,
            },
          },
          isDirty: true,
        })
      },

      /**
       * 변경사항 저장 (draft -> committed)
       */
      saveChanges: () => {
        const { draftState } = get()
        const committedState = { ...draftState }
        
        // localStorage에 저장
        saveLayout(committedState)

        set({
          committedState,
          editMode: false,
          isDirty: false,
        })
      },

      /**
       * 변경사항 취소 (draft -> committed로 롤백)
       */
      cancelChanges: () => {
        const { committedState } = get()
        set({
          draftState: { ...committedState },
          editMode: false,
          isDirty: false,
        })
      },

      /**
       * 초기화
       */
      reset: () => {
        const initialState = createInitialState()
        set(initialState)
      },

      /**
       * 초기 레이아웃 설정 (기존 대시보드 위젯 기반)
       */
      initializeFromDefault: (layout: DashboardLayout) => {
        // localStorage에 저장
        saveLayout(layout)
        // 상태 업데이트
        set({
          committedState: layout,
          draftState: { ...layout },
          editMode: false,
          isDirty: false,
        })
      },
    }),
    {
      name: 'widget-editor-store',
      // localStorage는 별도 서비스에서 관리하므로 여기서는 persist 제외
      partialize: () => ({}), // 상태는 저장하지 않음 (별도 서비스 사용)
    }
  )
)
