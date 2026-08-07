/**
 * 개인후원 — 후원금 사용 안내 (인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  UsageGuideItem,
  UsageGuideItemId,
} from '@/entities/individual-donation/model/types'
import { useSaveUsageGuide } from '@/features/individual-donation/api/hooks'
import { CmsButton, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<string, { mainText: string; subText: string }>

function buildDrafts(items: UsageGuideItem[]): DraftMap {
  return Object.fromEntries(
    items.map(item => [item.id, { mainText: item.mainText, subText: item.subText }])
  )
}

type Props = {
  items: UsageGuideItem[]
}

export function UsageGuideSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveUsageGuide()
  const [isEditing, setIsEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftMap>(() => buildDrafts(items))

  useEffect(() => {
    if (isEditing) return
    setDrafts(buildDrafts(items))
  }, [items, isEditing])

  const handleEdit = useCallback(() => {
    setDrafts(buildDrafts(items))
    setIsEditing(true)
  }, [items])

  const handleCancel = useCallback(() => {
    setDrafts(buildDrafts(items))
    setIsEditing(false)
  }, [items])

  const handleDraftChange = useCallback(
    (id: string, patch: Partial<{ mainText: string; subText: string }>) => {
      setDrafts(prev => ({
        ...prev,
        [id]: {
          mainText: prev[id]?.mainText ?? '',
          subText: prev[id]?.subText ?? '',
          ...patch,
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    try {
      const payload = items.map(item => {
        const d = drafts[item.id]
        return {
          id: item.id as UsageGuideItemId,
          mainText: d?.mainText ?? item.mainText,
          subText: d?.subText ?? item.subText,
        }
      })
      for (const row of payload) {
        if (!row.mainText.trim()) {
          showAlert({ title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' })
          return
        }
        if (!row.subText.trim()) {
          showAlert({ title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' })
          return
        }
      }
      await saveMutation.mutateAsync(payload)
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'USAGE_MAIN_TEXT_REQUIRED') {
        showAlert({ title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' })
        return
      }
      if (message === 'USAGE_SUB_TEXT_REQUIRED') {
        showAlert({ title: '입력 확인', content: '서브 텍스트를 입력해 주세요.' })
        return
      }
      showAlert({
        title: '저장 실패',
        content: '후원금 사용 안내 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [drafts, items, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<UsageGuideItem>>(
    () => [
      {
        title: '항목명',
        key: 'itemLabel',
        width: 180,
        align: 'center',
        className: 'individual-donation-col--label',
        render: (_value, record) => record.itemLabel,
      },
      {
        title: '메인 텍스트',
        key: 'mainText',
        align: 'center',
        className: 'individual-donation-col--text',
        render: (_value, record) => {
          const value = drafts[record.id]?.mainText ?? record.mainText
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={value}
                onChange={e => handleDraftChange(record.id, { mainText: e.target.value })}
                placeholder="메인 텍스트를 입력하세요"
                aria-label={`${record.itemLabel} 메인 텍스트`}
              />
            )
          }
          return <span className="individual-donation-preline">{value || '-'}</span>
        },
      },
      {
        title: '서브 텍스트',
        key: 'subText',
        align: 'center',
        className: 'individual-donation-col--text',
        render: (_value, record) => {
          const value = drafts[record.id]?.subText ?? record.subText
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={value}
                onChange={e => handleDraftChange(record.id, { subText: e.target.value })}
                placeholder="서브 텍스트를 입력하세요"
                aria-label={`${record.itemLabel} 서브 텍스트`}
              />
            )
          }
          return <span className="individual-donation-preline">{value || '-'}</span>
        },
      },
    ],
    [drafts, handleDraftChange, isEditing]
  )

  return (
    <div className="individual-donation-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 후원금 사용안내</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <Table<UsageGuideItem>
        className="cms-data-table cms-data-table--skip-auto-no-col individual-donation-usage-table"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="id"
        scroll={{ x: true }}
      />
    </div>
  )
}
