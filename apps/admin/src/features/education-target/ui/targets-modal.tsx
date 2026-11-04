/**
 * 교육 대상 관리 모달 — 5개 고정, 인덱스 색상 변경 불가
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { EducationTarget } from '@/entities/education-target/model/types'
import {
  useEducationTargetsList,
  useSaveEducationTargets,
} from '@/features/education-target/api/hooks'
import { IndexColorDot } from '@/features/education-target/ui/index-color-dot'
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
  const [showRequiredErrors, setShowRequiredErrors] = useState(false)

  useEffect(() => {
    if (!open) return
    setShowRequiredErrors(false)
    setDraftNames(Object.fromEntries(rows.map(row => [row.id, row.name])))
  }, [open, rows])

  const handleNameChange = useCallback((id: string, name: string) => {
    setDraftNames(prev => ({ ...prev, [id]: name }))
  }, [])

  const handleSave = useCallback(async () => {
    const hasBlank = rows.some(row => !(draftNames[row.id] ?? row.name).trim())
    if (hasBlank) {
      setShowRequiredErrors(true)
      showAlert({
        title: '입력 확인',
        content: '교육 대상명을 입력해 주세요.',
      })
      return
    }
    setShowRequiredErrors(false)
    try {
      await saveMutation.mutateAsync(
        rows.map(row => ({
          id: row.id,
          name: (draftNames[row.id] ?? row.name).trim(),
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
        title: (
          <span className="education-targets-modal__name-th">
            <span className="education-targets-modal__name-th-text">교육 대상명</span>
            <span className="education-targets-modal__required" aria-hidden>
              *
            </span>
          </span>
        ),
        key: 'name',
        className: 'education-targets-modal__name-col',
        render: (_value, record) => {
          const name = draftNames[record.id] ?? record.name
          const isBlank = !name.trim()
          return (
            <CmsInput
              inputSize="small"
              width="100%"
              required
              error={showRequiredErrors && isBlank}
              value={name}
              onChange={e => handleNameChange(record.id, e.target.value)}
              aria-label={`교육 대상명 ${record.sortOrder}`}
              aria-required
            />
          )
        },
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
    [draftNames, handleNameChange, showRequiredErrors]
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 대상 관리"
      width={600}
      className="education-targets-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={saveMutation.isPending} >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending || rows.length === 0}
            onClick={() => {
              void handleSave()
            }} >
            저장
          </CmsButton>
        </>
      }
    >
      <p className="education-targets-modal__note">
        인덱스 색상과 교육 대상 항목 수는 변경이 불가합니다.
      </p>
      <CmsDataTable<EducationTarget>
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
