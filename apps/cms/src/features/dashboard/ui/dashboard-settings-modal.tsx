/**
 * 대시보드 설정 모달
 * - 바로가기 아이콘 설정 (체크박스)
 * - 위젯 별 프로그램 설정 (프로그램별 아코디언 + 위젯별 체크)
 * ContentModal(흰 헤더), 800×720px, 바디 스크롤
 */

import { Checkbox, Collapse } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsForUser, type DashboardWidgetType } from '@/shared/config/dashboard-config'
import {
  useDashboardSettingsStore,
  SHORTCUT_ITEMS,
  WIDGET_PROGRAM_KEYS,
  isShortcutItemEnabled,
} from '../model/dashboard-settings-store'
import {
  mockPrograms,
  getGeneralEducationPrograms,
  getCompanySchoolPrograms,
  getUjatPrograms,
  getGeminiPrograms,
} from '@/data/mock'
import './dashboard-settings-modal.css'
import { AppButton } from '@/shared/ui'

export interface DashboardSettingsModalProps {
  open: boolean
  onCancel: () => void
  /** 기본 레이아웃으로 되돌리기 (순서·너비 초기화) */
  onResetLayout?: () => void
}

/** 동일 title은 하나의 체크박스로 묶음 (mock 등에서 회차·기관별로 id만 다른 행 대응) */
function buildProgramTitleGroups(
  rows: { id: string; title: string }[]
): { title: string; ids: string[] }[] {
  const byTitle = new Map<string, string[]>()
  const order: string[] = []
  for (const { id, title } of rows) {
    if (!byTitle.has(title)) {
      byTitle.set(title, [])
      order.push(title)
    }
    byTitle.get(title)!.push(id)
  }
  return order.map(title => ({ title, ids: byTitle.get(title)! }))
}

function getProgramRowsForWidget(widgetKey: string): { id: string; title: string }[] {
  if (widgetKey === 'program-schedule-general-widget') {
    return getGeneralEducationPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-company-school-widget') {
    return getCompanySchoolPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-ujat-widget') {
    return getUjatPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-gemini-widget') {
    return getGeminiPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  return mockPrograms.map(p => ({ id: p.id, title: p.title }))
}

function getProgramTitleGroupsForWidget(widgetKey: string) {
  return buildProgramTitleGroups(getProgramRowsForWidget(widgetKey))
}

function getAllProgramIdsForWidget(widgetKey: string): string[] {
  return getProgramRowsForWidget(widgetKey).map(p => p.id)
}

function cloneWidgetProgramIds(src: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, [...v]]))
}

type UnifiedProgramRow = {
  title: string
  /** 위젯 키 → 해당 타이틀에 대응하는 program id 목록 (해당 위젯 목록에 없으면 키 없음) */
  idsByWidget: Record<string, string[]>
}

function buildUnifiedProgramRows(visibleWidgetKeys: readonly string[]): UnifiedProgramRow[] {
  const titleOrder: string[] = []
  const byTitle = new Map<string, Record<string, string[]>>()

  for (const widgetKey of visibleWidgetKeys) {
    for (const group of getProgramTitleGroupsForWidget(widgetKey)) {
      if (!byTitle.has(group.title)) {
        titleOrder.push(group.title)
        byTitle.set(group.title, {})
      }
      const entry = byTitle.get(group.title)!
      entry[widgetKey] = group.ids
    }
  }

  return titleOrder.map(title => ({
    title,
    idsByWidget: byTitle.get(title)!,
  }))
}

function widgetKeysForProgramRow(row: UnifiedProgramRow, visibleWidgetKeys: readonly string[]) {
  return visibleWidgetKeys.filter(wk => (row.idsByWidget[wk]?.length ?? 0) > 0)
}

