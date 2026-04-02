/**
 * 대시보드 설정 모달
 * - 바로가기 아이콘 설정 (17개 체크박스)
 * - 위젯 별 프로그램 설정 (4개 위젯 × 프로그램 체크박스)
 * TealHeaderModal 재사용, 800×720px, 바디 스크롤
 */

import { Checkbox, Table } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useCallback } from 'react'
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

export function DashboardSettingsModal({ open, onCancel }: DashboardSettingsModalProps) {
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const setShortcutEnabled = useDashboardSettingsStore(s => s.setShortcutEnabled)
  const setWidgetProgramIds = useDashboardSettingsStore(s => s.setWidgetProgramIds)
  // widgetProgramIds를 직접 구독해야 변경 시 리렌더 발생
  const widgetProgramIds = useDashboardSettingsStore(s => s.widgetProgramIds)

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
        setWidgetProgramIds(
          widgetKey,
          allProgramIds.filter(id => !groupIds.includes(id))
        )
        return
      }

      if (groupOn) {
        const remaining = currentIds.filter(id => !groupIds.includes(id))
        setWidgetProgramIds(widgetKey, remaining)
        return
      }

      const next = [...new Set([...currentIds, ...groupIds])]
      const allSelected = allProgramIds.every(id => next.includes(id))
      setWidgetProgramIds(widgetKey, allSelected ? [] : next)
    },
    [widgetProgramIds, setWidgetProgramIds]
  )

  const footer = (
    <>
      <AppButton variant="cancel" onClick={onCancel}>
        닫기
      </AppButton>
      <AppButton variant="primary" onClick={onCancel}>
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
                onChange={e => setShortcutEnabled(item.id, e.target.checked)}
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
