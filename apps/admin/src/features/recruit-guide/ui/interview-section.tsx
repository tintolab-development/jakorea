/**
 * 채용 안내 — 고정 3슬롯 직무 인터뷰
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InterviewItem, InterviewSaveItem } from '@/entities/recruit-guide/model/types'
import { useUpdateRecruitInterview } from '@/features/recruit-guide/api/hooks'
import { recruitGuideSaveFailureAlert } from '@/features/recruit-guide/lib/save-failure-alert'
import { InterviewEditModal } from '@/features/recruit-guide/ui/interview-edit-modal'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { CmsButton, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type Props = {
  items: InterviewItem[]
}

export function InterviewSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const updateMutation = useUpdateRecruitInterview()
  const [editingId, setEditingId] = useState<InterviewItem['id'] | null>(null)
  const editingItem = items.find(item => item.id === editingId) ?? null

  const columns = useMemo<ColumnsType<InterviewItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 100,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, record) => record.id,
      },
      {
        title: '스토리 키',
        dataIndex: 'storyKey',
        key: 'storyKey',
        width: 220,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '게시글 제목',
        dataIndex: 'title',
        key: 'title',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '게시년도',
        dataIndex: 'publishedYear',
        key: 'publishedYear',
        width: 140,
        align: 'center',
        render: (value: number | null) => (value == null ? '-' : `${value}년`),
      },
      {
        title: '관리',
        key: 'actions',
        width: 140,
        align: 'center',
        className: 'recruit-guide-col--actions',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            width={100}
            type="button"
            onClick={event => {
              event.stopPropagation()
              setEditingId(record.id)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    []
  )

  const handleSubmit = useCallback(
    async (input: InterviewSaveItem) => {
      if (!editingItem) return
      try {
        await updateMutation.mutateAsync({ slotId: editingItem.id, input })
        setEditingId(null)
      } catch (error) {
        showAlert(
          recruitGuideSaveFailureAlert(
            error,
            '직무 인터뷰 저장에 실패했습니다. 다시 시도해 주세요.'
          )
        )
      }
    },
    [editingItem, showAlert, updateMutation]
  )

  return (
    <div className="recruit-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 직무 인터뷰 (임팩트 스토리)</span>
        </div>
        <div className="table-header-actions--wrapper">
          <span className="recruit-guide-fixed-slots-note">고정 3개 슬롯</span>
        </div>
      </div>

      <Table<InterviewItem>
        className="cms-data-table recruit-guide-interview-table"
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        scroll={{ x: true }}
      />

      {editingItem ? (
        <InterviewEditModal
          key={editingItem.id}
          open
          item={editingItem}
          confirmLoading={updateMutation.isPending}
          onCancel={() => setEditingId(null)}
          onSubmit={input => {
            void handleSubmit(input)
          }}
        />
      ) : null}
    </div>
  )
}
