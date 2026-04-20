/**
 * 정산 관리 > 정산 항목 설정 — 임금 / 지급 / 공제 카테고리 카드 목록
 */

import { useCallback } from 'react'
import { Dropdown } from 'antd'
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
  const [sections, setSections] = useState<SettlementItemSettingSection[]>(() =>
    cloneSettlementSections(settlementItemSettingSections)
  )
  const [selectedItem, setSelectedItem] = useState<SettlementItemSettingRow | null>(null)

  const deleteItem = useCallback((sectionKind: SettlementItemSettingCategoryKind, itemId: string) => {
    setSelectedItem(cur => (cur?.id === itemId ? null : cur))
    setSections(prev =>
      prev.map(section =>
        section.kind === sectionKind
          ? { ...section, items: section.items.filter(i => i.id !== itemId) }
          : section
      )
    )
  }, [])

  const duplicateItem = useCallback((sectionKind: SettlementItemSettingCategoryKind, item: SettlementItemSettingRow) => {
    const newId = `${item.id}__dup__${Date.now()}`
    saveSettlementItemSettingDetail(newId, getSettlementItemSettingDetail(item.id))
    setSections(prev =>
      prev.map(section =>
        section.kind === sectionKind
          ? { ...section, items: [...section.items, { ...item, id: newId }] }
          : section
      )
    )
  }, [])

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
                      <SettlementItemSettingIcon iconKey={item.iconKey} />
                    </div>
                    <div className="settlement-item-settings__card-body">
                      <div className="settlement-item-settings__card-title-row">
                        <span className="settlement-item-settings__card-title">{item.title}</span>
                      </div>
                      <p className="settlement-item-settings__card-desc">{item.description}</p>
                    </div>
                  </button>
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
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SettlementItemSettingDetailModal
        open={selectedItem !== null}
        item={selectedItem}
        onCancel={() => setSelectedItem(null)}
      />
    </div>
  )
}
