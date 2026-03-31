/**
 * 정산 관리 > 정산 항목 설정 — 임금 / 지급 / 공제 카테고리 카드 목록
 */

import { useCallback, useState } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import {
  SettlementItemCardMoreIcon,
  SettlementItemSettingIcon,
} from './settlement-item-setting-icons'
import { SettlementItemSettingDetailModal } from './settlement-item-setting-detail-modal'
import './settlement-item-settings-page.css'

const cardMenuItems: MenuProps['items'] = [{ key: 'placeholder', label: '준비 중', disabled: true }]

export default function SettlementItemSettingsPage() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<SettlementItemSettingRow | null>(null)

  const openDetail = useCallback((row: SettlementItemSettingRow) => {
    setDetailItem(row)
    setDetailOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailItem(null)
  }, [])

  return (
    <div className="settlement-item-settings-page">
      <div className="settlement-item-settings-page__sections">
        {settlementItemSettingSections.map(section => (
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
                    aria-label={`${item.title} 상세 열기`}
                    onClick={() => openDetail(item)}
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
                    <Dropdown menu={{ items: cardMenuItems }} trigger={['click']}>
                      <button type="button" className="settlement-item-settings__card-more" aria-label="항목 옵션">
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

      <SettlementItemSettingDetailModal open={detailOpen} onCancel={closeDetail} item={detailItem} />
    </div>
  )
}
