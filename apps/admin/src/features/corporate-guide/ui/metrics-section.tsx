/**
 * 기업후원 안내 — 핵심 지표 (인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { MetricItem, MetricItemId } from '@/entities/corporate-guide/model/types'
import { useSaveMetrics } from '@/features/corporate-guide/api/hooks'
import { corporateGuideSaveFailureAlert } from '@/features/corporate-guide/lib/save-failure-alert'
import { requiredColumnTitle } from './required-column-title'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT, CmsButton, CmsTextArea, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<string, { title: string; description: string }>

function buildDrafts(items: MetricItem[]): DraftMap {
  return Object.fromEntries(
    items.map(item => [item.id, { title: item.title, description: item.description }])
  )
}

type Props = {
  items: MetricItem[]
}

export function MetricsSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveMetrics()
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
    (id: string, patch: Partial<{ title: string; description: string }>) => {
      setDrafts(prev => ({
        ...prev,
        [id]: {
          title: prev[id]?.title ?? '',
          description: prev[id]?.description ?? '',
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
          id: item.id as MetricItemId,
          apiId: item.apiId,
          title: d?.title ?? item.title,
          description: d?.description ?? item.description,
          version: item.version,
        }
      })
      for (const row of payload) {
        if (!row.title.trim()) {
          showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
          return
        }
        if (!row.description.trim()) {
          showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
          return
        }
      }
      await saveMutation.mutateAsync(payload)
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch (err) {
      showAlert(
        corporateGuideSaveFailureAlert(err, '핵심 지표 저장에 실패했습니다. 다시 시도해 주세요.')
      )
    }
  }, [drafts, items, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<MetricItem>>(
    () => [
      {
        title: '항목명',
        key: 'itemLabel',
        width: 200,
        align: 'center',
        className: 'corporate-guide-col--label',
        render: (_value, record) => record.itemLabel,
      },
      {
        // 수정 모드에서 타이틀·설명 텍스트 모두 필수 (저장 시 빈 값은 공통 필수 안내)
        title: isEditing ? requiredColumnTitle('타이틀') : '타이틀',
        key: 'title',
        width: 240,
        align: 'center',
        className: 'corporate-guide-col--title',
        render: (_value, record) => {
          const value = drafts[record.id]?.title ?? record.title
          if (isEditing) {
            return (
              <CmsTextArea
                layout="fixed"
                inputSize="small"
                width="100%"
                autoSize={{ minRows: 1 }}
                value={value}
                onChange={e => handleDraftChange(record.id, { title: e.target.value })}
                placeholder="타이틀을 입력해 주세요"
                aria-label={`${record.itemLabel} 타이틀`}
              />
            )
          }
          return <span className="corporate-guide-preline">{value || '-'}</span>
        },
      },
      {
        title: isEditing ? requiredColumnTitle('설명 텍스트') : '설명 텍스트',
        key: 'description',
        align: 'center',
        className: 'corporate-guide-col--desc',
        render: (_value, record) => {
          const value = drafts[record.id]?.description ?? record.description
          if (isEditing) {
            return (
              <CmsTextArea
                layout="fixed"
                inputSize="small"
                width="100%"
                autoSize={{ minRows: 1 }}
                value={value}
                onChange={e => handleDraftChange(record.id, { description: e.target.value })}
                placeholder="설명 텍스트를 입력해 주세요"
                aria-label={`${record.itemLabel} 설명 텍스트`}
              />
            )
          }
          return <span className="corporate-guide-preline">{value || '-'}</span>
        },
      },
    ],
    [drafts, handleDraftChange, isEditing]
  )

  return (
    <div className="admin-list-card corporate-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 핵심 지표</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="h40"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="h40"
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
            <CmsButton variant="primary" size="h40" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <CmsDataTable<MetricItem>
        className="cms-data-table cms-data-table--skip-auto-no-col corporate-guide-metrics-table"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
