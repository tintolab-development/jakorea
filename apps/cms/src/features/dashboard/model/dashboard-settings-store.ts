/**
 * 대시보드 설정 스토어
 * - 바로가기 아이콘 노출 여부
 * - 위젯별 프로그램 선택 (4개 위젯 × 프로그램 id[])
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 바로가기 항목: id, label, path (대시보드 설정·메뉴 바로가기 위젯 공통) */
export const SHORTCUT_ITEMS: Array<{ id: string; label: string; path: string }> = [
  { id: 'programs', label: '전체 프로그램', path: '/programs/education' },
  { id: 'applications', label: '참여자 모집 현황', path: '/programs/education/student-recruitment' },
  { id: 'instructor-applications', label: '강사 모집 현황', path: '/programs/education/instructor-recruitment' },
  { id: 'users', label: '전체 회원', path: '/users/list?kind=all' },
  { id: 'schools', label: '학교(교사) 회원', path: '/users/list?kind=institutions' },
  { id: 'instructors', label: '강사단', path: '/users/list?kind=instructors' },
  { id: 'kakao-alimtalk', label: '카카오 알림톡', path: '/templates/kakao-alimtalk' },
  { id: 'email', label: '메일 관리', path: '/templates/email' },
  { id: 'banner', label: '배너 관리', path: '/templates/banner' },
  { id: 'notices', label: '공지사항', path: '/admin/posts/notices' },
  { id: 'faq', label: 'FAQ', path: '/admin/posts/faq' },
  { id: 'inquiries', label: '문의하기', path: '/admin/posts/inquiries' },
  { id: 'program-forms', label: '프로그램 양식', path: '/templates/program-forms' },
  { id: 'file-forms', label: '파일 양식', path: '/templates/file-forms' },
  { id: 'sponsors', label: '후원사', path: '/sponsors' },
]

/** 위젯별 프로그램 설정용 위젯 키 (4개 위젯) */
export const WIDGET_PROGRAM_KEYS = [
  { key: 'program-schedule-widget', label: '프로그램 일정' },
  { key: 'recruitment-status-widget', label: '모집 신청 현황' },
  { key: 'customer-inquiry-status-widget', label: '프로그램 별 문의 현황' },
  { key: 'kpi-achievement-widget', label: '사업 별 KPI 대비 달성률' },
] as const

export type WidgetProgramKey = (typeof WIDGET_PROGRAM_KEYS)[number]['key']

/** 바로가기 항목별 미확인 내역 mock 초기값 */
const defaultShortcutBadgeCounts: Record<string, number> = {
  programs: 2,
  applications: 2,
  'instructor-applications': 0,
  users: 10,
  schools: 0,
  instructors: 0,
  'kakao-alimtalk': 0,
  email: 105, // 임시: 99+ 배지 확인용
  banner: 0,
  notices: 0,
  faq: 0,
  inquiries: 5,
  'program-forms': 0,
  'file-forms': 0,
  sponsors: 0,
}

const defaultShortcutEnabled: Record<string, boolean> = Object.fromEntries(
  SHORTCUT_ITEMS.map(item => [item.id, true])
)

export interface DashboardSettingsState {
  /** 바로가기 아이콘 노출 여부 (id -> boolean) */
  shortcutEnabled: Record<string, boolean>
  /** 바로가기 항목별 미확인 내역 수 (id -> count) */
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
}

const STORAGE_KEY = 'dashboard-settings'

export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist(
    (set, get) => ({
      shortcutEnabled: defaultShortcutEnabled,
      shortcutBadgeCounts: defaultShortcutBadgeCounts,
      widgetProgramIds: {},

      setShortcutEnabled: (id, enabled) => {
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
    }),
    { name: STORAGE_KEY }
  )
)
