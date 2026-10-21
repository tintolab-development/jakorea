import { useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CombinedClassLeadTeacherCandidate } from '@/features/program/general/lib/combined-class-lead-teacher'
import { COMBINED_CLASS_PROCESS_MODAL_TITLE } from '@/features/program/general/lib/combined-class-copy'
import './institution-combined-class-lead-teacher-modal.css'

const MODAL_WIDTH = 600

export type InstitutionCombinedClassLeadTeacherModalProps = {
  open: boolean
  candidates: CombinedClassLeadTeacherCandidate[]
  description: string
  onCancel: () => void
  onConfirm: (candidate: CombinedClassLeadTeacherCandidate) => void
  confirmLoading?: boolean
  zIndex?: number
}

export function InstitutionCombinedClassLeadTeacherModal({
  open,
  candidates,
  description,
  onCancel,
  onConfirm,
  confirmLoading = false,
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
    if (confirmLoading) return
    setSelectedValue(undefined)
    setError(undefined)
    onCancel()
  }

  const confirm = () => {
    const selected = candidates.find(item => item.value === selectedValue)
    if (!selected) {
      setError('담당 교사를 지정해 주세요.')
      return
    }
    onConfirm(selected)
    setSelectedValue(undefined)
    setError(undefined)
  }

  return (
    <ContentModal
      open={open}
      onCancel={close}
      title={COMBINED_CLASS_PROCESS_MODAL_TITLE}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      description={description}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            disabled={confirmLoading}
            onClick={close}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={confirm}
          >
            합반 처리
          </CmsButton>
        </>
      }
    >
      <div className="institution-combined-class-lead-teacher-modal">
        <CmsSelect
          inputSize="large"
          width="100%"
          label="담당 교사 지정"
          required
          withAllOption={false}
          placeholder="담당 교사를 지정해 주세요."
          value={selectedValue}
          error={Boolean(error)}
          message={error}
          options={candidates.map(item => ({
            label: item.label,
            value: item.value,
          }))}
          onChange={value => {
            setSelectedValue(value != null ? String(value) : undefined)
            setError(undefined)
          }}
        />
      </div>
    </ContentModal>
  )
}
