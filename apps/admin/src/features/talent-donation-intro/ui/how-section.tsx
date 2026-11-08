/**
 * 재능기부 소개 — JA와 함께하는 방법 (고정 3행 인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { HowItem, HowItemId } from '@/entities/talent-donation-intro/model/types'
import { useSaveHowItems } from '@/features/talent-donation-intro/api/hooks'
import { talentDonationIntroSaveFailureAlert } from '@/features/talent-donation-intro/lib/save-failure-alert'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT, CmsButton, CmsTextArea, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<number, { title: string; description: string }>

function requiredColumnTitle(label: string) {
  return (
    <span className="talent-intro-how-table__th-label">
      {label}
      <span className="talent-intro-how-table__required" aria-hidden>
        *
      </span>
    </span>
  )
}

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
        title: isEditing ? requiredColumnTitle('타이틀') : '타이틀',
        key: 'title',
        width: 360,
        align: 'center',
        className: 'talent-intro-col--title',
        render: (_value, record) => {
          const value = drafts[record.id]?.title ?? record.title
          return (
            <CmsTextArea
              className={[
                'cms-textarea--fixed-rows',
                isEditing ? 'talent-intro-how-field--edit' : 'talent-intro-how-field--readonly',
              ].join(' ')}
              inputSize="small"
              width="100%"
              // 조회·수정 모두 내용 줄 수만큼(hug) — 행 높이가 텍스트 높이를 따른다. 리사이즈 핸들 없음(fixed-rows)
              autoSize={{ minRows: 1 }}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, { title: e.target.value })
              }}
              placeholder="타이틀을 입력해 주세요"
              aria-label={`${record.id}번 타이틀`}
            />
          )
        },
      },
      {
        title: isEditing ? requiredColumnTitle('설명 텍스트') : '설명 텍스트',
        key: 'description',
        align: 'center',
        className: 'talent-intro-col--desc',
        render: (_value, record) => {
          const value = drafts[record.id]?.description ?? record.description
          return (
            <CmsTextArea
              className={[
                'cms-textarea--fixed-rows',
                isEditing ? 'talent-intro-how-field--edit' : 'talent-intro-how-field--readonly',
              ].join(' ')}
              inputSize="small"
              width="100%"
              // 조회·수정 모두 내용 줄 수만큼(hug) — 행 높이가 텍스트 높이를 따른다. 리사이즈 핸들 없음(fixed-rows)
              autoSize={{ minRows: 1 }}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftChange(record.id, { description: e.target.value })
              }}
              placeholder="설명 텍스트를 입력해 주세요"
              aria-label={`${record.id}번 설명 텍스트`}
            />
          )
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

      <CmsDataTable<HowItem>
        className={[
          'cms-data-table cms-data-table--skip-auto-no-col talent-intro-how-table',
          isEditing ? 'talent-intro-how-table--editing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="id"
      />
    </div>
  )
}
