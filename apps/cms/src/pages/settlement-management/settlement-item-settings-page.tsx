/**
 * 정산 관리 > 정산 항목 설정 — 임금 / 지급 / 공제 카테고리 카드 목록
 */

import { useCallback, useMemo, useState } from 'react'
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
import {
  useSettlementConfigQuery,
  useSettlementConfigSectionsQuery,
} from '@/features/settlement-management/hooks/use-settlement-config-sections-query'
import {
  resolveSettlementConfigMutationError,
  SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE,
  useDeleteSettlementConfigPaymentItemMutation,
  useDuplicateSettlementConfigPaymentItemMutation,
  useUpdateSettlementConfigItemMutation,
} from '@/features/settlement-management/hooks/use-settlement-config-mutations'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  SettlementItemCardMoreIcon,
  SettlementItemSettingIcon,
} from './settlement-item-setting-icons'
import { SettlementItemSettingDetailModal } from './settlement-item-setting-detail-modal'
import { SettlementItemSettingDetailSourceProvider } from './settlement-item-setting-detail-source'
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
  const configQuery = useSettlementConfigQuery(settlementConfigsRemote)
  const sectionsQuery = useSettlementConfigSectionsQuery(settlementConfigsRemote)
  const { showAlert } = useCmsAlert()

  const updateItemMutation = useUpdateSettlementConfigItemMutation()
  const duplicatePaymentMutation = useDuplicateSettlementConfigPaymentItemMutation()
  const deletePaymentMutation = useDeleteSettlementConfigPaymentItemMutation()

  const [mockSections, setMockSections] = useState<SettlementItemSettingSection[]>(() =>
    cloneSettlementSections(settlementItemSettingSections)
  )
  const [selectedItem, setSelectedItem] = useState<SettlementItemSettingRow | null>(null)

  const sections = useMemo(() => {
    if (settlementConfigsRemote) {
      return sectionsQuery.data ?? []
    }
    return mockSections
  }, [settlementConfigsRemote, sectionsQuery.data, mockSections])

  const itemById = useMemo(() => {
    const map = new Map<string, SettlementItemSettingRow>()
    for (const section of sections) {
      for (const item of section.items) {
        map.set(item.id, item)
      }
    }
    return map
  }, [sections])

  const deleteItem = useCallback(
    (sectionKind: SettlementItemSettingCategoryKind, item: SettlementItemSettingRow) => {
      if (settlementConfigsRemote) {
        if (sectionKind !== 'payment' || item.apiItemId == null) {
          void showAlert({
            title: '삭제 불가',
            content: SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE,
          })
          return
        }
        deletePaymentMutation.mutate(item.apiItemId, {
          onSuccess: () => setSelectedItem(cur => (cur?.id === item.id ? null : cur)),
          onError: error => {
            void showAlert({
              title: '삭제 실패',
              content: resolveSettlementConfigMutationError(error),
            })
          },
        })
        return
      }
      setSelectedItem(cur => (cur?.id === item.id ? null : cur))
      setMockSections(prev =>
        prev.map(section =>
          section.kind === sectionKind
            ? { ...section, items: section.items.filter(i => i.id !== item.id) }
            : section
        )
      )
    },
    [deletePaymentMutation, settlementConfigsRemote, showAlert]
  )

  const duplicateItem = useCallback(
    (sectionKind: SettlementItemSettingCategoryKind, item: SettlementItemSettingRow) => {
      if (settlementConfigsRemote) {
        if (sectionKind !== 'payment' || item.apiItemId == null) {
          void showAlert({
            title: '복제 불가',
            content: SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE,
          })
          return
        }
        duplicatePaymentMutation.mutate(item.apiItemId, {
          onError: error => {
            void showAlert({
              title: '복제 실패',
              content: resolveSettlementConfigMutationError(error),
            })
          },
        })
        return
      }
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
    [duplicatePaymentMutation, settlementConfigsRemote, showAlert]
  )

  const isLoading = settlementConfigsRemote && configQuery.isLoading
  const isError = settlementConfigsRemote && configQuery.isError

  if (isLoading) {
    return (
      <div className="settlement-item-settings-page page-content-loading page-content-loading--viewport" role="status">
        <Spin />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="settlement-item-settings-page page-content-error" role="alert">
        {configQuery.error instanceof Error
          ? configQuery.error.message
          : '정산 항목 설정을 불러오지 못했습니다.'}
      </div>
    )
  }

  return (
    <SettlementItemSettingDetailSourceProvider
      mode={settlementConfigsRemote ? 'remote' : 'mock'}
      config={configQuery.data?.config}
      itemById={itemById}
    >
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
                    {section.kind === 'payment' ? (
                      <div className="settlement-item-settings__card-more-wrap">
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            items: cardOptionMenuItems,
                            onClick: ({ key, domEvent }) => {
                              domEvent.stopPropagation()
                              if (key === 'delete') {
                                deleteItem(section.kind, item)
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
          saving={updateItemMutation.isPending}
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
          onSaveRemote={
            settlementConfigsRemote && configQuery.data?.config
              ? async (item, detail, meta) => {
                  await updateItemMutation.mutateAsync({
                    config: configQuery.data!.config,
                    item,
                    detail,
                    meta,
                  })
                  setSelectedItem(cur =>
                    cur?.id === item.id ? { ...cur, ...meta } : cur
                  )
                }
              : undefined
          }
        />
      </div>
    </SettlementItemSettingDetailSourceProvider>
  )
}
