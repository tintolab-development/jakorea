import { useState, type ReactNode } from 'react'
import type { RadioChangeEvent } from 'antd'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from './program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from './program-registration-education-form-options'
import { GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS } from '@/features/program/general/lib/curriculum-progress-session-options'
import {
  EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT,
  ProgramRegistrationMultiRoundAssignmentFields,
  type ProgramRegistrationMultiRoundAssignmentValue,
} from './program-registration-multi-round-assignment-fields'
import './program-registration-paragraph.css'

type ProgramRegistrationEducationCurriculumParagraphProps = {
  sessionRoundType: ProgramRegistrationSessionRoundType
  /** 참여자 유형 학교/기관 — 교육 형태에 「참여자 선택」 포함 */
  participantOrganization: boolean
  curriculumSessionCount: number
  onDeleteCurriculumSession: (roundIndex: number) => void
  /** 단일 회차 + IPS 일정 별 상이 — 차시 블록 개수 (그 외에는 무시) */
  curriculumChartSessionCount: number
  onDeleteCurriculumChartSession: (chartIndex: number) => void
  /** 복수 회차 시 `type-settings`의 일정 공통·별 상이 (단일 회차 UI에서는 미사용) */
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
}

type ProgramRegistrationCurriculumMultiSessionRowPlan =
  | 'c_allCommon_piAllCommon'
  /** 교육 공통 + (참여·IPS 중 하나라도 일정 별 상이) — IPS만 별·둘 다 별 동일 플랜 */
  | 'c_allCommon_piBothPer'
  | 'c_allCommon_piPartPerOnly'
  | 'p_eduPer_piAllCommon'
  | 'p_eduPer_piAnyPer'

/** IPS 일정 별 상이 + 교육·참여 모두 일정 공통 — 커리큘럼·일정형에서 참여 방식 행 미노출 */
export function shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind,
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind,
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
): boolean {
  return (
    ipsScheduleDetail === 'perSchedule' &&
    educationFormScheduleDetail === 'common' &&
    participationScheduleDetail === 'common'
  )
}

export function getProgramRegistrationCurriculumMultiSessionRowPlan(
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind,
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind,
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
): ProgramRegistrationCurriculumMultiSessionRowPlan {
  const eduC = educationFormScheduleDetail === 'common'
  const partC = participationScheduleDetail === 'common'
  const ipsC = ipsScheduleDetail === 'common'

  if (eduC) {
    if (partC && ipsC) return 'c_allCommon_piAllCommon'
    if (!partC && ipsC) return 'c_allCommon_piPartPerOnly'
    /* 참여·IPS 일정 별: 둘 다 별이거나, 참여 공통+IPS만 별 → 커리큘럼 동일(c_allCommon_piBothPer) */
    if (!partC || !ipsC) return 'c_allCommon_piBothPer'
  }
  if (partC && ipsC) return 'p_eduPer_piAllCommon'
  return 'p_eduPer_piAnyPer'
}

function ProgramRegistrationCurriculumUnitContentInputs() {
  return (
    <div className="detail-info-form-inputs-wrapper">
      <CmsInput
        inputSize="medium"
        placeholder="단원명을 입력하세요"
        width="100%"
        style={{ minWidth: 0, flex: '1 1 0' }}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsInput
        inputSize="medium"
        placeholder="교육 내용을 작성하세요"
        width="100%"
        style={{ minWidth: 0, flex: '1 1 160px' }}
      />
    </div>
  )
}

function reindexSessionRecordAfterDelete<T>(
  record: Record<number, T>,
  deletedIndex: number
): Record<number, T> {
  const next: Record<number, T> = {}
  for (const [key, value] of Object.entries(record)) {
    const index = Number(key)
    if (index < deletedIndex) next[index] = value
    else if (index > deletedIndex) next[index - 1] = value
  }
  return next
}

