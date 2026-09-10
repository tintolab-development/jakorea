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
import type { ProgramScheduleKind } from '@/data/mock/program-schedule-keys'

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

export const isShortcutItemEnabled = (shortcutEnabled: Record<string, boolean>, id: string): boolean =>
  shortcutEnabled[id] !== false

export const isShortcutSettingsDisabled = (id: string): boolean =>
  SHORTCUT_ITEMS.some(item => item.id === id && item.settingsDisabled === true)

/** 바로가기 항목: id, label, path (대시보드 설정·메뉴 바로가기 위젯 공통) — 미구현 경로는 DASHBOARD_HOME_PATH */
export const SHORTCUT_ITEMS: ShortcutItemDef[] = [
  { id: 'programs-general-education', label: '일반 프로그램', path: '/programs/general' },
  { id: 'programs-economy', label: '1사1교 프로그램', path: '/programs/company-school' },
  { id: 'programs-ujat', label: 'UJAT 프로그램', path: '/programs/ujat', defaultEnabled: false },
  {
    id: 'programs-gemini',
    label: '제미나이 프로그램',
    path: '/programs/gemini/visiting-training',
    defaultEnabled: false,
  },
  { id: 'users-all', label: '전체 회원 관리', path: '/users/list?kind=all' },
  { id: 'users-school', label: '학교(교사) 회원', path: '/users/list?kind=institutions' },
  { id: 'users-instructor', label: '강사 회원 관리', path: '/users/list?kind=instructors' },
  { id: 'users-admin', label: '관리자 관리', path: '/users/list?kind=admins', defaultEnabled: false },
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
    path: '/admin/settings/program-permissions',
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
  { id: 'inquiries', label: '문의사항', path: '/admin/posts/inquiries' },
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
    label: '회원 로그인 이력',
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

/** settingsDisabled 항목은 항상 false로 고정 */
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
  /** 바로가기 아이콘 노출 여부 (id -> boolean) */
  shortcutEnabled: Record<string, boolean>
  /** 바로가기 항목별 읽음 처리(0)만 저장. 미설정 키는 getMenuShortcutBadgeCounts() 집계를 표시 */
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

const STORAGE_KEY = 'dashboard-settings'

export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist(
    (set, get) => ({
      shortcutEnabled: defaultShortcutEnabled,
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
      name: STORAGE_KEY,
      version: 3,
      migrate: (persistedState, version) => {
        const p = persistedState as {
          shortcutEnabled?: Record<string, boolean>
          shortcutBadgeCounts?: Record<string, number>
          widgetProgramIds?: Record<string, string[]>
          inquiryNotificationReadProgramKeys?: Record<string, boolean>
        }
        if (version === 0) {
          return {
            ...p,
            shortcutBadgeCounts: {},
          }
        }
        if (version < 2 && p.widgetProgramIds?.['program-schedule-economy-widget']) {
          const next = { ...p.widgetProgramIds }
          next['program-schedule-company-school-widget'] =
            next['program-schedule-economy-widget']
          delete next['program-schedule-economy-widget']
          p.widgetProgramIds = next
        }
        if (version < 3) {
          return {
            ...p,
            shortcutEnabled: buildDefaultShortcutEnabled(),
          }
        }
        return {
          ...p,
          shortcutEnabled: normalizeShortcutEnabled(p.shortcutEnabled ?? {}),
        }
      },
      /** 액션은 직렬화 제외 — 상태 필드만 저장 */
      partialize: state => ({
        shortcutEnabled: state.shortcutEnabled,
        shortcutBadgeCounts: state.shortcutBadgeCounts,
        widgetProgramIds: state.widgetProgramIds,
        inquiryNotificationReadProgramKeys: state.inquiryNotificationReadProgramKeys,
      }),
    }
  )
)
