import { useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton, CmsInput, CmsSelect } from '@/shared/ui'
import './participating-individual-participant-team-change-modal.css'

export type ParticipatingIndividualParticipantTeamChangeScheduleOption = {
  value: string
  label: string
  sessionOrder: number
}

export type ParticipatingIndividualParticipantTeamChangeConfirmPayload = {
  fromSessionOrder: number
  teamName: string
}

export type ParticipatingIndividualParticipantTeamChangeModalProps = {
  open: boolean
  scheduleOptions: ReadonlyArray<ParticipatingIndividualParticipantTeamChangeScheduleOption>
  defaultTeamName?: string
  onCancel: () => void
  onConfirm: (payload: ParticipatingIndividualParticipantTeamChangeConfirmPayload) => void
}

export function ParticipatingIndividualParticipantTeamChangeModal({
  open,
  scheduleOptions,
  defaultTeamName = '',
  onCancel,
  onConfirm,
}: ParticipatingIndividualParticipantTeamChangeModalProps) {
  const [scheduleRowId, setScheduleRowId] = useState<string | undefined>(undefined)
  const [teamName, setTeamName] = useState('')

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === scheduleRowId) ?? null,
    [scheduleOptions, scheduleRowId]
  )

  useEffect(() => {
    if (!open) return
    setScheduleRowId(undefined)
    setTeamName(defaultTeamName.trim())
  }, [defaultTeamName, open, scheduleOptions])

  const canConfirm = Boolean(selectedOption && teamName.trim())

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="팀 변경"
      width={600}
      className="participating-individual-team-change-modal"
      footer={
        <div className="participating-individual-team-change-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!selectedOption) return
              onConfirm({
                fromSessionOrder: selectedOption.sessionOrder,
                teamName: teamName.trim(),
              })
            }}
          >
            팀 변경
          </CmsButton>
        </div>
      }
    >
      <div className="participating-individual-team-change-modal__content">
        <p className="participating-individual-team-change-modal__description">
          선택한 일정 이후의 건들은 변경된 팀명이 반영됩니다.
        </p>
        <div className="participating-individual-team-change-modal__field">
          <span className="participating-individual-team-change-modal__label">변경 일정</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="변경사항을 반영할 일정을 선택해 주세요"
            value={scheduleRowId}
            options={scheduleOptions.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={value => setScheduleRowId(value == null ? undefined : String(value))}
            aria-label="변경 일정"
          />
        </div>
        <div className="participating-individual-team-change-modal__field">
          <span className="participating-individual-team-change-modal__label">변경 팀명</span>
          <CmsInput
            inputSize="large"
            width="100%"
            value={teamName}
            onChange={event => setTeamName(event.target.value)}
            placeholder="변경할 팀명을 입력해 주세요"
          />
        </div>
      </div>
    </ContentModal>
  )
}
