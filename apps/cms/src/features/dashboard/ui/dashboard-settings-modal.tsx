/**
 * 대시보드 설정 모달
 * - 바로가기 아이콘 설정 (체크박스)
 * - 위젯 별 프로그램 설정 (프로그램별 아코디언 + 위젯별 체크)
 * ContentModal(흰 헤더), 800×최대 720px(뷰포트 안), 바디 스크롤
 */

import { Collapse, Spin } from 'antd'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getDashboardWidgetsForUser,
  type DashboardWidgetType,
} from '@/shared/config/dashboard-config'
import {
  useDashboardSettingsStore,
  WIDGET_PROGRAM_KEYS,
  isShortcutItemEnabled,
  normalizeShortcutVisibilityForSave,
} from '../model/dashboard-settings-store'
import { isDashboardShortcutSettingsDisabled } from '../model/dashboard-shortcut-contract'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { isCmsMasterAdminRole } from '@/shared/lib/cms-global-role-code'
import { useDashboardShortcuts } from '../hooks/use-dashboard-shortcuts'
import { useSyncDashboardShortcutCatalog } from '../hooks/use-sync-dashboard-shortcut-catalog'
import { mapDashboardShortcutSettingsCatalogItems } from '../lib/resolve-dashboard-shortcut-items'
import { useSaveDashboardPreferences } from '../hooks/use-dashboard-preferences'
import { getDashboardProgramOptionsFromRecruitmentList } from '../api/admin-dashboard-service'
import { useDashboardRecruitmentsCatalog } from '@/features/dashboard/hooks/use-dashboard-recruitments-catalog'
import { useDashboardQueryScope } from '../hooks/use-dashboard-query-scope'
import {
  buildUnifiedProgramRows,
  getAllProgramIdsForWidget,
  isWidgetProgramGroupIndeterminate,
  isWidgetProgramGroupSelected,
  setWidgetProgramGroupSelected,
  widgetProgramMinSelectionMessage,
  wouldLeaveWidgetWithoutPrograms,
  type ProgramSettingRow,
} from '../lib/widget-program-filter'
import './dashboard-settings-modal.css'
import { CmsButton, showSaveCompletedAlert } from '@/shared/ui'

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
    <CmsCheckbox
      checkboxSize="medium"
      id={id}
      checked={checked}
      indeterminate={indeterminate}
      onChange={e => {
        e.stopPropagation()
        onCheckedChange(e.target.checked)
      }}
    >
      {children}
    </CmsCheckbox>
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
  // 마스터는 설정 불가 6건도 설정 가능 — 활성 여부는 BE permissionAllowed로만 판정
  const isMasterSession = isCmsMasterAdminRole(useSessionAdminRoleCode())
  const shortcutSession = useMemo(() => ({ isMaster: isMasterSession }), [isMasterSession])
  const assignedProgramTypes = useDashboardSettingsStore(s => s.assignedProgramTypes)
  const { mutateAsync: persistPreferences, isPending: isSavingRemote } =
    useSaveDashboardPreferences()
  const [isSavingLocal, setIsSavingLocal] = useState(false)
  const isSaving = isSavingRemote || isSavingLocal
  const queryScope = useDashboardQueryScope()
  const useRemote = queryScope === 'remote'
  useSyncDashboardShortcutCatalog(open && useRemote)
  const shortcutsQuery = useDashboardShortcuts(open && useRemote)
  const shortcutCatalogKeys = useDashboardSettingsStore(s => s.shortcutCatalogKeys)
  const shortcutsCatalogLoading =
    useRemote && shortcutsQuery.isPending && shortcutsQuery.data === undefined
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

  const recruitmentsCatalogQuery = useDashboardRecruitmentsCatalog(open && useRemote)

  const programsCatalogLoading =
    useRemote &&
    visibleWidgetKeys.length > 0 &&
    (recruitmentsCatalogQuery.isPending ||
      (recruitmentsCatalogQuery.isFetching && recruitmentsCatalogQuery.data === undefined))

  const programCatalog = useMemo(() => {
    if (!useRemote) {
      const catalog: Record<string, { id: string; title: string }[]> = {}
      visibleWidgetKeys.forEach(widgetKey => {
        catalog[widgetKey] = []
      })
      return catalog
    }

    if (programsCatalogLoading || recruitmentsCatalogQuery.data === undefined) {
      return null
    }

    const catalog: Record<string, { id: string; title: string }[]> = {}
    const dto = recruitmentsCatalogQuery.data
    visibleWidgetKeys.forEach(widgetKey => {
      catalog[widgetKey] = getDashboardProgramOptionsFromRecruitmentList(widgetKey, dto)
    })
    return catalog
  }, [
    visibleWidgetKeys,
    useRemote,
    programsCatalogLoading,
    recruitmentsCatalogQuery.data,
  ])

  const shortcutCatalogItems = useMemo(
    () => mapDashboardShortcutSettingsCatalogItems(shortcutsQuery.data, shortcutSession),
    [shortcutSession, shortcutsQuery.data]
  )

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
  /** QA-0020 — 마지막 프로그램 해제가 막혔을 때 사유 */
  const [programMinSelectionNotice, setProgramMinSelectionNotice] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setDraftShortcutEnabled(null)
      setDraftWidgetProgramIds(null)
      setProgramCollapseActiveKey([])
      setProgramMinSelectionNotice(null)
      didInitProgramCollapseRef.current = false
      setIsSavingLocal(false)
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

  const setDraftShortcut = useCallback(
    (id: string, enabled: boolean) => {
      if (isDashboardShortcutSettingsDisabled(id, shortcutSession)) return
      const catalogItem = shortcutCatalogItems.find(item => item.id === id)
      if (catalogItem != null && !catalogItem.permissionAllowed) return
      setDraftShortcutEnabled(prev => {
        const base = prev ?? { ...useDashboardSettingsStore.getState().shortcutEnabled }
        return { ...base, [id]: enabled }
      })
    },
    [shortcutCatalogItems, shortcutSession]
  )

  const selectableCatalogItems = useMemo(
    () =>
      shortcutCatalogItems.filter(
        item => !item.settingsDisabled && item.permissionAllowed
      ),
    [shortcutCatalogItems]
  )

  /** 전체 선택: 메뉴 바로가기 항목이 아님 — selectable 바로가기 id만 켜거나 끔 */
  const setAllDraftShortcuts = useCallback(
    (enabled: boolean) => {
      setDraftShortcutEnabled(prev => {
        const base = prev ?? { ...useDashboardSettingsStore.getState().shortcutEnabled }
        const next = { ...base }
        for (const item of selectableCatalogItems) {
          next[item.id] = enabled
        }
        return next
      })
    },
    [selectableCatalogItems]
  )

  const shortcutAllEnabled = useMemo(
    () =>
      selectableCatalogItems.length > 0 &&
      selectableCatalogItems.every(item => isShortcutItemEnabled(shortcutEnabled, item.id)),
    [selectableCatalogItems, shortcutEnabled]
  )
  const shortcutAllIndeterminate = useMemo(() => {
    const anyOn = selectableCatalogItems.some(item =>
      isShortcutItemEnabled(shortcutEnabled, item.id)
    )
    return anyOn && !shortcutAllEnabled
  }, [shortcutAllEnabled, selectableCatalogItems, shortcutEnabled])

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
      if (
        !selected &&
        wouldLeaveWidgetWithoutPrograms(
          widgetProgramIds[widgetKey],
          groupIds,
          getAllProgramIdsForWidget(programCatalog, widgetKey)
        )
      ) {
        setProgramMinSelectionNotice(
          widgetProgramMinSelectionMessage([widgetLabelByKey[widgetKey] ?? widgetKey])
        )
        return
      }
      setProgramMinSelectionNotice(null)
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
    [programCatalog, widgetLabelByKey, widgetProgramIds]
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
      // 끄기: 그 행이 위젯의 마지막 선택이면 해당 위젯은 유지되고(setWidgetProgramGroupSelected) 사유를 보인다
      const blockedLabels = turnOn
        ? []
        : widgetKeysForProgramRow(row, visibleWidgetKeys)
            .filter(wk =>
              wouldLeaveWidgetWithoutPrograms(
                widgetProgramIds[wk],
                row.idsByWidget[wk]!,
                getAllProgramIdsForWidget(programCatalog, wk)
              )
            )
            .map(wk => widgetLabelByKey[wk] ?? wk)
      setProgramMinSelectionNotice(
        blockedLabels.length > 0 ? widgetProgramMinSelectionMessage(blockedLabels) : null
      )
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
    [visibleWidgetKeys, programCatalog, widgetLabelByKey, widgetProgramIds]
  )

  const handleProgramCollapseChange = useCallback((keys: string[] | string) => {
    setProgramCollapseActiveKey(Array.isArray(keys) ? keys : keys ? [keys] : [])
  }, [])

  const handleDismiss = useCallback(() => {
    if (isSaving) return
    onCancel()
  }, [isSaving, onCancel])

  const handleApply = useCallback(() => {
    if (isSaving) return
    const s = useDashboardSettingsStore.getState()
    const raw = draftShortcutEnabled ?? s.shortcutEnabled
    const catalogKeys =
      shortcutCatalogKeys ??
      (shortcutCatalogItems.length > 0 ? shortcutCatalogItems.map(item => item.id) : null)
    const nextShortcut = normalizeShortcutVisibilityForSave(raw, catalogKeys, shortcutSession)
    const nextWidgetIds = draftWidgetProgramIds ?? s.widgetProgramIds
    const prevShortcut = { ...s.shortcutEnabled }
    const prevWidgetIds = cloneWidgetProgramIds(s.widgetProgramIds)
    void (async () => {
      setIsSavingLocal(true)
      try {
        useDashboardSettingsStore.setState({
          shortcutEnabled: nextShortcut,
          widgetProgramIds: cloneWidgetProgramIds(nextWidgetIds),
        })
        if (useRemote) {
          await persistPreferences(undefined)
        }
        onCancel()
        showSaveCompletedAlert()
      } catch {
        useDashboardSettingsStore.setState({
          shortcutEnabled: prevShortcut,
          widgetProgramIds: prevWidgetIds,
        })
        // axios 글로벌 에러 Alert가 실패 사유를 이미 노출한다.
      } finally {
        setIsSavingLocal(false)
      }
    })()
  }, [
    draftShortcutEnabled,
    draftWidgetProgramIds,
    isSaving,
    onCancel,
    persistPreferences,
    shortcutCatalogItems,
    shortcutCatalogKeys,
    shortcutSession,
    useRemote,
  ])

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleDismiss} disabled={isSaving}>
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        adminAction="dashboardWrite"
        onClick={handleApply}
        loading={isSaving} >
        저장
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleDismiss}
      title="대시보드 설정"
      width={800}
      className="dashboard-settings-content-modal"
      footer={footer}
    >
      <div className="dashboard-settings-modal__content">
        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">바로가기 아이콘 설정</div>
          <div className="dashboard-settings-modal__shortcuts">
            {/* 시안: 라벨 16/Medium · 행 간격 37 (large 체크박스 20 + 라벨 130% · gap 16) */}
            <CmsCheckbox
              checkboxSize="large"
              checked={shortcutAllEnabled}
              indeterminate={shortcutAllIndeterminate}
              onChange={e => setAllDraftShortcuts(e.target.checked)}
            >
              전체 선택
            </CmsCheckbox>
            {shortcutsCatalogLoading ? (
              <Spin size="small" />
            ) : (
              shortcutCatalogItems.map(item => {
                const rowDisabled = item.settingsDisabled || !item.permissionAllowed
                return (
                  <CmsCheckbox
                    checkboxSize="large"
                    key={item.id}
                    checked={
                      rowDisabled ? false : isShortcutItemEnabled(shortcutEnabled, item.id)
                    }
                    disabled={rowDisabled}
                    onChange={e => setDraftShortcut(item.id, e.target.checked)}
                  >
                    {item.label}
                  </CmsCheckbox>
                )
              })
            )}
          </div>
        </section>

        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">위젯 별 프로그램 설정</div>
          {programMinSelectionNotice ? (
            <div className="dashboard-settings-modal__program-notice" role="alert">
              {programMinSelectionNotice}
            </div>
          ) : null}
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
                      fill="#9FAFB5"
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
