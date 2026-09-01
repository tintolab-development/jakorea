/**
 * 대시보드 설정 모달
 * - 바로가기 아이콘 설정 (체크박스)
 * - 위젯 별 프로그램 설정 (프로그램별 아코디언 + 위젯별 체크)
 * ContentModal(흰 헤더), 800×최대 720px(뷰포트 안), 바디 스크롤
 */

import { Checkbox, Collapse, Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getDashboardWidgetsForUser, type DashboardWidgetType } from '@/shared/config/dashboard-config'
import {
  useDashboardSettingsStore,
  SHORTCUT_ITEMS,
  WIDGET_PROGRAM_KEYS,
  isShortcutItemEnabled,
  DASHBOARD_HOME_PATH,
} from '../model/dashboard-settings-store'
import { useSaveDashboardPreferences } from '../hooks/use-dashboard-preferences'
import { getDashboardProgramOptions } from '../api/admin-dashboard-service'
import { useDashboardQueryScope } from '../hooks/use-dashboard-query-scope'
import { getMockDashboardProgramOptions } from '../api/dashboard-program-options-mock'
import { dashboardQueryKeys } from '../api/dashboard-query-keys'
import { useDashboardShortcuts } from '../hooks/use-dashboard-shortcuts'
import {
  buildUnifiedProgramRows,
  getAllProgramIdsForWidget,
  isWidgetProgramGroupIndeterminate,
  isWidgetProgramGroupSelected,
  setWidgetProgramGroupSelected,
  type ProgramSettingRow,
} from '../lib/widget-program-filter'
import './dashboard-settings-modal.css'
import { CmsButton } from '@/shared/ui'

export interface DashboardSettingsModalProps {
  open: boolean
  onCancel: () => void
  /** 기본 레이아웃으로 되돌리기 (순서·너비 초기화) */
  onResetLayout?: () => void
}

function cloneWidgetProgramIds(src: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, [...v]]))
}

function widgetKeysForProgramRow(row: ProgramSettingRow, visibleWidgetKeys: readonly string[]) {
  return visibleWidgetKeys.filter(wk => (row.idsByWidget[wk]?.length ?? 0) > 0)
}

function IsolatedCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  children,
}: {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
}) {
  const id = useId()
  return (
    <Checkbox
      id={id}
      checked={checked}
      indeterminate={indeterminate}
      onChange={e => {
        e.stopPropagation()
        onCheckedChange(e.target.checked)
      }}
    >
      {children}
    </Checkbox>
  )
}

function setWidgetTitleGroup(
  widgetKey: string,
  groupIds: string[],
  state: Record<string, string[]>,
  catalog: Record<string, { id: string; title: string }[]>,
  selected: boolean
): string[] {
  return setWidgetProgramGroupSelected(
    state[widgetKey],
    groupIds,
    getAllProgramIdsForWidget(catalog, widgetKey),
    selected
  )
}

