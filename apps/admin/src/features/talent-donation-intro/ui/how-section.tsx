/**
 * 재능기부 소개 — JA와 함께하는 방법 (고정 3행 인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { HowItem, HowItemId } from '@/entities/talent-donation-intro/model/types'
import { useSaveHowItems } from '@/features/talent-donation-intro/api/hooks'
import { talentDonationIntroSaveFailureAlert } from '@/features/talent-donation-intro/lib/save-failure-alert'
import { CmsButton, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<number, { title: string; description: string }>

function buildDrafts(items: HowItem[]): DraftMap {
  return Object.fromEntries(
    items.map(item => [item.id, { title: item.title, description: item.description }])
  )
}

type Props = {
  items: HowItem[]
}

export function HowSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveHowItems()
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
    (id: number, patch: Partial<{ title: string; description: string }>) => {
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
          id: item.id as HowItemId,
          title: d?.title ?? item.title,
          description: d?.description ?? item.description,
          version: item.version,
        }
      })
      for (const row of payload) {
        if (!row.title.trim()) {
          showAlert({ title: '입력 확인', content: '타이틀을 입력해 주세요.' })
          return
        }
        if (!row.description.trim()) {
          showAlert({ title: '입력 확인', content: '설명 텍스트를 입력해 주세요.' })
          return
        }
      }
      await saveMutation.mutateAsync(payload)
      setIsEditing(false)
    } catch (err) {
      showAlert(
        talentDonationIntroSaveFailureAlert(
          err,
          'JA와 함께하는 방법 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [drafts, items, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<HowItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 80,
        align: 'center',
        className: 'talent-intro-col--no',
        render: (_value, record) => record.id,
      },
      {
        title: '타이틀',
        key: 'title',
        width: 240,
        align: 'center',
        className: 'talent-intro-col--title',
        render: (_value, record) => {
          const value = drafts[record.id]?.title ?? record.title
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={value}
                onChange={e => handleDraftChange(record.id, { title: e.target.value })}
                placeholder="타이틀을 입력하세요"
                aria-label={`${record.id}번 타이틀`}
              />
            )
          }
          return <span className="talent-intro-preline">{value || '-'}</span>
        },
      },
      {
        title: '설명 텍스트',
        key: 'description',
        align: 'center',
        className: 'talent-intro-col--desc',
        render: (_value, record) => {
          const value = drafts[record.id]?.description ?? record.description
          if (isEditing) {
            return (
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={3}
                value={value}
                onChange={e => handleDraftChange(record.id, { description: e.target.value })}
                placeholder="설명 텍스트를 입력하세요"
                aria-label={`${record.id}번 설명 텍스트`}
              />
            )
          }
          return <span className="talent-intro-preline">{value || '-'}</span>
        },
      },
    ],
    [drafts, handleDraftChange, isEditing]
  )

  return (
    <div className="talent-intro-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ JA와 함께하는 방법</span>
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

      <Table<HowItem>
        className="cms-data-table cms-data-table--skip-auto-no-col talent-intro-how-table"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="id"
        scroll={{ x: true }}
      />
    </div>
  )
}