function ProgramRegistrationMultiRoundClassRow({
  roundIndex,
  progressSession,
  onProgressSessionChange,
}: {
  roundIndex: number
  progressSession: string
  onProgressSessionChange: (value: string) => void
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={`${roundIndex}회차 수업`}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <CmsSelect
              inputSize="medium"
              withAllOption={false}
              placeholder="진행 차시"
              width={120}
              options={GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS}
              value={progressSession || undefined}
              onChange={v => onProgressSessionChange(String(v ?? ''))}
            />
            <DetailInfoForm.InputsSeparator />
            <CmsInput
              inputSize="medium"
              placeholder="교육 내용을 작성하세요"
              width="100%"
              style={{ minWidth: 0, flex: '1 1 0' }}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function ProgramRegistrationCurriculumChartSessionBlock({
  chartIndex,
  onDeleteCurriculumChartSession,
  extraRows,
}: {
  chartIndex: number
  onDeleteCurriculumChartSession: (chartIndex: number) => void
  extraRows?: ReactNode
}) {
  const showDelete = chartIndex > 1

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {chartIndex}차시</div>
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={`${chartIndex}차시 커리큘럼`}
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="단원명 및 교육 내용"
              fullRow
              edit={<ProgramRegistrationCurriculumUnitContentInputs />}
              view="-"
            />
          </DetailInfoForm.Row>
          {extraRows}
        </DetailInfoForm>
        {showDelete ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${chartIndex}차시 삭제`}
            onClick={event => {
              event.stopPropagation()
              onDeleteCurriculumChartSession(chartIndex)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export function ProgramRegistrationEducationCurriculumParagraph({
  sessionRoundType,
  participantOrganization,
  curriculumSessionCount,
  onDeleteCurriculumSession,
  curriculumChartSessionCount,
  onDeleteCurriculumChartSession,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
}: ProgramRegistrationEducationCurriculumParagraphProps) {
  const [ipsBySession, setIpsBySession] = useState<Record<number, ProgramRegistrationIpsTypeValue>>(
    {}
  )
  const [progressSessionByRound, setProgressSessionByRound] = useState<Record<number, string>>({})
  const [educationFormBySession, setEducationFormBySession] = useState<Record<number, string>>({})
  const [participationBySession, setParticipationBySession] = useState<Record<number, string>>({})
  const [assignmentByRound, setAssignmentByRound] = useState<
    Record<number, ProgramRegistrationMultiRoundAssignmentValue>
  >({})

  const educationFormForSession = (sessionIndex: number) =>
    educationFormBySession[sessionIndex] ?? 'online'
  const participationForSession = (sessionIndex: number) =>
    participationBySession[sessionIndex] ?? 'individual'
  const assignmentForRound = (roundIndex: number) =>
    assignmentByRound[roundIndex] ?? EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT

  const onEducationFormRadioChange =
    (sessionIndex: number) => (e: RadioChangeEvent) => {
      const nextValue = String(e.target.value)
      setEducationFormBySession(prev => {
        const next = { ...prev, [sessionIndex]: nextValue }
        if (educationFormScheduleDetail === 'perSchedule') {
          patchInstitutionApplicationProgramBridge({
            showPreferredEducationForm: Object.values(next).some(
              value => value === 'participant_selection'
            ),
          })
        }
        return next
      })
    }

  const onParticipationRadioChange = (sessionIndex: number) => (e: RadioChangeEvent) => {
    setParticipationBySession(prev => ({ ...prev, [sessionIndex]: String(e.target.value) }))
  }

  const setSessionIps = (sessionIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    setIpsBySession(prev => ({ ...prev, [sessionIndex]: next }))
  }

  const setAssignmentForRound = (
    roundIndex: number,
    next: ProgramRegistrationMultiRoundAssignmentValue
  ) => {
    setAssignmentByRound(prev => ({ ...prev, [roundIndex]: next }))
  }

  const handleDeleteChartSession = (chartIndex: number) => {
    if (chartIndex <= 1) return
    setIpsBySession(prev => reindexSessionRecordAfterDelete(prev, chartIndex))
    setEducationFormBySession(prev => reindexSessionRecordAfterDelete(prev, chartIndex))
    setParticipationBySession(prev => reindexSessionRecordAfterDelete(prev, chartIndex))
    onDeleteCurriculumChartSession(chartIndex)
  }

  const handleDeleteRoundSession = (roundIndex: number) => {
    if (roundIndex <= 1) return
    setIpsBySession(prev => reindexSessionRecordAfterDelete(prev, roundIndex))
    setEducationFormBySession(prev => reindexSessionRecordAfterDelete(prev, roundIndex))
    setParticipationBySession(prev => reindexSessionRecordAfterDelete(prev, roundIndex))
    setProgressSessionByRound(prev => reindexSessionRecordAfterDelete(prev, roundIndex))
    setAssignmentByRound(prev => reindexSessionRecordAfterDelete(prev, roundIndex))
    onDeleteCurriculumSession(roundIndex)
  }

  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    participantOrganization,
    { context: 'perScheduleBlock' }
  )

  if (sessionRoundType === 'single') {
    const isSingleIpsPerChart = ipsScheduleDetail === 'perSchedule'

    if (isSingleIpsPerChart) {
      return (
        <div className="program-registration-curriculum__sessions">
          {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
            const chartIndex = i + 1
            const ipsValue = ipsBySession[chartIndex] ?? { category: '', detail: '' }
            return (
              <ProgramRegistrationCurriculumChartSessionBlock
                key={chartIndex}
                chartIndex={chartIndex}
                onDeleteCurriculumChartSession={handleDeleteChartSession}
                extraRows={
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      fullRow
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          value={ipsValue}
                          onChange={(next: ProgramRegistrationIpsTypeValue) =>
                            setSessionIps(chartIndex, next)
                          }
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                }
              />
            )
          })}
        </div>
      )
    }

    return (
      <div className="program-registration-curriculum__sessions">
        {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
          const chartIndex = i + 1
          return (
            <ProgramRegistrationCurriculumChartSessionBlock
              key={chartIndex}
              chartIndex={chartIndex}
              onDeleteCurriculumChartSession={handleDeleteChartSession}
            />
          )
        })}
      </div>
    )
  }

  const showParticipationMethod = !participantOrganization

  const multiRowPlan = getProgramRegistrationCurriculumMultiSessionRowPlan(
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail
  )

  const renderEducationFormPerScheduleRow = (roundIndex: number) => {
    const educationField = (
      <DetailInfoForm.Field
        label="교육 형태"
        edit={
          <CmsRadioGroup
            size="large"
            value={educationFormForSession(roundIndex)}
            onChange={onEducationFormRadioChange(roundIndex)}
          >
            {perScheduleEducationFormOptions.map(opt => (
              <CmsRadio key={opt.value} value={opt.value}>
                {opt.label}
              </CmsRadio>
            ))}
          </CmsRadioGroup>
        }
        view="-"
      />
    )

    if (ipsScheduleDetail === 'perSchedule') {
      return (
        <DetailInfoForm.Row type="double">
          {educationField}
          <DetailInfoForm.Field
            label="IPS 유형"
            edit={
              <ProgramRegistrationIpsTypeFields
                layout="inline"
                value={ipsBySession[roundIndex] ?? { category: '', detail: '' }}
                onChange={(next: ProgramRegistrationIpsTypeValue) => setSessionIps(roundIndex, next)}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      )
    }

    return (
      <DetailInfoForm.Row type="single">
        {educationField}
      </DetailInfoForm.Row>
    )
  }

  const renderMultiRoundPlanExtraRows = (roundIndex: number): ReactNode => {
    if (educationFormScheduleDetail === 'perSchedule') {
      return (
        <>
          {renderEducationFormPerScheduleRow(roundIndex)}
          {showParticipationMethod &&
          multiRowPlan === 'p_eduPer_piAnyPer' &&
          participationScheduleDetail === 'perSchedule' ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="참여 방식"
                edit={
                  <CmsRadioGroup
                    size="large"
                    value={participationForSession(roundIndex)}
                    onChange={onParticipationRadioChange(roundIndex)}
                  >
                    <CmsRadio value="individual">개인</CmsRadio>
                    <CmsRadio value="team">팀</CmsRadio>
                  </CmsRadioGroup>
                }
                view="-"
              />
            </DetailInfoForm.Row>
          ) : null}
        </>
      )
    }

    if (multiRowPlan === 'c_allCommon_piBothPer') {
      return (
        <>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="IPS 유형"
              fullRow
              edit={
                <ProgramRegistrationIpsTypeFields
                  value={ipsBySession[roundIndex] ?? { category: '', detail: '' }}
                  onChange={(next: ProgramRegistrationIpsTypeValue) =>
                    setSessionIps(roundIndex, next)
                  }
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
          {showParticipationMethod &&
          !shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
            educationFormScheduleDetail,
            participationScheduleDetail,
            ipsScheduleDetail
          ) ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="참여 방식"
                edit={
                  <CmsRadioGroup
                    size="large"
                    value={participationForSession(roundIndex)}
                    onChange={onParticipationRadioChange(roundIndex)}
                  >
                    <CmsRadio value="individual">개인</CmsRadio>
                    <CmsRadio value="team">팀</CmsRadio>
                  </CmsRadioGroup>
                }
                view="-"
              />
            </DetailInfoForm.Row>
          ) : null}
        </>
      )
    }

    if (showParticipationMethod && multiRowPlan === 'c_allCommon_piPartPerOnly') {
      return (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="참여 방식"
            edit={
              <CmsRadioGroup
                size="large"
                value={participationForSession(roundIndex)}
                onChange={onParticipationRadioChange(roundIndex)}
              >
                <CmsRadio value="individual">개인</CmsRadio>
                <CmsRadio value="team">팀</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      )
    }

    return null
  }

  return (
    <div className="program-registration-curriculum__sessions">
      {Array.from({ length: curriculumSessionCount }, (_, i) => {
        const roundIndex = i + 1
        const progressSession = progressSessionByRound[roundIndex] ?? ''

        return (
          <div key={roundIndex} className="program-registration-curriculum__session-block">
            <div className="program-registration-curriculum__session-heading">■ {roundIndex}회차</div>
            <div className="program-registration-curriculum__session-row">
              <DetailInfoForm
                title="교육 진행 (커리큘럼)"
                hideHeader
                mode="edit"
                className="program-registration-paragraph"
              >
                <ProgramRegistrationMultiRoundClassRow
                  roundIndex={roundIndex}
                  progressSession={progressSession}
                  onProgressSessionChange={value =>
                    setProgressSessionByRound(prev => ({ ...prev, [roundIndex]: value }))
                  }
                />
                <ProgramRegistrationMultiRoundAssignmentFields
                  value={assignmentForRound(roundIndex)}
                  onChange={next => setAssignmentForRound(roundIndex, next)}
                />
                {renderMultiRoundPlanExtraRows(roundIndex)}
              </DetailInfoForm>
              {roundIndex > 1 ? (
                <ItemDeleteButton
                  className="item-delete-button program-registration-curriculum__session-delete"
                  aria-label={`${roundIndex}회차 삭제`}
                  onClick={event => {
                    event.stopPropagation()
                    handleDeleteRoundSession(roundIndex)
                  }}
                />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