/** 위젯에서 해당 타이틀 그룹을 끔 (기존 handleTitleGroupToggle과 동일 결과) */
function ensureGroupOffWidget(
  widgetKey: string,
  groupIds: string[],
  state: Record<string, string[]>
): string[] {
  const allProgramIds = getAllProgramIdsForWidget(widgetKey)
  const currentIds = state[widgetKey] ?? []
  if (currentIds.length === 0) {
    return allProgramIds.filter(id => !groupIds.includes(id))
  }
  return currentIds.filter(id => !groupIds.includes(id))
}

/** 위젯에서 해당 타이틀 그룹을 켬 */
function ensureGroupOnWidget(
  widgetKey: string,
  groupIds: string[],
  state: Record<string, string[]>
): string[] {
  const allProgramIds = getAllProgramIdsForWidget(widgetKey)
  const currentIds = state[widgetKey] ?? []
  if (currentIds.length === 0) {
    return []
  }
  const groupOn = groupIds.every(id => currentIds.includes(id))
  if (groupOn) {
    return currentIds
  }
  const next = [...new Set([...currentIds, ...groupIds])]
  const allSelected = allProgramIds.every(id => next.includes(id))
  return allSelected ? [] : next
}

export function DashboardSettingsModal({ open, onCancel }: DashboardSettingsModalProps) {
  const user = useAuthStore(s => s.user)

  const visibleWidgetEntries = useMemo(() => {
    const widgets = getDashboardWidgetsForUser(user ?? null)
    const allowed = new Set<DashboardWidgetType>(widgets.map(w => w.type))
    return WIDGET_PROGRAM_KEYS.filter(w => allowed.has(w.key as DashboardWidgetType))
  }, [user])

  const visibleWidgetKeys = useMemo(
    () => visibleWidgetEntries.map(w => w.key),
    [visibleWidgetEntries]
  )

  const widgetLabelByKey = useMemo(
    () => Object.fromEntries(WIDGET_PROGRAM_KEYS.map(w => [w.key, w.label])),
    []
  )

  const unifiedRows = useMemo(
    () => buildUnifiedProgramRows(visibleWidgetKeys),
    [visibleWidgetKeys]
  )

  /** 스토어에 반영 전 편집본 — 적용 전까지 대시보드 위젯은 변경되지 않음 */
  const [draftShortcutEnabled, setDraftShortcutEnabled] = useState<Record<string, boolean> | null>(
    null
  )
  const [draftWidgetProgramIds, setDraftWidgetProgramIds] = useState<Record<
    string,
    string[]
  > | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setDraftShortcutEnabled(null)
      setDraftWidgetProgramIds(null)
      return
    }
    const s = useDashboardSettingsStore.getState()
    setDraftShortcutEnabled({ ...s.shortcutEnabled })
    setDraftWidgetProgramIds(cloneWidgetProgramIds(s.widgetProgramIds))
  }, [open])

  const shortcutEnabled =
    draftShortcutEnabled ?? useDashboardSettingsStore.getState().shortcutEnabled
  const widgetProgramIds =
    draftWidgetProgramIds ?? useDashboardSettingsStore.getState().widgetProgramIds

  const setDraftShortcut = useCallback((id: string, enabled: boolean) => {
    setDraftShortcutEnabled(prev => {
      const base = prev ?? { ...useDashboardSettingsStore.getState().shortcutEnabled }
      return { ...base, [id]: enabled }
    })
  }, [])

  /** 전체 선택: 메뉴 바로가기 항목이 아님 — 모든 바로가기 id를 켜거나 끔 */
  const setAllDraftShortcuts = useCallback((enabled: boolean) => {
    setDraftShortcutEnabled(prev => {
      const base = prev ?? { ...useDashboardSettingsStore.getState().shortcutEnabled }
      const next = { ...base }
      for (const item of SHORTCUT_ITEMS) {
        next[item.id] = enabled
      }
      return next
    })
  }, [])

  const shortcutAllEnabled = useMemo(
    () => SHORTCUT_ITEMS.every(item => isShortcutItemEnabled(shortcutEnabled, item.id)),
    [shortcutEnabled]
  )
  const shortcutAllIndeterminate = useMemo(() => {
    const anyOn = SHORTCUT_ITEMS.some(item => isShortcutItemEnabled(shortcutEnabled, item.id))
    return anyOn && !shortcutAllEnabled
  }, [shortcutAllEnabled, shortcutEnabled])

  const setDraftWidgetProgramIdsForKey = useCallback((widgetKey: string, programIds: string[]) => {
    setDraftWidgetProgramIds(prev => {
      const base =
        prev ?? cloneWidgetProgramIds(useDashboardSettingsStore.getState().widgetProgramIds)
      return { ...base, [widgetKey]: programIds }
    })
  }, [])

  const isTitleGroupSelected = useCallback(
    (widgetKey: string, groupIds: string[]) => {
      const ids = widgetProgramIds[widgetKey]
      if (!ids || ids.length === 0) return true
      return groupIds.every(id => ids.includes(id))
    },
    [widgetProgramIds]
  )

  const handleTitleGroupToggle = useCallback(
    (widgetKey: string, groupIds: string[]) => {
      const allProgramIds = getAllProgramIdsForWidget(widgetKey)
      const currentIds = widgetProgramIds[widgetKey] ?? []
      const groupOn = groupIds.every(id => currentIds.includes(id))

      if (currentIds.length === 0) {
        setDraftWidgetProgramIdsForKey(
          widgetKey,
          allProgramIds.filter(id => !groupIds.includes(id))
        )
        return
      }

      if (groupOn) {
        const remaining = currentIds.filter(id => !groupIds.includes(id))
        setDraftWidgetProgramIdsForKey(widgetKey, remaining)
        return
      }

      const next = [...new Set([...currentIds, ...groupIds])]
      const allSelected = allProgramIds.every(id => next.includes(id))
      setDraftWidgetProgramIdsForKey(widgetKey, allSelected ? [] : next)
    },
    [widgetProgramIds, setDraftWidgetProgramIdsForKey]
  )

  const isMasterRowSelected = useCallback(
    (row: UnifiedProgramRow) => {
      const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
      if (keys.length === 0) return true
      return keys.every(wk => isTitleGroupSelected(wk, row.idsByWidget[wk]!))
    },
    [isTitleGroupSelected, visibleWidgetKeys]
  )

  const isMasterRowIndeterminate = useCallback(
    (row: UnifiedProgramRow) => {
      const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
      if (keys.length === 0) return false
      const selected = keys.filter(wk => isTitleGroupSelected(wk, row.idsByWidget[wk]!))
      return selected.length > 0 && selected.length < keys.length
    },
    [isTitleGroupSelected, visibleWidgetKeys]
  )

  const handleMasterRowToggle = useCallback(
    (row: UnifiedProgramRow, turnOn: boolean) => {
      setDraftWidgetProgramIds(prev => {
        const base =
          prev ?? cloneWidgetProgramIds(useDashboardSettingsStore.getState().widgetProgramIds)
        const next = cloneWidgetProgramIds(base)
        const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
        for (const wk of keys) {
          const gids = row.idsByWidget[wk]!
          next[wk] = turnOn ? ensureGroupOnWidget(wk, gids, next) : ensureGroupOffWidget(wk, gids, next)
        }
        return next
      })
    },
    [visibleWidgetKeys]
  )

  const handleApply = useCallback(() => {
    const s = useDashboardSettingsStore.getState()
    const nextShortcut = draftShortcutEnabled ?? s.shortcutEnabled
    const nextWidgetIds = draftWidgetProgramIds ?? s.widgetProgramIds
    useDashboardSettingsStore.setState({
      shortcutEnabled: { ...nextShortcut },
      widgetProgramIds: cloneWidgetProgramIds(nextWidgetIds),
    })
    onCancel()
  }, [draftShortcutEnabled, draftWidgetProgramIds, onCancel])

  const footer = (
    <>
      <AppButton variant="cancel" onClick={onCancel}>
        닫기
      </AppButton>
      <AppButton variant="primary" onClick={handleApply}>
        설정
      </AppButton>
    </>
  )

  const collapseDefaultKey = unifiedRows[0]?.title

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="대시보드 설정"
      width={800}
      className="dashboard-settings-content-modal"
      footer={footer}
    >
      <div className="dashboard-settings-modal__content">
        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">바로가기 아이콘 설정</div>
          <div className="dashboard-settings-modal__shortcuts">
            <Checkbox
              checked={shortcutAllEnabled}
              indeterminate={shortcutAllIndeterminate}
              onChange={e => setAllDraftShortcuts(e.target.checked)}
            >
              전체 선택
            </Checkbox>
            {SHORTCUT_ITEMS.map(item => (
              <Checkbox
                key={item.id}
                checked={isShortcutItemEnabled(shortcutEnabled, item.id)}
                onChange={e => setDraftShortcut(item.id, e.target.checked)}
              >
                {item.label}
              </Checkbox>
            ))}
          </div>
        </section>

        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">위젯 별 프로그램 설정</div>
          {visibleWidgetEntries.length === 0 || unifiedRows.length === 0 ? (
            <div className="dashboard-settings-modal__program-empty">
              이 계정의 대시보드에서 설정할 프로그램 위젯이 없습니다.
            </div>
          ) : (
            <Collapse
              bordered={false}
              defaultActiveKey={collapseDefaultKey}
              expandIconPosition="end"
              expandIcon={({ isActive }) => (
                <span
                  className={`dashboard-settings-modal__collapse-chevron${isActive ? ' dashboard-settings-modal__collapse-chevron--expanded' : ''}`}
                  aria-hidden
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M15.4419 12.0581C15.686 12.3021 15.686 12.6978 15.4419 12.9418C15.1979 13.1859 14.8022 13.1859 14.5582 12.9418L10 8.38374L5.44194 12.9418C5.19787 13.1859 4.80223 13.1859 4.55815 12.9418C4.31408 12.6978 4.31408 12.3021 4.55815 12.0581L9.55815 7.05806C9.80223 6.81398 10.1979 6.81398 10.4419 7.05806L15.4419 12.0581Z"
                      fill="#85969D"
                    />
                  </svg>
                </span>
              )}
              className="dashboard-settings-modal__program-collapse"
              items={unifiedRows.map(row => ({
                key: row.title,
                label: (
                  <div className="dashboard-settings-modal__accordion-header">
                    <div className="dashboard-settings-modal__accordion-header-main">
                      <span
                        className="dashboard-settings-modal__accordion-check-wrap"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isMasterRowSelected(row)}
                          indeterminate={isMasterRowIndeterminate(row)}
                          onChange={e => handleMasterRowToggle(row, e.target.checked)}
                        />
                      </span>
                      <span className="dashboard-settings-modal__accordion-title" title={row.title}>
                        {row.title}
                      </span>
                    </div>
                  </div>
                ),
                children: (
                  <div className="dashboard-settings-modal__accordion-body">
                    {visibleWidgetEntries.flatMap(({ key: widgetKey }) => {
                      const gids = row.idsByWidget[widgetKey]
                      if (!gids?.length) return []
                      return [
                        <Checkbox
                          key={widgetKey}
                          checked={isTitleGroupSelected(widgetKey, gids)}
                          onChange={() => handleTitleGroupToggle(widgetKey, gids)}
                        >
                          {widgetLabelByKey[widgetKey] ?? widgetKey}
                        </Checkbox>,
                      ]
                    })}
                  </div>
                ),
              }))}
            />
          )}
        </section>
      </div>
    </ContentModal>
  )
}
