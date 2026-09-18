import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import {
  computeGeneralInterviewTotalScore,
  formatGeneralAssignedInterviewScheduleDisplay,
  GENERAL_INTERVIEW_TOTAL_SCORE_MAX,
  GENERAL_INTERVIEW_TOTAL_SCORE_MIN,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import './interview-evaluation-modal.css'

export type GeneralVolunteerInterviewEvaluationModalProps = {
  open: boolean
  applicant: GeneralVolunteerApplicantRow
  onCancel: () => void
  onConfirm: (payload: GeneralVolunteerInterviewEvaluationPayload) => void
}

function formatTotalScoreDisplay(totalScore: number | null): ReactNode {
  if (totalScore == null) return '-'
  return <span className="general-volunteer-interview2__score-value">{totalScore}</span>
}

export function GeneralVolunteerInterviewEvaluationModal({
  open,
  applicant,
  onCancel,
  onConfirm,
}: GeneralVolunteerInterviewEvaluationModalProps) {
  const [managerAScore, setManagerAScore] = useState<number | null>(null)
  const [managerBScore, setManagerBScore] = useState<number | null>(null)
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) return
    setManagerAScore(applicant.managerAScore ?? null)
    setManagerBScore(applicant.managerBScore ?? null)
    setRemark(applicant.interviewEvaluationRemark ?? '')
  }, [applicant, open])

  const scheduleDisplay = useMemo(
    () => formatGeneralAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const totalScore = useMemo(
    () => computeGeneralInterviewTotalScore({ managerAScore, managerBScore }),
    [managerAScore, managerBScore]
  )

  const handleConfirm = () => {
    if (managerAScore == null || managerBScore == null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: '담당자 A·B 점수를 모두 입력해 주세요.',
      })
      return
    }

    if (totalScore == null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: `점수 총합은 ${GENERAL_INTERVIEW_TOTAL_SCORE_MIN}~${GENERAL_INTERVIEW_TOTAL_SCORE_MAX}점 범위여야 합니다.`,
      })
      return
    }

    onConfirm({
      managerAScore,
      managerBScore,
      interviewEvaluationRemark: remark.trim(),
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={`면접 평가 (${applicant.name})`}
      className="general-volunteer-interview-evaluation-modal"
      footer={
        <>
          <CmsButton type="button" variant="default" size="large" width={120} onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton type="button" variant="primary" size="large" width={120} onClick={handleConfirm}>
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title=""
        hideHeader
        mode="edit"
        className="general-volunteer-interview-evaluation-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 일정"
            fullRow
            readOnlyDisplay
            view={scheduleDisplay}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A 점수"
            edit={
              <CmsNumericInput
                mode="integer"
                min={0}
                max={GENERAL_INTERVIEW_TOTAL_SCORE_MAX}
                precision={0}
                inputSize="medium"
                width="100%"
                value={managerAScore == null ? '' : String(managerAScore)}
                onValueChange={value => setManagerAScore(value === '' ? null : Number(value))}
                placeholder="점수 입력"
              />
            }
            view={managerAScore ?? '-'}
          />
          <DetailInfoForm.Field
            label="담당자 B 점수"
            edit={
              <CmsNumericInput
                mode="integer"
                min={0}
                max={GENERAL_INTERVIEW_TOTAL_SCORE_MAX}
                precision={0}
                inputSize="medium"
                width="100%"
                value={managerBScore == null ? '' : String(managerBScore)}
                onValueChange={value => setManagerBScore(value === '' ? null : Number(value))}
                placeholder="점수 입력"
              />
            }
            view={managerBScore ?? '-'}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <CmsTextArea
                inputSize="medium"
                width="100%"
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="비고를 입력해 주세요."
              />
            }
            view={remark || '-'}
          />
          <DetailInfoForm.Field
            label="점수 총합"
            readOnlyDisplay
            view={formatTotalScoreDisplay(totalScore)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
