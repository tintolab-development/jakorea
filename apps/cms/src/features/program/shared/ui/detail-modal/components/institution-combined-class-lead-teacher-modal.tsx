import { useEffect, useState } from 'react'
import { CmsModal } from '@/shared/ui/cms-modal'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CombinedClassLeadTeacherCandidate } from '@/features/program/general/lib/combined-class-lead-teacher'
import {
  COMBINED_CLASS_LEAD_TEACHER_MODAL_DESCRIPTION,
  COMBINED_CLASS_LEAD_TEACHER_MODAL_TITLE,
} from '@/features/program/general/lib/combined-class-copy'
import './institution-combined-class-lead-teacher-modal.css'

export type InstitutionCombinedClassLeadTeacherModalProps = {
  open: boolean
  candidates: CombinedClassLeadTeacherCandidate[]
  onCancel: () => void
  onConfirm: (candidate: CombinedClassLeadTeacherCandidate) => void
  zIndex?: number
}

export function InstitutionCombinedClassLeadTeacherModal({
  open,
  candidates,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionCombinedClassLeadTeacherModalProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!open) return
    setSelectedValue(undefined)
    setError(undefined)
  }, [open])

  const close = () => {
    setSelectedValue(undefined)
    setError(undefined)
    onCancel()
  }

  return (
    <CmsModal
      open={open}
      onClose={close}
      title={COMBINED_CLASS_LEAD_TEACHER_MODAL_TITLE}
      zIndex={zIndex}
      buttons={[
        {
          label: '취소',
          onClick: close,
          variant: 'secondary',
        },
        {
          label: '완료',
          onClick: () => {
            const selected = candidates.find(item => item.value === selectedValue)
            if (!selected) {
              setError('담당 교사를 선택해 주세요.')
              return
            }
            onConfirm(selected)
            setSelectedValue(undefined)
            setError(undefined)
          },
        },
      ]}
    >
      <div className="institution-combined-class-lead-teacher-modal">
        <p className="institution-combined-class-lead-teacher-modal__desc">
          {COMBINED_CLASS_LEAD_TEACHER_MODAL_DESCRIPTION}
        </p>
        <CmsSelect
          className="institution-combined-class-lead-teacher-modal__select"
          inputSize="large"
          width="100%"
          placeholder="담당 교사 선택"
          value={selectedValue}
          options={candidates.map(item => ({
            label: item.label,
            value: item.value,
          }))}
          onChange={value => {
            setSelectedValue(value != null ? String(value) : undefined)
            setError(undefined)
          }}
        />
        {error ? (
          <span className="institution-combined-class-lead-teacher-modal__error">{error}</span>
        ) : null}
      </div>
    </CmsModal>
  )
}
