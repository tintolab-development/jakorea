/**
 * 위젯 편집기 타입 정의
 */

import type { LayoutItem } from 'react-grid-layout'
import type { UserRole } from '@/types/user'

/**
 * 위젯 크기 프리셋
 */
export type WidgetSize = 'small' | 'large'

/**
 * 위젯 크기 프리셋 설정
 */
export interface WidgetSizePreset {
  w: number // 그리드 너비
  h: number // 그리드 높이
}

/**
 * 위젯 정의 (레지스트리)
 */
export interface WidgetDefinition {
  key: string // 위젯 고유 키
  title: string // 위젯 제목
  supportsSize: boolean // 크기 조정 지원 여부
  defaultSize: WidgetSize // 기본 크기
  sizePresets: {
    small: WidgetSizePreset
    large: WidgetSizePreset
  }
  render: React.ComponentType<any> // 위젯 컴포넌트
  visibilityRules?: (ctx: { role: UserRole | null }) => boolean // 권한 기반 노출
}

/**
 * 위젯 인스턴스 (사용자가 홈에 올린 위젯)
 */
export interface WidgetInstance {
  id: string // 인스턴스 ID (uuid)
  widgetKey: string // WidgetDefinition의 key
  size: WidgetSize // 현재 크기
  enabled: boolean // 활성화 여부
  meta?: Record<string, any> // 위젯별 설정
}

/**
 * 대시보드 레이아웃
 */
export interface DashboardLayout {
  version: number // 스키마 버전 (마이그레이션용)
  breakpoints?: {
    lg?: LayoutItem[]
    md?: LayoutItem[]
    sm?: LayoutItem[]
  }
  widgets: WidgetInstance[] // 활성화된 위젯 목록
}

/**
 * 위젯 편집기 상태
 */
export interface WidgetEditorState {
  committedState: DashboardLayout // 저장된 상태
  draftState: DashboardLayout // 편집 중 임시 상태
  editMode: boolean // 편집 모드 여부
  isDirty: boolean // 변경사항 존재 여부
}
