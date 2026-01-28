/**
 * 위젯 레이아웃 저장 서비스 (localStorage 기반)
 */

import type { DashboardLayout } from '../model/widget-types'

const STORAGE_KEY = 'widget-editor-layout'
const CURRENT_VERSION = 1

/**
 * localStorage에서 레이아웃 로드
 */
export function loadLayout(): DashboardLayout | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as DashboardLayout

    // 버전 체크 및 마이그레이션
    if (parsed.version !== CURRENT_VERSION) {
      console.warn(
        `레이아웃 버전 불일치: 저장된 버전 ${parsed.version}, 현재 버전 ${CURRENT_VERSION}. 초기화합니다.`
      )
      return null
    }

    return parsed
  } catch (error) {
    console.error('레이아웃 로드 실패:', error)
    return null
  }
}

/**
 * localStorage에 레이아웃 저장
 */
export function saveLayout(layout: DashboardLayout): void {
  try {
    const toSave: DashboardLayout = {
      ...layout,
      version: CURRENT_VERSION,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('레이아웃 저장 실패:', error)
  }
}

/**
 * 기본 레이아웃 생성
 */
export function createDefaultLayout(): DashboardLayout {
  return {
    version: CURRENT_VERSION,
    breakpoints: {
      lg: [],
    },
    widgets: [],
  }
}
