/**
 * 대시보드 설정 스토어 (단일 persist)
 *
 * 도메인 슬라이스(구독 시 선택):
 * - shortcut: shortcutEnabled, shortcutBadgeCounts
 * - widgetPrograms: widgetProgramIds
 * - inquiry: inquiryNotificationReadProgramKeys
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProgramScheduleKind } from '@/features/dashboard/model/program-schedule-keys'
import {
  buildShortcutVisibilityForSave,
  isDashboardShortcutSettingsDisabled,
  normalizeShortcutVisibilityFromServer,
} from '@/features/dashboard/model/dashboard-shortcut-contract'

/** 대시보드 홈(임시 미구현 라우트 대체) */
export const DASHBOARD_HOME_PATH = '/'

export interface ShortcutItemDef {
  id: string
  label: string
  path: string
  /**
   * 설정 모달에서 체크 불가(회색). 위젯에도 노출하지 않음.
   * 기본 체크값은 항상 false로 강제.
   */
  settingsDisabled?: boolean
  /** 기본 노출 여부. 생략 시 true. settingsDisabled면 무시하고 false */
  defaultEnabled?: boolean
}

export { isShortcutItemEnabled } from '@/features/dashboard/model/dashboard-shortcut-contract'

export const isShortcutSettingsDisabled = (id: string): boolean =>
  isDashboardShortcutSettingsDisabled(id)

/** 바로가기 항목: id, label, path (대시보드 설정·메뉴 바로가기 위젯 공통) — 미구현 경로는 DASHBOARD_HOME_PATH */
export const SHORTCUT_ITEMS: ShortcutItemDef[] = [
  { id: 'programs-general-education', label: '일반 프로그램', path: '/programs/general' },
  { id: 'programs-economy', label: '1사1교 프로그램', path: '/programs/company-school' },
  { id: 'programs-ujat', label: 'UJAT 프로그램', path: '/programs/ujat', defaultEnabled: false },
  {
    id: 'programs-gemini',
    label: 'Gemini 프로그램',
    path: '/programs/gemini/visiting-training',
    defaultEnabled: false,
  },
  { id: 'users-all', label: '전체 회원 관리', path: '/users/list?kind=all' },
  {
    id: 'users-school',
    label: '학교(교사) 회원 관리',
    path: '/users/list?kind=institutions',
  },
  { id: 'users-instructor', label: '강사 회원 관리', path: '/users/list?kind=instructors' },
  {
    id: 'users-admin',
    label: '관리자 회원 관리',
    path: '/users/list?kind=admins',
    defaultEnabled: false,
  },
  {
    id: 'permission-requests',
    label: '회원 권한 승인',
    path: '/admin/permission-requests',
    defaultEnabled: false,
  },
  {
    id: 'admin-permission-settings',
    label: '관리자 권한 설정',
    path: '/admin/settings/permissions',
    settingsDisabled: true,
    defaultEnabled: false,
  },
  {
    id: 'program-permission-settings',
    label: '프로그램 권한 설정',
    path: '/admin/settings/program-manager-permissions',
    settingsDisabled: true,
    defaultEnabled: false,
  },
  { id: 'settlement-payment-orders', label: '지급조서 확인', path: '/settlement-management/payment-orders' },
  {
    id: 'settlement-account-payments',
    label: '계좌 지급 확인',
    path: '/settlement-management/account-payments',
    defaultEnabled: false,
  },
  {
    id: 'settlement-item-settings',
    label: '정산 항목 설정',
    path: '/settlement-management/item-settings',
    defaultEnabled: false,
  },
  { id: 'template-management', label: '템플릿 관리', path: '/templates/form-management' },
  { id: 'notices', label: '공지사항', path: '/admin/posts/notices' },
  { id: 'faq', label: 'FAQ', path: '/admin/posts/faq' },
  { id: 'inquiries', label: '문의내역', path: '/admin/posts/inquiries' },
  { id: 'sponsors', label: '후원사 관리', path: '/sponsors' },
  { id: 'textbooks', label: '교재 관리', path: '/textbook', defaultEnabled: false },
  { id: 'programs-detail', label: '세부 프로그램 관리', path: '/programs', defaultEnabled: false },
  {
    id: 'notification-messages',
    label: '알림 메시지 관리',
    path: '/admin/notifications/kakao-alimtalk',
  },
  { id: 'performance', label: '실적 관리', path: '/education-records' },
  {
    id: 'member-login-history',
    label: 'CMS 로그인 이력',
    path: '/logs/member-login-history',
    settingsDisabled: true,
    defaultEnabled: false,
  },
  {
    id: 'file-download-history',
    label: '파일 다운로드 이력',
    path: '/logs/file-download-history',
    settingsDisabled: true,
    defaultEnabled: false,
  },
  {
    id: 'privacy-query-history',
    label: '개인정보 조회 이력',
    path: '/logs/personal-info-access-history',
    settingsDisabled: true,
    defaultEnabled: false,
  },
  {
    id: 'bug-issue-history',
    label: '버그/이슈 이력',
    path: '/logs/bug-issue-history',
    settingsDisabled: true,
    defaultEnabled: false,
  },
]

