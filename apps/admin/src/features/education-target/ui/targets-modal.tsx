/**
 * 교육 대상 관리 모달 — 5개 고정, 인덱스 색상 변경 불가
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { EducationTarget } from '@/entities/education-target/model/types'
import {
  useEducationTargetsList,
  useSaveEducationTargets,
} from '@/features/education-target/api/hooks'
import { educationTargetQueryKeys } from '@/features/education-target/api/query-keys'
import { EDUCATION_TARGETS_CHANGED_EVENT } from '@/features/education-target/api/store'
import { IndexColorDot } from '@/features/education-target/ui/index-color-dot'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

import './targets-modal.css'
type Props = {
  open: boolean
  onCancel: () => void
  onSaved?: () => void
}

export function EducationTargetsModal({ open, onCancel, onSaved }: Props) {
  const { showAlert } = useCmsAlert()
  const listQuery = useEducationTargetsList(open)
  const saveMutation = useSaveEducationTargets()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})

  useInvalidateOnWindowEvent(EDUCATION_TARGETS_CHANGED_EVENT, educationTargetQueryKeys.lists())

  useEffect(() => {
    if (!open) return
    setDraftNames(Object.fromEntries(rows.map(row => [row.id, row.name])))
  }, [open, rows])

  const handleNameChange = useCallback((id: string, name: string) => {
    setDraftNames(prev => ({ ...prev, [id]: name }))
  }, [])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(
        rows.map(row => ({
          id: row.id,
          name: (draftNames[row.id] ?? row.name).trim() || row.name,
        }))
      )
      onSaved?.()
      onCancel()
    } catch {
      showAlert({
        title: '저장 실패',
        content: '교육 대상 설정에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draftNames, onCancel, onSaved, rows, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<EducationTarget>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '교육 대상명',
        key: 'name',
        render: (_value, record) => (
          <CmsInput
            inputSize="medium"
            width="100%"
            value={draftNames[record.id] ?? record.name}
            onChange={e => handleNameChange(record.id, e.target.value)}
            aria-label={`교육 대상명 ${record.sortOrder}`}
          />
        ),
      },
      {
        title: '인덱스 색상',
        key: 'indexColor',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <IndexColorDot color={record.indexColor} label={`${record.name} 색상`} />
        ),
      },
    ],
    [draftNames, handleNameChange]
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 대상 관리"
      width={640}
      className="education-targets-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={saveMutation.isPending}
          >
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending || rows.length === 0}
            onClick={() => {
              void handleSave()
            }}
          >
            교육대상 설정
          </CmsButton>
        </>
      }
    >
      <p className="education-targets-modal__note">
        인덱스 색상과 교육 대상 항목 수는 변경이 불가합니다.
      </p>
      <Table<EducationTarget>
        className="cms-data-table education-targets-modal__table"
        rowKey="id"
        loading={listQuery.isLoading}
        dataSource={rows}
        columns={columns}
        pagination={false}
      />
    </ContentModal>
  )
}
