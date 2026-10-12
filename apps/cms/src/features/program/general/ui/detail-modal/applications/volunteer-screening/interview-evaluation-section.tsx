import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import {
  computeGeneralInterviewTotalScore,
  formatGeneralAssignedInterviewScheduleDisplay,
  GENERAL_INTERVIEW_MANAGER_SCORE_MAX,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import './interview-evaluation-section.css'

const SCORE_PLACEHOLDER = '점수를 입력해 주세요'

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

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
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

export type GeneralVolunteerApplicantInterviewEvaluationSectionHandle = {
  /** 검증 통과·저장 성공 시 true */
  submit: () => Promise<boolean>
}

export interface GeneralVolunteerApplicantInterviewEvaluationSectionProps {
  applicant: GeneralVolunteerApplicantRow
  isEditing: boolean
  canFillBothSlots: boolean
  currentAdminId: number | null
  onSave: (payload: GeneralVolunteerInterviewEvaluationPayload) => Promise<boolean>
}

export const GeneralVolunteerApplicantInterviewEvaluationSection = forwardRef<
  GeneralVolunteerApplicantInterviewEvaluationSectionHandle,
  GeneralVolunteerApplicantInterviewEvaluationSectionProps
>(function GeneralVolunteerApplicantInterviewEvaluationSection(
  { applicant, isEditing, canFillBothSlots, currentAdminId, onSave },
  ref
) {
  const [managerAScore, setManagerAScore] = useState<number | null>(null)
  const [managerBScore, setManagerBScore] = useState<number | null>(null)
  const [remark, setRemark] = useState('')

  useEffect(() => {
    setManagerAScore(
      clampManagerScore(applicant.managerAScore == null ? '' : String(applicant.managerAScore))
    )
    setManagerBScore(
      clampManagerScore(applicant.managerBScore == null ? '' : String(applicant.managerBScore))
    )
    setRemark(applicant.interviewEvaluationRemark ?? '')
  }, [
    applicant.id,
    applicant.managerAScore,
    applicant.managerBScore,
    applicant.interviewEvaluationRemark,
    isEditing,
  ])

  const editable = useMemo(
    () => resolveInterviewEvaluationSlotEditable(applicant, canFillBothSlots, currentAdminId),
    [applicant, canFillBothSlots, currentAdminId]
  )

  const scheduleDisplay = useMemo(
    () => formatGeneralAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const draftTotalScore = useMemo(
    () => computeGeneralInterviewTotalScore({ managerAScore, managerBScore }),
    [managerAScore, managerBScore]
  )

  const savedTotalScore = useMemo(
    () => computeGeneralInterviewTotalScore(applicant),
    [applicant]
  )

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        const nextA = editable.a ? managerAScore : null
        const nextB = editable.b ? managerBScore : null

        if (!editable.a && !editable.b) {
          cmsAlertModal.show({
            title: '면접 평가 안내',
            content: '입력할 수 있는 담당자 점수가 없습니다.',
          })
          return false
        }

        if (nextA == null && nextB == null) {
          cmsAlertModal.show({
            title: '면접 평가 안내',
            content: '담당자 점수를 입력해 주세요.',
          })
          return false
        }

        if (!canFillBothSlots && nextA != null && nextB != null) {
          cmsAlertModal.show({
            title: '면접 평가 안내',
            content: '담당자 점수는 한 슬롯만 입력할 수 있습니다.',
          })
          return false
        }

        return onSave({
          managerAScore: nextA,
          managerBScore: nextB,
          interviewEvaluationRemark: remark.trim(),
        })
      },
    }),
    [canFillBothSlots, editable.a, editable.b, managerAScore, managerBScore, onSave, remark]
  )

  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  return (
    <section className="general-volunteer-applicant-interview-evaluation">
      <DetailInfoForm
        title="면접 평가"
        mode={isEditing ? 'edit' : 'view'}
        className="general-volunteer-applicant-interview-evaluation__form"
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
                placeholder={SCORE_PLACEHOLDER}
              />
            }
            view={formatScoreValue(isEditing ? managerAScore : applicant.managerAScore)}
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
                placeholder={SCORE_PLACEHOLDER}
              />
            }
            view={formatScoreValue(isEditing ? managerBScore : applicant.managerBScore)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="비고를 입력해 주세요."
              />
            }
            view={isEditing ? remark || '-' : remarkDisplay}
          />
          <DetailInfoForm.Field
            label="점수 총합"
            readOnlyDisplay
            view={formatTotalScoreDisplay(isEditing ? draftTotalScore : savedTotalScore)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
})
