/**
 * 위젯 편집기 상태 관리 스토어 (Zustand)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardLayout, WidgetInstance, WidgetEditorState } from './widget-types'
import { loadLayout, saveLayout, createDefaultLayout } from '../api/widget-storage-service'
import { getWidgetDefinition } from '../lib/widget-registry'
import {
  repackLayout as repackLayoutFn,
  sanitizeLayoutToTwoColumns,
  sanitizeToTwoColumns,
} from '../lib/repack-layout'
import { getDndSizeForWidget } from '../lib/dnd-layout-constants'
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
  /** 2열 밀집 리팩. 드롭 시 preferredColumn으로 해당 위젯 열 고정 가능 */
  repackLayout: (preferredColumn?: { instanceId: string; x: 0 | 6 }) => void
  toggleWidgetSize: (instanceId: string) => void
  saveChanges: () => void
  cancelChanges: () => void
  reset: () => void
  initializeFromDefault: (layout: DashboardLayout) => void
}

/**
 * 초기 상태 생성
 * 로드된 레이아웃이 있으면 리팩하여 x=0|6 및 밀집 배치 보장
 */
function createInitialState(): WidgetEditorState {
  const loaded = loadLayout()
  const raw: DashboardLayout = loaded || createDefaultLayout()
  const layoutLg = raw.breakpoints?.lg || []
  const widgets = raw.widgets || []
  const repackedLg =
    layoutLg.length > 0 && widgets.length > 0 ? repackLayoutFn(layoutLg, widgets) : layoutLg
  const initialState: DashboardLayout = {
    ...raw,
    breakpoints: { ...raw.breakpoints, lg: repackedLg },
  }

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

        const newWidget: WidgetInstance = {
          id: instanceId,
          widgetKey,
          size: defaultSize,
          enabled: true,
        }

        // 위젯 목록에 추가
        const updatedWidgets = [...draftState.widgets, newWidget]

        // 레이아웃에 추가 (DnD 타입에 따른 w/h만 사용)
        const currentLayout = draftState.breakpoints?.lg || []
        const maxY = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), -1)
        const { w, h } = getDndSizeForWidget(widgetKey)

        const newLayoutItem = sanitizeToTwoColumns({
          i: instanceId,
          x: 0,
          y: maxY + 1,
          w,
          h,
          minW: 2,
          minH: 2,
        })

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
        get().repackLayout()
      },

      /**
       * 2열 밀집 리팩 (구멍 제거). preferredColumn이 있으면 해당 위젯을 지정 열에 배치 (드롭 미드라인용).
       */
      repackLayout: (preferredColumn?: { instanceId: string; x: 0 | 6 }) => {
        const { draftState } = get()
        const current = draftState.breakpoints?.lg || []
        if (current.length === 0) return
        const preferredMap =
          preferredColumn != null ? { [preferredColumn.instanceId]: preferredColumn.x } : undefined
        const repacked = repackLayoutFn(current, draftState.widgets, 12, preferredMap)
        set({
          draftState: {
            ...draftState,
            breakpoints: {
              ...draftState.breakpoints,
              lg: repacked,
            },
          },
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
        get().repackLayout()
      },

      /**
       * 레이아웃 업데이트 (드래그/리사이즈 시)
       * RGL 원본은 저장하지 않고, 항상 2열 정리(sanitize) 후에만 저장
       */
      updateLayout: (layout: Layout[], breakpoint: 'lg' | 'md' | 'sm' = 'lg') => {
        const { draftState } = get()
        const sanitized = breakpoint === 'lg' ? sanitizeLayoutToTwoColumns(layout) : layout
        set({
          draftState: {
            ...draftState,
            breakpoints: {
              ...draftState.breakpoints,
              [breakpoint]: sanitized,
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

        const newSize: 'small' | 'large' = widget.size === 'small' ? 'large' : 'small'
        const { w, h } = getDndSizeForWidget(widget.widgetKey)

        const updatedWidgets = draftState.widgets.map(w =>
          w.id === instanceId ? { ...w, size: newSize } : w
        )

        const currentLayout = draftState.breakpoints?.lg || []
        const updatedLayout = currentLayout.map(item => {
          if (item.i === instanceId) {
            return sanitizeToTwoColumns({ ...item, w, h })
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
        get().repackLayout()
      },

      /**
       * 변경사항 저장 (draft -> committed)
       * 저장 전 lg 레이아웃을 2열 정리하여 legacy x 값이 남지 않도록 함
       */
      saveChanges: () => {
        const { draftState } = get()
        const lg = draftState.breakpoints?.lg || []
        const committedState = {
          ...draftState,
          breakpoints: {
            ...draftState.breakpoints,
            lg: sanitizeLayoutToTwoColumns(lg),
          },
        }

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
       * 전달된 레이아웃을 2열 정리 후 설정하고, repack으로 밀집 배치 보장
       */
      initializeFromDefault: (layout: DashboardLayout) => {
        const lg = layout.breakpoints?.lg || []
        const sanitizedLg = sanitizeLayoutToTwoColumns(lg)
        const sanitizedLayout: DashboardLayout = {
          ...layout,
          breakpoints: { ...layout.breakpoints, lg: sanitizedLg },
        }
        saveLayout(sanitizedLayout)
        set({
          committedState: sanitizedLayout,
          draftState: { ...sanitizedLayout },
          editMode: false,
          isDirty: false,
        })
        get().repackLayout()
      },
    }),
    {
      name: 'widget-editor-store',
      // localStorage는 별도 서비스에서 관리하므로 여기서는 persist 제외
      partialize: () => ({}), // 상태는 저장하지 않음 (별도 서비스 사용)
    }
  )
)