/** 설정 모달에서 토글 가능한 바로가기만 */
export const SELECTABLE_SHORTCUT_ITEMS = SHORTCUT_ITEMS.filter(item => !item.settingsDisabled)

export function buildDefaultShortcutEnabled(): Record<string, boolean> {
  return Object.fromEntries(
    SHORTCUT_ITEMS.map(item => [
      item.id,
      item.settingsDisabled ? false : item.defaultEnabled !== false,
    ])
  )
}

/** mock·오프라인 전용 — remote는 API preferences 정본 */
export function normalizeShortcutEnabled(
  shortcutEnabled: Record<string, boolean>
): Record<string, boolean> {
  const next = { ...shortcutEnabled }
  for (const item of SHORTCUT_ITEMS) {
    if (item.settingsDisabled) {
      next[item.id] = false
    } else if (next[item.id] === undefined) {
      next[item.id] = item.defaultEnabled !== false
    }
  }
  return next
}

/** PUT payload용 — catalogKeys 없으면 disabled 6만 정규화 */
export function normalizeShortcutVisibilityForSave(
  shortcutEnabled: Record<string, boolean>,
  catalogKeys: readonly string[] | null
): Record<string, boolean> {
  if (catalogKeys != null && catalogKeys.length > 0) {
    return buildShortcutVisibilityForSave(shortcutEnabled, catalogKeys)
  }
  return normalizeShortcutVisibilityFromServer(shortcutEnabled)
}

export const DASHBOARD_SETTINGS_STORAGE_KEY = 'dashboard-settings'

type PersistedDashboardSettingsSlice = {
  shortcutBadgeCounts?: Record<string, number>
  widgetProgramIds?: Record<string, string[]>
  inquiryNotificationReadProgramKeys?: Record<string, boolean>
}

function normalizePersistedDashboardSettingsSlice(
  slice: PersistedDashboardSettingsSlice
): {
  shortcutBadgeCounts: Record<string, number>
  widgetProgramIds: Record<string, string[]>
  inquiryNotificationReadProgramKeys: Record<string, boolean>
} {
  return {
    shortcutBadgeCounts: slice.shortcutBadgeCounts ?? {},
    widgetProgramIds: slice.widgetProgramIds ?? {},
    inquiryNotificationReadProgramKeys: slice.inquiryNotificationReadProgramKeys ?? {},
  }
}

/** 위젯별 프로그램 설정용 위젯 키 (7개: 일정 4 + 기타) */
export const WIDGET_PROGRAM_KEYS = [
  { key: 'program-schedule-general-widget', label: '일반 프로그램 일정' },
  { key: 'program-schedule-company-school-widget', label: '1사1교 프로그램 일정' },
  { key: 'program-schedule-ujat-widget', label: 'UJAT 프로그램 일정' },
  { key: 'program-schedule-gemini-widget', label: 'Gemini 프로그램 일정' },
  { key: 'recruitment-status-widget', label: '모집 신청 현황' },
  { key: 'customer-inquiry-status-widget', label: '프로그램 별 문의 현황' },
  { key: 'kpi-achievement-widget', label: '사업 별 KPI 대비 달성률' },
] as const

export type WidgetProgramKey = (typeof WIDGET_PROGRAM_KEYS)[number]['key']

const defaultShortcutEnabled: Record<string, boolean> = buildDefaultShortcutEnabled()

