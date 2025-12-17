/**
 * Zustand 상태 관리 구조
 * Phase 1.1: 기본 구조 설계
 */

import { create } from 'zustand'

// TODO: 각 도메인별 스토어를 별도 파일로 분리 예정
// - instructorStore
// - programStore
// - applicationStore
// - scheduleStore
// - matchingStore
// - settlementStore
// - sponsorStore
// - schoolStore

// 예시: 임시 스토어 인터페이스
// 향후: 전역 상태 추가 예정 (예: 사용자 정보, 테마 설정 등)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppStore {
  // 초기 상태는 비어있음, 향후 확장 예정
}

export const useAppStore = create<AppStore>(() => ({}))

