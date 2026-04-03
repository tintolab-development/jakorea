/**
 * 대시보드 설정 모달
 * - 바로가기 아이콘 설정 (17개 체크박스)
 * - 위젯 별 프로그램 설정 (4개 위젯 × 프로그램 체크박스)
 * TealHeaderModal 재사용, 800×720px, 바디 스크롤
 */

import { Checkbox, Table } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useCallback, useLayoutEffect, useState } from 'react'
import {
  useDashboardSettingsStore,
  SHORTCUT_ITEMS,
  WIDGET_PROGRAM_KEYS,
} from '../model/dashboard-settings-store'
import { mockPrograms } from '@/data/mock'
import './dashboard-settings-modal.css'
import { AppButton } from '@/shared/ui'

export interface DashboardSettingsModalProps {
  open: boolean
  onCancel: () => void
  /** 기본 레이아웃으로 되돌리기 (순서·너비 초기화) */
  onResetLayout?: () => void
}

const programRows = mockPrograms.map(p => ({ id: p.id, title: p.title }))
const allProgramIds = programRows.map(p => p.id)

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

const programTitleGroups = buildProgramTitleGroups(programRows)

function cloneWidgetProgramIds(src: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, [...v]]))
}

export function DashboardSettingsModal({ open, onCancel }: DashboardSettingsModalProps) {
  /** 스토어에 반영 전 편집본 — 저장하기 전까지 대시보드 위젯은 변경되지 않음 */
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

  const handleSave = useCallback(() => {
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
      <AppButton variant="primary" onClick={handleSave}>
        저장
      </AppButton>
    </>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="대시보드 설정"
      width={800}
      className="teal-header-modal--dashboard-settings"
      footer={footer}
    >
      <div className="dashboard-settings-modal__content">
        {/* 섹션 1: 바로가기 아이콘 설정 */}
        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">바로가기 아이콘 설정</div>
          <div className="dashboard-settings-modal__shortcuts">
            {SHORTCUT_ITEMS.map(item => (
              <Checkbox
                key={item.id}
                checked={!!shortcutEnabled[item.id]}
                onChange={e => setDraftShortcut(item.id, e.target.checked)}
              >
                {item.label}
              </Checkbox>
            ))}
          </div>
        </section>

        {/* 섹션 2: 위젯 별 프로그램 설정 */}
        <section className="dashboard-settings-modal__section">
          <div className="dashboard-settings-modal__section-title">위젯 별 프로그램 설정</div>
          <Table
            className="dashboard-settings-modal__table"
            dataSource={WIDGET_PROGRAM_KEYS.map((w, index) => ({
              key: w.key,
              widgetLabel: w.label,
              widgetKey: w.key,
              index,
            }))}
            columns={[
              {
                title: '',
                dataIndex: 'widgetLabel',
                key: 'widgetLabel',
                width: 180,
                render: (text: string) => (
                  <span className="dashboard-settings-modal__widget-label">{text}</span>
                ),
              },
              {
                title: '',
                key: 'programs',
                render: (_: unknown, record: { widgetKey: string }) => (
                  <div className="dashboard-settings-modal__program-checks">
                    {programTitleGroups.map(group => (
                      <Checkbox
                        key={group.title}
                        checked={isTitleGroupSelected(record.widgetKey, group.ids)}
                        onChange={() => handleTitleGroupToggle(record.widgetKey, group.ids)}
                      >
                        {group.title}
                      </Checkbox>
                    ))}
                  </div>
                ),
              },
            ]}
            pagination={false}
            showHeader={false}
            bordered
          />
        </section>
      </div>
    </TealHeaderModal>
  )
}