export function DashboardSettingsModal({ open, onCancel }: DashboardSettingsModalProps) {
  const user = useAuthStore(s => s.user)
  const assignedProgramTypes = useDashboardSettingsStore(s => s.assignedProgramTypes)
  const { mutate: persistPreferences } = useSaveDashboardPreferences()
  const queryScope = useDashboardQueryScope()
  const useRemote = queryScope === 'remote'
  const { data: apiShortcuts } = useDashboardShortcuts(open && useRemote)

  const visibleWidgetEntries = useMemo(() => {
    const widgets = getDashboardWidgetsForUser(user ?? null, assignedProgramTypes)
    const allowed = new Set<DashboardWidgetType>(widgets.map(w => w.type))
    return WIDGET_PROGRAM_KEYS.filter(w => allowed.has(w.key as DashboardWidgetType))
  }, [user, assignedProgramTypes])

  const visibleWidgetKeys = useMemo(
    () => visibleWidgetEntries.map(w => w.key),
    [visibleWidgetEntries]
  )

  const widgetLabelByKey = useMemo(
    () => Object.fromEntries(WIDGET_PROGRAM_KEYS.map(w => [w.key, w.label])),
    []
  )

  const programOptionQueries = useQueries({
    queries: visibleWidgetKeys.map(widgetKey => ({
      queryKey: dashboardQueryKeys.programOptions(queryScope, widgetKey),
      queryFn: () => getDashboardProgramOptions(widgetKey),
      enabled: open && useRemote,
      staleTime: 60_000,
      retry: false,
    })),
  })

  const programsCatalogLoading =
    useRemote &&
    visibleWidgetKeys.length > 0 &&
    (programOptionQueries.length < visibleWidgetKeys.length ||
      programOptionQueries.some(q => q.isPending || q.isFetching))

  const programCatalog = useMemo(() => {
    if (!useRemote) {
      const catalog: Record<string, { id: string; title: string }[]> = {}
      visibleWidgetKeys.forEach(widgetKey => {
        catalog[widgetKey] = getMockDashboardProgramOptions(widgetKey)
      })
      return catalog
    }

    if (programsCatalogLoading) {
      return null
    }

    const catalog: Record<string, { id: string; title: string }[]> = {}
    visibleWidgetKeys.forEach((widgetKey, index) => {
      const query = programOptionQueries[index]
      catalog[widgetKey] =
        query?.isSuccess && query.data ? query.data : getMockDashboardProgramOptions(widgetKey)
    })
    return catalog
  }, [visibleWidgetKeys, useRemote, programsCatalogLoading, programOptionQueries])

  const shortcutCatalogItems = useMemo(() => {
    if (!useRemote || !apiShortcuts?.length) {
      return SHORTCUT_ITEMS
    }
    const localById = new Map(SHORTCUT_ITEMS.map(item => [item.id, item]))
    return apiShortcuts.map(item => ({
      id: item.id,
      label: item.label || localById.get(item.id)?.label || item.id,
      path: item.path || localById.get(item.id)?.path || DASHBOARD_HOME_PATH,
    }))
  }, [useRemote, apiShortcuts])

  const unifiedRows = useMemo(() => {
    if (!programCatalog) return []
    return buildUnifiedProgramRows(visibleWidgetKeys, programCatalog)
  }, [visibleWidgetKeys, programCatalog])

  /** 스토어에 반영 전 편집본 — 적용 전까지 대시보드 위젯은 변경되지 않음 */
  const [draftShortcutEnabled, setDraftShortcutEnabled] = useState<Record<string, boolean> | null>(
    null
  )
  const [programCollapseActiveKey, setProgramCollapseActiveKey] = useState<string[]>([])
  /** 모달 open 직후 첫 행만 1회 펼침 — 사용자가 모두 닫은 뒤에는 다시 강제 열지 않음 */
  const didInitProgramCollapseRef = useRef(false)
  const [draftWidgetProgramIds, setDraftWidgetProgramIds] = useState<Record<
    string,
    string[]
  > | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setDraftShortcutEnabled(null)
      setDraftWidgetProgramIds(null)
      setProgramCollapseActiveKey([])
      didInitProgramCollapseRef.current = false
      return
    }
    const s = useDashboardSettingsStore.getState()
    setDraftShortcutEnabled({ ...s.shortcutEnabled })
    setDraftWidgetProgramIds(cloneWidgetProgramIds(s.widgetProgramIds))
  }, [open])

  useLayoutEffect(() => {
    if (!open || programsCatalogLoading || unifiedRows.length === 0) return
    if (didInitProgramCollapseRef.current) return
    didInitProgramCollapseRef.current = true
    setProgramCollapseActiveKey([unifiedRows[0]!.title])
  }, [open, programsCatalogLoading, unifiedRows])

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
      for (const item of shortcutCatalogItems) {
        next[item.id] = enabled
      }
      return next
    })
  }, [shortcutCatalogItems])

  const shortcutAllEnabled = useMemo(
    () => shortcutCatalogItems.every(item => isShortcutItemEnabled(shortcutEnabled, item.id)),
    [shortcutCatalogItems, shortcutEnabled]
  )
  const shortcutAllIndeterminate = useMemo(() => {
    const anyOn = shortcutCatalogItems.some(item => isShortcutItemEnabled(shortcutEnabled, item.id))
    return anyOn && !shortcutAllEnabled
  }, [shortcutAllEnabled, shortcutCatalogItems, shortcutEnabled])

  const isTitleGroupSelected = useCallback(
    (widgetKey: string, groupIds: string[]) =>
      isWidgetProgramGroupSelected(widgetProgramIds[widgetKey], groupIds),
    [widgetProgramIds]
  )

  const isTitleGroupIndeterminate = useCallback(
    (widgetKey: string, groupIds: string[]) =>
      isWidgetProgramGroupIndeterminate(widgetProgramIds[widgetKey], groupIds),
    [widgetProgramIds]
  )

  const handleTitleGroupToggle = useCallback(
    (widgetKey: string, groupIds: string[], selected: boolean) => {
      if (!programCatalog) return
      setDraftWidgetProgramIds(prev => {
        const base =
          prev ?? cloneWidgetProgramIds(useDashboardSettingsStore.getState().widgetProgramIds)
        return {
          ...base,
          [widgetKey]: setWidgetProgramGroupSelected(
            base[widgetKey],
            groupIds,
            getAllProgramIdsForWidget(programCatalog, widgetKey),
            selected
          ),
        }
      })
    },
    [programCatalog]
  )

  const isMasterRowSelected = useCallback(
    (row: ProgramSettingRow) => {
      const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
      if (keys.length === 0) return true
      return keys.every(wk => isTitleGroupSelected(wk, row.idsByWidget[wk]!))
    },
    [isTitleGroupSelected, visibleWidgetKeys]
  )

  const isMasterRowIndeterminate = useCallback(
    (row: ProgramSettingRow) => {
      const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
      if (keys.length === 0) return false
      const selected = keys.filter(wk => isTitleGroupSelected(wk, row.idsByWidget[wk]!))
      return selected.length > 0 && selected.length < keys.length
    },
    [isTitleGroupSelected, visibleWidgetKeys]
  )

  const handleMasterRowToggle = useCallback(
    (row: ProgramSettingRow, turnOn: boolean) => {
      if (!programCatalog) return
      setDraftWidgetProgramIds(prev => {
        const base =
          prev ?? cloneWidgetProgramIds(useDashboardSettingsStore.getState().widgetProgramIds)
        const next = cloneWidgetProgramIds(base)
        const keys = widgetKeysForProgramRow(row, visibleWidgetKeys)
        for (const wk of keys) {
          const gids = row.idsByWidget[wk]!
          next[wk] = setWidgetTitleGroup(wk, gids, next, programCatalog, turnOn)
        }
        return next
      })
    },
    [visibleWidgetKeys, programCatalog]
  )

  const handleProgramCollapseChange = useCallback((keys: string[] | string) => {
    setProgramCollapseActiveKey(Array.isArray(keys) ? keys : keys ? [keys] : [])
  }, [])

  const handleApply = useCallback(() => {
    const s = useDashboardSettingsStore.getState()
    const nextShortcut = draftShortcutEnabled ?? s.shortcutEnabled
    const nextWidgetIds = draftWidgetProgramIds ?? s.widgetProgramIds
    useDashboardSettingsStore.setState({
      shortcutEnabled: { ...nextShortcut },
      widgetProgramIds: cloneWidgetProgramIds(nextWidgetIds),
    })
    if (useRemote) {
      persistPreferences(undefined)
    }
    onCancel()
  }, [draftShortcutEnabled, draftWidgetProgramIds, onCancel, persistPreferences])

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onCancel}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={handleApply}>
        설정
      </CmsButton>
    </>
  )

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
            {shortcutCatalogItems.map(item => (
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
          {programsCatalogLoading ? (
            <div className="dashboard-settings-modal__program-loading">
              <Spin />
            </div>
          ) : visibleWidgetEntries.length === 0 || unifiedRows.length === 0 ? (
            <div className="dashboard-settings-modal__program-empty">
              이 계정의 대시보드에서 설정할 프로그램 위젯이 없습니다.
            </div>
          ) : (
            <Collapse
              bordered={false}
              activeKey={programCollapseActiveKey}
              onChange={handleProgramCollapseChange}
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
                        <IsolatedCheckbox
                          checked={isMasterRowSelected(row)}
                          indeterminate={isMasterRowIndeterminate(row)}
                          onCheckedChange={checked => handleMasterRowToggle(row, checked)}
                        />
                      </span>
                      <span className="dashboard-settings-modal__accordion-title" title={row.title}>
                        {row.title}
                      </span>
                    </div>
                  </div>
                ),
                children: (
                  <div
                    className="dashboard-settings-modal__accordion-body"
                    data-program-row={row.title}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {visibleWidgetEntries.flatMap(({ key: widgetKey }) => {
                      const gids = row.idsByWidget[widgetKey]
                      if (!gids?.length) return []
                      return [
                        <IsolatedCheckbox
                          key={`${row.title}::${widgetKey}`}
                          checked={isTitleGroupSelected(widgetKey, gids)}
                          indeterminate={isTitleGroupIndeterminate(widgetKey, gids)}
                          onCheckedChange={checked =>
                            handleTitleGroupToggle(widgetKey, gids, checked)
                          }
                        >
                          {widgetLabelByKey[widgetKey] ?? widgetKey}
                        </IsolatedCheckbox>,
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
