/**
 * 채용 안내 — 조직문화 (고정 4행 인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { CultureItem } from '@/entities/recruit-guide/model/types'
import { useSaveRecruitCulture } from '@/features/recruit-guide/api/hooks'
import { recruitGuideSaveFailureAlert } from '@/features/recruit-guide/lib/save-failure-alert'
import { CmsButton, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type DraftMap = Record<string, { title: string; description: string }>

function buildDrafts(items: CultureItem[]): DraftMap {
  return Object.fromEntries(
    items.map(item => [item.id, { title: item.title, description: item.description }])
  )
}

function fieldClass(isEditing: boolean, ...extra: Array<string | false | undefined>) {
  return [
    'recruit-guide-inline-field',
    isEditing ? 'recruit-guide-inline-field--edit' : 'recruit-guide-inline-field--readonly',
    'cms-textarea--fixed-rows',
    ...extra,
  ]
    .filter(Boolean)
    .join(' ')
}

type Props = {
  items: CultureItem[]
}

export function CultureSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveRecruitCulture()
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
      if (!isEditing) return
      setDrafts(prev => ({
        ...prev,
        [id]: {
          title: prev[id]?.title ?? '',
          description: prev[id]?.description ?? '',
          ...patch,
        },
      }))
    },
    [isEditing]
  )

  const handleSave = useCallback(async () => {
    try {
      const payload = items.map(item => {
        const d = drafts[item.id]
        return {
          id: item.id,
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
        recruitGuideSaveFailureAlert(
          err,
          '조직문화 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [drafts, items, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<CultureItem>>(
    () => [
      {
        title: '항목',
        key: 'itemLabel',
        width: 180,
        align: 'center',
        className: 'recruit-guide-col--label',
        render: (_value, record) => record.itemLabel,
      },
      {
        title: '타이틀',
        key: 'title',
        align: 'center',
        className: 'recruit-guide-col--text',
        render: (_value, record) => {
          const value = drafts[record.id]?.title ?? record.title
          return (
            <CmsTextArea
              className={fieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              rows={1}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              placeholder="타이틀을 입력하세요"
              aria-label={`${record.itemLabel} 타이틀`}
              onChange={e => handleDraftChange(record.id, { title: e.target.value })}
            />
          )
        },
      },
      {
        title: '설명 텍스트',
        key: 'description',
        align: 'center',
        className: 'recruit-guide-col--text',
        render: (_value, record) => {
          const value = drafts[record.id]?.description ?? record.description
          return (
            <CmsTextArea
              className={fieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              rows={2}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              placeholder="설명 텍스트를 입력하세요"
              aria-label={`${record.itemLabel} 설명 텍스트`}
              onChange={e => handleDraftChange(record.id, { description: e.target.value })}
            />
          )
        },
      },
    ],
    [drafts, handleDraftChange, isEditing]
  )

  return (
    <div className="recruit-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 조직문화</span>
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

      <Table<CultureItem>
        className="cms-data-table cms-data-table--skip-auto-no-col recruit-guide-culture-table"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowKey="id"
        scroll={{ x: true }}
      />
    </div>
  )
}
