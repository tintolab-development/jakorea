/**
 * 채용 안내 — 직무 인터뷰 (임팩트 스토리) 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InterviewItem, InterviewSaveItem } from '@/entities/recruit-guide/model/types'
import {
  useAddRecruitInterview,
  useRemoveRecruitInterviews,
  useReplaceRecruitInterview,
} from '@/features/recruit-guide/api/hooks'
import { recruitGuideSaveFailureAlert } from '@/features/recruit-guide/lib/save-failure-alert'
import { InterviewSelectModal } from '@/features/recruit-guide/ui/interview-select-modal'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { CmsButton, ConfirmModal, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type PickerMode = { type: 'add' } | { type: 'edit'; id: string; storyId: string }

type Props = {
  items: InterviewItem[]
}

export function InterviewSectionCard({ items }: Props) {
  const { showAlert } = useCmsAlert()
  const addMutation = useAddRecruitInterview()
  const replaceMutation = useReplaceRecruitInterview()
  const removeMutation = useRemoveRecruitInterviews()

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [picker, setPicker] = useState<PickerMode | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const columns = useMemo<ColumnsType<InterviewItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '게시글 제목',
        dataIndex: 'title',
        key: 'title',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '관리',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            width={88}
            type="button"
            onClick={e => {
              e.stopPropagation()
              setPicker({ type: 'edit', id: record.id, storyId: record.storyId })
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    []
  )

  const handleSelectStory = useCallback(
    async (input: InterviewSaveItem) => {
      try {
        if (picker?.type === 'edit') {
          await replaceMutation.mutateAsync({ id: picker.id, input })
        } else {
          await addMutation.mutateAsync(input)
        }
        setPicker(null)
      } catch (err) {
        showAlert(
          recruitGuideSaveFailureAlert(
            err,
            '직무 인터뷰 저장에 실패했습니다. 다시 시도해 주세요.'
          )
        )
      }
    },
    [addMutation, picker, replaceMutation, showAlert]
  )

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택',
        content: '선택된 항목이 없습니다.',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch (err) {
      showAlert(
        recruitGuideSaveFailureAlert(
          err,
          '직무 인터뷰 삭제에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const pickerLoading = addMutation.isPending || replaceMutation.isPending

  return (
    <div className="recruit-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 직무 인터뷰 (임팩트 스토리)</span>
        </div>
        <div className="table-header-actions--wrapper">
          <CmsButton
            variant="delete"
            size="large"
            type="button"
            loading={removeMutation.isPending}
            onClick={handleDeleteClick}
          >
            선택 삭제
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={pickerLoading}
            onClick={() => setPicker({ type: 'add' })}
          >
            추가
          </CmsButton>
        </div>
      </div>

      <Table<InterviewItem>
        className="cms-data-table recruit-guide-interview-table"
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys),
          columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
        }}
        onRow={() => ({
          onClick: e => {
            if (isTableSelectionClick(e)) return
          },
        })}
        scroll={{ x: true }}
      />

      <InterviewSelectModal
        key={picker ? `${picker.type}-${picker.type === 'edit' ? picker.id : 'add'}` : 'closed'}
        open={picker != null}
        selectedStoryId={picker?.type === 'edit' ? picker.storyId : undefined}
        onCancel={() => setPicker(null)}
        onSelect={item => {
          void handleSelectStory(item)
        }}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="직무 인터뷰 삭제"
        content={`선택한 직무 인터뷰 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
      />
    </div>
  )
}
