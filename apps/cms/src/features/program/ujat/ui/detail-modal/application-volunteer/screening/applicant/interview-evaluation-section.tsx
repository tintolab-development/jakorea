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
  UjatVolunteerApplicantRow,
  UjatVolunteerInterviewEvaluationPayload,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { formatInterviewSummary } from '../interview-assign/schedule-utils'
import { parseUjatInterviewDateLabel } from '../shared/interview-calendar-events'
import { computeUjatInterviewTotalScore } from '../interview2/display'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import './interview-evaluation-section.css'

const MANAGER_SCORE_MAX = 5
const SCORE_PLACEHOLDER = '점수를 선택해 주세요'

const MANAGER_SCORE_SELECT_OPTIONS = Array.from({ length: MANAGER_SCORE_MAX }, (_, i) => {
  const score = String(i + 1)
  return { label: score, value: score }
})

function formatAssignedInterviewScheduleDisplay(applicant: UjatVolunteerApplicantRow): string {
  const dateLabel = applicant.assignedInterviewDateLabel
  const time = applicant.assignedInterviewTime
  if (!dateLabel || !time) return '—'
  const date = parseUjatInterviewDateLabel(dateLabel)
  if (!date) return `${dateLabel} ${time}`
  return formatInterviewSummary(date, time)
}

function clampManagerScore(value: string): number | null {
  if (value === '') return null
  const next = Number(value)
  if (!Number.isFinite(next) || !Number.isInteger(next) || next < 1) return null
  return Math.min(MANAGER_SCORE_MAX, next)
}

type ManagerScoreSelectProps = {
  value: number | null
  onChange: (score: number | null) => void
}

/** 1~5 점수 선택. 미선택이면 placeholder 노출 */
function ManagerScoreSelect({ value, onChange }: ManagerScoreSelectProps) {
  return (
    <CmsSelect
      inputSize="small"
      width="100%"
      withAllOption={false}
      allowClear={false}
      placeholder={SCORE_PLACEHOLDER}
      value={value == null ? undefined : String(value)}
      options={MANAGER_SCORE_SELECT_OPTIONS}
      onChange={next => onChange(clampManagerScore(next == null ? '' : String(next)))}
    />
  )
}

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

function formatTotalScoreDisplay(totalScore: number | null): ReactNode {
  if (totalScore == null) return '-'
  return <span className="ujat-volunteer-interview2__score-value">{totalScore}</span>
}

export type InterviewEvaluationSectionHandle = {
  /** 검증 통과·저장 성공 시 true */
  submit: () => Promise<boolean>
}

export interface InterviewEvaluationSectionProps {
  applicant: UjatVolunteerApplicantRow
  isEditing: boolean
  onSave: (payload: UjatVolunteerInterviewEvaluationPayload) => Promise<boolean>
}

export const InterviewEvaluationSection = forwardRef<
  InterviewEvaluationSectionHandle,
  InterviewEvaluationSectionProps
>(function InterviewEvaluationSection({ applicant, isEditing, onSave }, ref) {
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

  const scheduleDisplay = useMemo(
    () => formatAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const draftTotalScore = useMemo(
    () => computeUjatInterviewTotalScore({ managerAScore, managerBScore }),
    [managerAScore, managerBScore]
  )

  const savedTotalScore = useMemo(
    () => computeUjatInterviewTotalScore(applicant),
    [applicant]
  )

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        if (managerAScore == null && managerBScore == null) {
          cmsAlertModal.show({
            title: '면접 평가 안내',
            content: '담당자 점수를 입력해 주세요.',
          })
          return false
        }
        return onSave({
          managerAScore,
          managerBScore,
          interviewEvaluationRemark: remark.trim(),
        })
      },
    }),
    [managerAScore, managerBScore, onSave, remark]
  )

  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  return (
    <section className="ujat-volunteer-applicant-interview-evaluation">
      <DetailInfoForm
        title="면접 평가"
        mode={isEditing ? 'edit' : 'view'}
        className="ujat-volunteer-applicant-interview-evaluation__form"
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
              <ManagerScoreSelect value={managerAScore} onChange={setManagerAScore} />
            }
            view={formatScoreValue(isEditing ? managerAScore : applicant.managerAScore)}
          />
          <DetailInfoForm.Field
            label="담당자 B 점수"
            edit={
              <ManagerScoreSelect value={managerBScore} onChange={setManagerBScore} />
            }
            view={formatScoreValue(isEditing ? managerBScore : applicant.managerBScore)}
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
