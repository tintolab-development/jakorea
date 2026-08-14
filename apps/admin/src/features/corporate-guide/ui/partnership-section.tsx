/**
 * 기업후원 안내 — 파트너십 절차 (인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  PartnershipStep,
  PartnershipStepNumber,
} from '@/entities/corporate-guide/model/types'
import { useSavePartnership } from '@/features/corporate-guide/api/hooks'
import { corporateGuideSaveFailureAlert } from '@/features/corporate-guide/lib/save-failure-alert'
import { CmsButton, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<number, { title: string; description: string }>

function buildDrafts(items: PartnershipStep[]): DraftMap {
  return Object.fromEntries(
    items.map(item => [item.step, { title: item.title, description: item.description }])
  )
}

type Props = {
  items: PartnershipStep[]
}

export function PartnershipSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSavePartnership()
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
    (step: number, patch: Partial<{ title: string; description: string }>) => {
      setDrafts(prev => ({
        ...prev,
        [step]: {
          title: prev[step]?.title ?? '',
          description: prev[step]?.description ?? '',
          ...patch,
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    try {
      const payload = items.map(item => {
        const d = drafts[item.step]
        return {
          step: item.step as PartnershipStepNumber,
          apiId: item.apiId,
          title: d?.title ?? item.title,
          description: d?.description ?? item.description,
          version: item.version,
        }
      })
      for (const row of payload) {
        if (!row.title.trim()) {
          showAlert({ title: '입력 확인', content: '단계 제목을 입력해 주세요.' })
          return
        }
        if (!row.description.trim()) {
          showAlert({ title: '입력 확인', content: '단계 설명을 입력해 주세요.' })
          return
        }
      }
      await saveMutation.mutateAsync(payload)
      setIsEditing(false)
    } catch (err) {
      showAlert(
        corporateGuideSaveFailureAlert(
          err,
          '파트너십 절차 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [drafts, items, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<PartnershipStep>>(
    () => [
      {
        title: '단계',
        key: 'step',
        width: 100,
        align: 'center',
        className: 'corporate-guide-col--step',
        render: (_value, record) => record.step,
      },
      {
        title: '제목',
        key: 'title',
        width: 240,
        align: 'center',
        className: 'corporate-guide-col--title',
        render: (_value, record) => {
          const value = drafts[record.step]?.title ?? record.title
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={value}
                onChange={e => handleDraftChange(record.step, { title: e.target.value })}
                placeholder="단계 제목을 입력하세요"
                aria-label={`${record.step}단계 제목`}
              />
            )
          }
            return (
              <span className="corporate-guide-preline">
                {value || '-'}
              </span>
            )
        },
      },
      {
        title: '설명',
        key: 'description',
        align: 'center',
        className: 'corporate-guide-col--desc',
        render: (_value, record) => {
          const value = drafts[record.step]?.description ?? record.description
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={3}
                value={value}
                onChange={e => handleDraftChange(record.step, { description: e.target.value })}
                placeholder="단계 설명을 입력하세요"
                aria-label={`${record.step}단계 설명`}
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
    <div className="corporate-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 파트너십 절차</span>
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

      <Table<PartnershipStep>
        className="cms-data-table cms-data-table--skip-auto-no-col corporate-guide-partnership-table"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="step"
        scroll={{ x: true }}
      />
    </div>
  )
}
