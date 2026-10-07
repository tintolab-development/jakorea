import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import {
  computeGeneralInterviewTotalScore,
  formatGeneralAssignedInterviewScheduleDisplay,
  GENERAL_INTERVIEW_MANAGER_SCORE_MAX,
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
  /** 마스터·해당 프로그램 PM — A·B 모두 입력 */
  canFillBothSlots: boolean
  currentAdminId: number | null
  onCancel: () => void
  onConfirm: (payload: GeneralVolunteerInterviewEvaluationPayload) => void
}

type SlotEditable = { a: boolean; b: boolean }

/** 그 외 관리자: 비어 있거나 자기가 넣은 슬롯만. 이미 한 슬롯을 썼으면 나머지는 막는다. */
export function resolveInterviewEvaluationSlotEditable(
  applicant: Pick<
    GeneralVolunteerApplicantRow,
    'managerAScore' | 'managerBScore' | 'managerAEvaluatorAdminId' | 'managerBEvaluatorAdminId'
  >,
  canFillBothSlots: boolean,
  currentAdminId: number | null
): SlotEditable {
  if (canFillBothSlots) return { a: true, b: true }
  const ownsA = currentAdminId != null && applicant.managerAEvaluatorAdminId === currentAdminId
  const ownsB = currentAdminId != null && applicant.managerBEvaluatorAdminId === currentAdminId
  if (ownsA) return { a: true, b: false }
  if (ownsB) return { a: false, b: true }
  const filledA = applicant.managerAScore != null || applicant.managerAEvaluatorAdminId != null
  const filledB = applicant.managerBScore != null || applicant.managerBEvaluatorAdminId != null
  return { a: !filledA, b: !filledB }
}

function formatTotalScoreDisplay(totalScore: number | null): ReactNode {
  if (totalScore == null) return '-'
  return <span className="general-volunteer-interview2__score-value">{totalScore}</span>
}

function clampManagerScore(value: string): number | null {
  if (value === '') return null
  const next = Number(value)
  if (!Number.isFinite(next)) return null
  return Math.min(GENERAL_INTERVIEW_MANAGER_SCORE_MAX, Math.max(0, Math.trunc(next)))
}

export function GeneralVolunteerInterviewEvaluationModal({
  open,
  applicant,
  canFillBothSlots,
  currentAdminId,
  onCancel,
  onConfirm,
}: GeneralVolunteerInterviewEvaluationModalProps) {
  const [managerAScore, setManagerAScore] = useState<number | null>(null)
  const [managerBScore, setManagerBScore] = useState<number | null>(null)
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) return
    setManagerAScore(clampManagerScore(applicant.managerAScore == null ? '' : String(applicant.managerAScore)))
    setManagerBScore(clampManagerScore(applicant.managerBScore == null ? '' : String(applicant.managerBScore)))
    setRemark(applicant.interviewEvaluationRemark ?? '')
  }, [applicant, open])

  const editable = useMemo(
    () => resolveInterviewEvaluationSlotEditable(applicant, canFillBothSlots, currentAdminId),
    [applicant, canFillBothSlots, currentAdminId]
  )

  const scheduleDisplay = useMemo(
    () => formatGeneralAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const totalScore = useMemo(
    () => computeGeneralInterviewTotalScore({ managerAScore, managerBScore }),
    [managerAScore, managerBScore]
  )

  const handleConfirm = () => {
    const nextA = editable.a ? managerAScore : null
    const nextB = editable.b ? managerBScore : null

    if (!editable.a && !editable.b) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: '입력할 수 있는 담당자 점수가 없습니다.',
      })
      return
    }

    if (nextA == null && nextB == null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: '담당자 점수를 입력해 주세요.',
      })
      return
    }

    if (!canFillBothSlots && nextA != null && nextB != null) {
      cmsAlertModal.show({
        title: '면접 평가 안내',
        content: '담당자 점수는 한 슬롯만 입력할 수 있습니다.',
      })
      return
    }

    onConfirm({
      managerAScore: nextA,
      managerBScore: nextB,
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
                max={GENERAL_INTERVIEW_MANAGER_SCORE_MAX}
                precision={0}
                inputSize="medium"
                width="100%"
                disabled={!editable.a}
                value={managerAScore == null ? '' : String(managerAScore)}
                onValueChange={value => setManagerAScore(clampManagerScore(value))}
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
                max={GENERAL_INTERVIEW_MANAGER_SCORE_MAX}
                precision={0}
                inputSize="medium"
                width="100%"
                disabled={!editable.b}
                value={managerBScore == null ? '' : String(managerBScore)}
                onValueChange={value => setManagerBScore(clampManagerScore(value))}
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