export interface DashboardSettingsState {
  /** 바로가기 아이콘 노출 여부 (id -> boolean) — remote는 API preferences 정본, persist 제외 */
  shortcutEnabled: Record<string, boolean>
  /** 마지막 shortcuts API의 useYn=true shortcutKey 순서 (persist 제외) */
  shortcutCatalogKeys: string[] | null
  /** 로컬 바로가기 읽음 표시(레거시). remote 배지는 GET /dashboard-shortcut-badges counts만 사용 */
  shortcutBadgeCounts: Record<string, number>
  /** 위젯별 선택된 프로그램 id 목록 (위젯 key -> programId[]) */
  widgetProgramIds: Record<string, string[]>
  setShortcutEnabled: (id: string, enabled: boolean) => void
  setShortcutBadgeCount: (id: string, count: number) => void
  setWidgetProgramIds: (widgetKey: string, programIds: string[]) => void
  /** 위젯별 프로그램 토글: 있으면 제거, 없으면 추가 */
  toggleWidgetProgram: (widgetKey: string, programId: string) => void
  /** 위젯에 프로그램이 선택되어 있는지 (빈 배열 = 전체) */
  isProgramSelectedForWidget: (widgetKey: string, programId: string) => boolean
  /** 위젯에 노출할 프로그램 id 목록 (빈 배열이면 전체) */
  getProgramIdsForWidget: (widgetKey: string) => string[]
  /** 문의 알림 읽음: 프로그램별(행 key) — 해당 행 답변 대기 클릭 시 해당 프로그램만 읽음 처리 */
  inquiryNotificationReadProgramKeys: Record<string, boolean>
  setInquiryNotificationReadProgramKey: (programKey: string) => void
  /**
   * Me preferences `assignedProgramTypes`.
   * null = 아직 없음(ACL 폴백), [] = 담당 유형 없음, 그 외 = 해당 일정 위젯만 노출.
   * persist 하지 않음.
   */
  assignedProgramTypes: ProgramScheduleKind[] | null
  setAssignedProgramTypes: (kinds: ProgramScheduleKind[] | null) => void
}


export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist(
    (set, get) => ({
      shortcutEnabled: defaultShortcutEnabled,
      shortcutCatalogKeys: null,
      shortcutBadgeCounts: {},
      widgetProgramIds: {},

      setShortcutEnabled: (id, enabled) => {
        if (isShortcutSettingsDisabled(id)) return
        set(state => ({
          shortcutEnabled: { ...state.shortcutEnabled, [id]: enabled },
        }))
      },

      setShortcutBadgeCount: (id, count) => {
        set(state => ({
          shortcutBadgeCounts: { ...state.shortcutBadgeCounts, [id]: count },
        }))
      },

      setWidgetProgramIds: (widgetKey, programIds) => {
        set(state => ({
          widgetProgramIds: { ...state.widgetProgramIds, [widgetKey]: programIds },
        }))
      },

      toggleWidgetProgram: (widgetKey, programId) => {
        set(state => {
          const current = state.widgetProgramIds[widgetKey] ?? []
          const next = current.includes(programId)
            ? current.filter(id => id !== programId)
            : [...current, programId]
          return {
            widgetProgramIds: { ...state.widgetProgramIds, [widgetKey]: next },
          }
        })
      },

      isProgramSelectedForWidget: (widgetKey, programId) => {
        const ids = get().widgetProgramIds[widgetKey]
        if (!ids || ids.length === 0) return true
        return ids.includes(programId)
      },

      getProgramIdsForWidget: widgetKey => {
        const ids = get().widgetProgramIds[widgetKey]
        return ids ?? []
      },

      inquiryNotificationReadProgramKeys: {},
      setInquiryNotificationReadProgramKey: programKey => {
        set(state => ({
          inquiryNotificationReadProgramKeys: {
            ...state.inquiryNotificationReadProgramKeys,
            [programKey]: true,
          },
        }))
      },

      assignedProgramTypes: null,
      setAssignedProgramTypes: kinds => {
        set({ assignedProgramTypes: kinds })
      },
    }),
    {
      name: DASHBOARD_SETTINGS_STORAGE_KEY,
      version: 5,
      migrate: (persistedState, version) => {
        const p = persistedState as PersistedDashboardSettingsSlice & {
          shortcutEnabled?: Record<string, boolean>
        }
        if (version === 0) {
          return normalizePersistedDashboardSettingsSlice({
            ...p,
            shortcutBadgeCounts: {},
          })
        }
        if (version < 2 && p.widgetProgramIds?.['program-schedule-economy-widget']) {
          const next = { ...p.widgetProgramIds }
          next['program-schedule-company-school-widget'] =
            next['program-schedule-economy-widget']
          delete next['program-schedule-economy-widget']
          p.widgetProgramIds = next
        }
        return normalizePersistedDashboardSettingsSlice(p)
      },
      /** shortcutVisibility는 API 정본 — localStorage에 저장하지 않음 */
      partialize: state => ({
        shortcutBadgeCounts: state.shortcutBadgeCounts,
        widgetProgramIds: state.widgetProgramIds,
        inquiryNotificationReadProgramKeys: state.inquiryNotificationReadProgramKeys,
      }),
    }
  )
)
