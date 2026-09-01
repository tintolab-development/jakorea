import { useEffect, useState } from 'react'
import { Input } from 'antd'
import type {
  UjatVolunteerApplicantRow,
  UjatVolunteerInterviewEvaluationPayload,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsNumericInput } from '@/shared/ui/numeric-input'

const MANAGER_SCORE_MAX = 5

export type UjatVolunteerInterviewEvaluationModalProps = {
  open: boolean
  applicant: UjatVolunteerApplicantRow
  onCancel: () => void
  onConfirm: (payload: UjatVolunteerInterviewEvaluationPayload) => void
}

export function UjatVolunteerInterviewEvaluationModal({
  open,
  applicant,
  onCancel,
  onConfirm,
}: UjatVolunteerInterviewEvaluationModalProps) {
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
              <CmsNumericInput
                mode="integer"
                min={0}
                max={MANAGER_SCORE_MAX}
                precision={0}
                value={managerAScore == null ? '' : String(managerAScore)}
                onValueChange={value => setManagerAScore(value === '' ? null : Number(value))}
                placeholder="점수 입력"
                style={{ width: '100%' }}
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
                max={MANAGER_SCORE_MAX}
                precision={0}
                value={managerBScore == null ? '' : String(managerBScore)}
                onValueChange={value => setManagerBScore(value === '' ? null : Number(value))}
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
