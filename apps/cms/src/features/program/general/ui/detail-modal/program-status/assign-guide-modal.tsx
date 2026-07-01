import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsRadio, CmsSelect, useCmsAlert } from '@/shared/ui'
import { useEffect, useState } from 'react'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import './school-detail-add-instructor-assign-modal.css'

type InstitutionOption = {
  value: string
  label: string
}

function AssignSessionTags({
  value,
  onChange,
  options,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  options: InstructorAssignSessionOption[]
}) {
  if (options.length === 0) {
    return (
      <p className="school-detail-add-instructor-assign-modal__session-empty">
        선택 가능한 교육 일정이 없습니다.
      </p>
    )
  }

  return (
    <div
      className="school-detail-add-instructor-assign-modal__session-grid"
      role="group"
      aria-label="교육 배정일 선택"
    >
      {options.map(opt => {
        const selected = value.includes(opt.id)
        const disabled = Boolean(opt.disabled)
        return (
          <InstructorAssignSessionSlotChip
            key={opt.id}
            scheduleLabel={opt.dateLabel ?? opt.scheduleLabel}
            timeLabel={opt.timeLabel}
            sessionRoundLabel={opt.sessionRoundLabel}
            capacityLabel={opt.capacityLabel}
            selected={selected}
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              onChange(selected ? value.filter(id => id !== opt.id) : [...value, opt.id])
            }}
          />
        )
      })}
    </div>
  )
}

export interface AssignGuideModalProps {
  open: boolean
  instructorName: string
  institutionOptions: InstitutionOption[]
  selectedInstitutionId: string | null
  role: InstructorRoleKey
  sessionOptions: InstructorAssignSessionOption[]
  selectedSessionIds: string[]
  onInstitutionChange: (id: string | null) => void
  onRoleChange: (role: InstructorRoleKey) => void
  onSessionIdsChange: (ids: string[]) => void
  onCancel: () => void
  onConfirm: () => void
}

export function AssignGuideModal({
  open,
  instructorName,
  institutionOptions,
  selectedInstitutionId,
  role,
  sessionOptions,
  selectedSessionIds,
  onInstitutionChange,
  onRoleChange,
  onSessionIdsChange,
  onCancel,
  onConfirm,
}: AssignGuideModalProps) {
  const { showAlert } = useCmsAlert()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setConfirmOpen(false)
  }, [open])

  const handleConfirm = () => {
    if (selectedSessionIds.length === 0) {
      showAlert({
        title: '기관 배정 안내',
        content: '교육 배정일을 선택해 주세요.',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleFinalConfirm = () => {
    setConfirmOpen(false)
    onConfirm()
  }

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="기관 배정 안내"
        width={800}
        footer={
          <>
            <CmsButton variant="secondary" size="large" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleConfirm}>
              강사 배정
            </CmsButton>
          </>
        }
        className="school-detail-add-instructor-assign-modal"
      >
        <div className="school-detail-add-instructor-assign-modal__body">
          <p className="school-detail-add-instructor-assign-modal__description">
            [<strong>{instructorName}</strong>] 강사님을 추가 배정할 기관을 선택해 주세요
          </p>
          <div className="school-detail-add-instructor-assign-modal__fields">
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                대표 강사 지정
              </div>
              <CmsRadio.Group
                className="school-detail-add-instructor-assign-modal__role-radios"
                size="large"
                value={role}
                onChange={e => onRoleChange(e.target.value as InstructorRoleKey)}
                options={[
                  { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
                  {
                    label: INSTRUCTOR_ROLE_LABELS.assistant,
                    value: 'assistant' as InstructorRoleKey,
                  },
                ]}
              />
            </div>
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">기관명</div>
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                placeholder="배정할 기관을 선택해 주세요"
                options={institutionOptions}
                value={selectedInstitutionId ?? undefined}
                onChange={value => onInstitutionChange(value ? String(value) : null)}
                getPopupContainer={() => document.body}
              />
            </div>
            <div className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                교육 배정일 선택
              </div>
              <AssignSessionTags
                value={selectedSessionIds}
                onChange={onSessionIdsChange}
                options={sessionOptions}
              />
            </div>
          </div>
        </div>
      </ContentModal>

      <ContentModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="강사 배정 안내"
        width={800}
        footer={
          <>
            <CmsButton variant="secondary" size="large" onClick={() => setConfirmOpen(false)}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleFinalConfirm}>
              강사 배정
            </CmsButton>
          </>
        }
      >
        <p>
          선택하신 기관 일정에 [<strong>{instructorName}</strong>] 강사님을 새로 배정하시겠습니까?
        </p>
      </ContentModal>
    </>
  )
}
