/**
 * 채용 안내 — 직무 인터뷰 (임팩트 스토리) 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { InterviewItem, InterviewSaveItem } from '@/entities/recruit-guide/model/types'
import {
  useAddRecruitInterview,
  useRemoveRecruitInterviews,
  useReplaceRecruitInterview,
} from '@/features/recruit-guide/api/hooks'
import { MAX_RECRUIT_INTERVIEWS } from '@/features/recruit-guide/api/store'
import { recruitGuideSaveFailureAlert } from '@/features/recruit-guide/lib/save-failure-alert'
import { InterviewSelectModal } from '@/features/recruit-guide/ui/interview-select-modal'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import {
  CmsButton,
  ConfirmModal,
  NO_SELECTION_ALERT,
  showAddCompletedAlert,
  showDeleteCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

import './section-shared.css'

type PickerMode = { type: 'add' } | { type: 'edit'; item: InterviewItem }

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

  const rows = useMemo(() => [...items].sort((a, b) => a.displayOrder - b.displayOrder), [items])
  const atLimit = rows.length >= MAX_RECRUIT_INTERVIEWS

  const columns = useMemo<ColumnsType<InterviewItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 100,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, record) => record.displayOrder,
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
        width: 140,
        align: 'center',
        className: 'recruit-guide-col--actions',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="small"
            type="button"
            onClick={e => {
              e.stopPropagation()
              setPicker({ type: 'edit', item: record })
            }} >
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
        if (picker?.type === 'add') {
          await addMutation.mutateAsync(input)
          showAddCompletedAlert()
        } else if (picker?.type === 'edit') {
          await replaceMutation.mutateAsync({ id: picker.item.id, input })
          showUpdateCompletedAlert()
        } else {
          return
        }
        setPicker(null)
      } catch (err) {
        showAlert(
          recruitGuideSaveFailureAlert(
            err,
            picker?.type === 'edit'
              ? '직무 인터뷰 수정에 실패했습니다. 다시 시도해 주세요.'
              : '직무 인터뷰 저장에 실패했습니다. 다시 시도해 주세요.'
          )
        )
      }
    },
    [addMutation, picker, replaceMutation, showAlert]
  )

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
      showDeleteCompletedAlert()
    } catch (err) {
      showAlert(
        recruitGuideSaveFailureAlert(err, '직무 인터뷰 삭제에 실패했습니다. 다시 시도해 주세요.')
      )
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const pickerLoading = addMutation.isPending || replaceMutation.isPending

  return (
    <section className="admin-list-card recruit-guide-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ 직무 인터뷰 (임팩트 스토리)</span>
        </div>
        <div className="table-header-actions--wrapper">
          <CmsButton
            variant="delete"
            size="h40"
            type="button"
            loading={removeMutation.isPending}
            onClick={handleDeleteClick} >
            선택 삭제
          </CmsButton>
          {atLimit ? null : (
            <CmsButton
              variant="primary"
              size="h40"
              type="button"
              disabled={pickerLoading}
              onClick={() => setPicker({ type: 'add' })} >
              추가
            </CmsButton>
          )}
        </div>
      </div>

      <CmsDataTable<InterviewItem>
        className="cms-data-table recruit-guide-interview-table"
        rowKey="id"
        columns={columns}
        dataSource={rows}
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
        key={
          picker?.type === 'edit'
            ? `edit-${picker.item.id}`
            : picker?.type === 'add'
              ? 'add'
              : 'closed'
        }
        open={picker != null}
        confirmLoading={pickerLoading}
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
    </section>
  )
}
