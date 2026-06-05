import { useEffect, useState } from 'react'
import { Input, InputNumber } from 'antd'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  computeGeneralInterviewTotalScore,
  GENERAL_INTERVIEW_TOTAL_SCORE_MAX,
  GENERAL_INTERVIEW_TOTAL_SCORE_MIN,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export type GeneralVolunteerInterviewEvaluationModalProps = {
  open: boolean
  applicant: GeneralVolunteerApplicantRow
  onCancel: () => void
  onConfirm: (payload: GeneralVolunteerInterviewEvaluationPayload) => void
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

  const handleConfirm = () => {
    if (managerAScore == null || managerBScore == null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: '담당자 A·B 점수를 모두 입력해 주세요.',
      })
      return
    }

    const totalScore = computeGeneralInterviewTotalScore({ managerAScore, managerBScore })
    if (totalScore == null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: `점수 종합은 ${GENERAL_INTERVIEW_TOTAL_SCORE_MIN}~${GENERAL_INTERVIEW_TOTAL_SCORE_MAX}점 범위여야 합니다.`,
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
      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A 점수"
            edit={
              <InputNumber
                min={0}
                max={GENERAL_INTERVIEW_TOTAL_SCORE_MAX}
                value={managerAScore}
                onChange={value => setManagerAScore(typeof value === 'number' ? value : null)}
                placeholder="점수 입력"
                style={{ width: '100%' }}
              />
            }
            view={managerAScore ?? '-'}
          />
          <DetailInfoForm.Field
            label="담당자 B 점수"
            edit={
              <InputNumber
                min={0}
                max={GENERAL_INTERVIEW_TOTAL_SCORE_MAX}
                value={managerBScore}
                onChange={value => setManagerBScore(typeof value === 'number' ? value : null)}
                placeholder="점수 입력"
                style={{ width: '100%' }}
              />
            }
            view={managerBScore ?? '-'}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <Input.TextArea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="비고를 입력해 주세요."
                rows={4}
              />
            }
            view={remark || '-'}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
