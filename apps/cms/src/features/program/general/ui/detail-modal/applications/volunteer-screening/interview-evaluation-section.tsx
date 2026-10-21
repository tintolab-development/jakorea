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
  formatGeneralInterviewManagerScoreDisplay,
  GENERAL_INTERVIEW_MANAGER_SCORE_SELECT_OPTIONS,
  generalInterviewManagerScoreFromSelectValue,
  generalInterviewManagerScoreToSelectValue,
  normalizeGeneralInterviewManagerScore,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import './interview-evaluation-section.css'

const SCORE_PLACEHOLDER = '점수를 선택해 주세요'

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

type ManagerScoreSelectProps = {
  value: number | null
  disabled: boolean
  onChange: (score: number | null) => void
}

function ManagerScoreSelect({ value, disabled, onChange }: ManagerScoreSelectProps) {
  return (
    <CmsSelect
      inputSize="small"
      width="100%"
      withAllOption={false}
      allowClear={false}
      disabled={disabled}
      placeholder={SCORE_PLACEHOLDER}
      value={generalInterviewManagerScoreToSelectValue(value)}
      options={[...GENERAL_INTERVIEW_MANAGER_SCORE_SELECT_OPTIONS]}
      onChange={next =>
        onChange(generalInterviewManagerScoreFromSelectValue(next as string | undefined))
      }
    />
  )
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
    setManagerAScore(normalizeGeneralInterviewManagerScore(applicant.managerAScore))
    setManagerBScore(normalizeGeneralInterviewManagerScore(applicant.managerBScore))
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
              <ManagerScoreSelect
                disabled={!editable.a}
                value={managerAScore}
                onChange={setManagerAScore}
              />
            }
            view={formatGeneralInterviewManagerScoreDisplay(
              isEditing ? managerAScore : applicant.managerAScore
            )}
          />
          <DetailInfoForm.Field
            label="담당자 B 점수"
            edit={
              <ManagerScoreSelect
                disabled={!editable.b}
                value={managerBScore}
                onChange={setManagerBScore}
              />
            }
            view={formatGeneralInterviewManagerScoreDisplay(
              isEditing ? managerBScore : applicant.managerBScore
            )}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <CmsInput
                inputSize="small"
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
