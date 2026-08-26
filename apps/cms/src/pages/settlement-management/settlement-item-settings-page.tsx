/**
 * 정산 관리 > 정산 항목 설정 — 임금 / 지급 / 공제 카테고리 카드 목록
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import {
  getSettlementItemSettingDetail,
  saveSettlementItemSettingDetail,
} from '@/data/mock/settlement-item-setting-detail.mock'
import {
  settlementItemSettingSections,
  type SettlementItemSettingCategoryKind,
  type SettlementItemSettingRow,
  type SettlementItemSettingSection,
} from '@/data/mock/settlement-item-settings'
import { useSettlementConfigSectionsQuery } from '@/features/settlement-management/hooks/use-settlement-config-sections-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import {
  SettlementItemCardMoreIcon,
  SettlementItemSettingIcon,
} from './settlement-item-setting-icons'
import { SettlementItemSettingDetailModal } from './settlement-item-setting-detail-modal'
import './settlement-item-settings-page.css'

function cloneSettlementSections(src: SettlementItemSettingSection[]): SettlementItemSettingSection[] {
  return src.map(section => ({
    ...section,
    items: section.items.map(item => ({ ...item })),
  }))
}

const cardOptionMenuItems: MenuProps['items'] = [
  { key: 'delete', label: '삭제', danger: true },
  { key: 'duplicate', label: '복제' },
]

export default function SettlementItemSettingsPage() {
  const settlementConfigsRemote = shouldUseSettlementRemote('settlementConfigs')
  const configQuery = useSettlementConfigSectionsQuery(settlementConfigsRemote)

  const [mockSections, setMockSections] = useState<SettlementItemSettingSection[]>(() =>
    cloneSettlementSections(settlementItemSettingSections)
  )
  const [selectedItem, setSelectedItem] = useState<SettlementItemSettingRow | null>(null)

  useEffect(() => {
    if (settlementConfigsRemote && configQuery.data) {
      setMockSections(cloneSettlementSections(configQuery.data))
    }
  }, [settlementConfigsRemote, configQuery.data])

  const sections = useMemo(() => {
    if (settlementConfigsRemote) {
      return configQuery.data ?? []
    }
    return mockSections
  }, [settlementConfigsRemote, configQuery.data, mockSections])

  const deleteItem = useCallback(
    (sectionKind: SettlementItemSettingCategoryKind, itemId: string) => {
      if (settlementConfigsRemote) return
      setSelectedItem(cur => (cur?.id === itemId ? null : cur))
      setMockSections(prev =>
        prev.map(section =>
          section.kind === sectionKind
            ? { ...section, items: section.items.filter(i => i.id !== itemId) }
            : section
        )
      )
    },
    [settlementConfigsRemote]
  )

  const duplicateItem = useCallback(
    (sectionKind: SettlementItemSettingCategoryKind, item: SettlementItemSettingRow) => {
      if (settlementConfigsRemote) return
      const newId = `${item.id}__dup__${Date.now()}`
      saveSettlementItemSettingDetail(newId, getSettlementItemSettingDetail(item.id))
      setMockSections(prev =>
        prev.map(section =>
          section.kind === sectionKind
            ? { ...section, items: [...section.items, { ...item, id: newId }] }
            : section
        )
      )
    },
    [settlementConfigsRemote]
  )

  if (settlementConfigsRemote && configQuery.isLoading) {
    return (
      <div className="settlement-item-settings-page page-content-loading page-content-loading--viewport" role="status">
        <Spin />
      </div>
    )
  }

  if (settlementConfigsRemote && configQuery.isError) {
    return (
      <div className="settlement-item-settings-page page-content-error" role="alert">
        {configQuery.error instanceof Error
          ? configQuery.error.message
          : '정산 항목 설정을 불러오지 못했습니다.'}
      </div>
    )
  }

  return (
    <div className="settlement-item-settings-page">
      <div className="settlement-item-settings-page__sections">
        {sections.map(section => (
          <section
            key={section.kind}
            className="settlement-item-settings__section"
            aria-labelledby={`settlement-item-section-${section.kind}`}
          >
            <header className="settlement-item-settings__section-head">
              <h2
                id={`settlement-item-section-${section.kind}`}
                className="settlement-item-settings__section-title"
              >
                {section.sectionTitle}
              </h2>
              <p className="settlement-item-settings__section-count">총 {section.items.length}건</p>
            </header>
            <div className="settlement-item-settings__grid">
              {section.items.map(item => (
                <article key={item.id} className="settlement-item-settings__card">
                  <button
                    type="button"
                    className="settlement-item-settings__card-hit"
                    aria-label={`${item.title} 상세 설정`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="settlement-item-settings__card-icon" aria-hidden>
                      {item.emojiOverride ? (
                        <span className="tossface settlement-item-settings__card-tossface">
                          {item.emojiOverride}
                        </span>
                      ) : (
                        <SettlementItemSettingIcon iconKey={item.iconKey} />
                      )}
                    </div>
                    <div className="settlement-item-settings__card-body">
                      <div className="settlement-item-settings__card-title-row">
                        <span className="settlement-item-settings__card-title">{item.title}</span>
                      </div>
                      <p className="settlement-item-settings__card-desc">{item.description}</p>
                    </div>
                  </button>
                  {!settlementConfigsRemote && section.kind === 'payment' ? (
                    <div className="settlement-item-settings__card-more-wrap">
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: cardOptionMenuItems,
                          onClick: ({ key, domEvent }) => {
                            domEvent.stopPropagation()
                            if (key === 'delete') {
                              deleteItem(section.kind, item.id)
                            } else if (key === 'duplicate') {
                              duplicateItem(section.kind, item)
                            }
                          },
                        }}
                      >
                        <button
                          type="button"
                          className="settlement-item-settings__card-more"
                          aria-label="항목 옵션"
                          onClick={e => e.stopPropagation()}
                        >
                          <SettlementItemCardMoreIcon />
                        </button>
                      </Dropdown>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SettlementItemSettingDetailModal
        open={selectedItem !== null}
        item={selectedItem}
        readOnly={settlementConfigsRemote}
        onCancel={() => setSelectedItem(null)}
        onSaveItemMeta={(itemId, meta) => {
          if (settlementConfigsRemote) return
          setMockSections(prev =>
            prev.map(section => ({
              ...section,
              items: section.items.map(i => (i.id === itemId ? { ...i, ...meta } : i)),
            }))
          )
          setSelectedItem(cur => (cur?.id === itemId ? { ...cur, ...meta } : cur))
        }}
      />
    </div>
  )
}
