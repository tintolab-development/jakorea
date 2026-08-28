import { type ReactNode } from 'react'
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
  getScheduleEventPerScheduleExtraPlan,
  isIndividualAllPerScheduleLayout,
  PRE_EDUCATION_SCHEDULE_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT,
  ProgramRegistrationMultiRoundAssignmentFields,
  type ProgramRegistrationMultiRoundAssignmentValue,
} from './program-registration-multi-round-assignment-fields'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  educationScheduleAppliedSurfaceRange,
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  parseStoredEducationScheduleRange,
} from '@/features/template/lib/format-education-schedule-line'
import {
  useProgramRegistrationOverlayKv,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import './program-registration-paragraph.css'

const PRE_EDUCATION_SESSION_INDEX = 0

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
  /** 카드 헤더「사전 교육」ON이면 회차/차시 앞에 사전 교육 블록을 둔다 */
  scheduleCurriculumPreEducation?: boolean
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
  fieldLabel,
  progressSession,
  onProgressSessionChange,
}: {
  roundIndex: number
  fieldLabel?: string
  progressSession: string
  onProgressSessionChange: (value: string) => void
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={fieldLabel ?? `${roundIndex}회차 수업`}
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
  headingLabel,
  onDeleteCurriculumChartSession,
  extraRows,
  showHeading = true,
}: {
  chartIndex: number
  headingLabel?: string
  onDeleteCurriculumChartSession: (chartIndex: number) => void
  extraRows?: ReactNode
  showHeading?: boolean
}) {
  const heading = headingLabel ?? `${chartIndex}차시`
  const showDelete = headingLabel == null && chartIndex > 1

  return (
    <div className="program-registration-curriculum__session-block">
      {showHeading ? (
        <div className="program-registration-curriculum__session-heading">■ {heading}</div>
      ) : null}
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={`${heading} 커리큘럼`}
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
  scheduleCurriculumPreEducation = false,
}: ProgramRegistrationEducationCurriculumParagraphProps) {
  const [ipsBySession] = useProgramRegistrationOverlayKv<
    Record<number, ProgramRegistrationIpsTypeValue>
  >('generalRegistration.educationCurriculum.ipsBySession', {})

  const [progressSessionByRound] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationCurriculum.progressSessionByRound',
    {}
  )

  const [educationFormBySession] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationCurriculum.educationFormBySession',
    {}
  )

  const [participationBySession] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationCurriculum.participationBySession',
    {}
  )

  const [assignmentByRound] = useProgramRegistrationOverlayKv<
    Record<number, ProgramRegistrationMultiRoundAssignmentValue>
  >('generalRegistration.educationCurriculum.assignmentByRound', {})

  const [preEducationScheduleLine] = useProgramRegistrationOverlayKv<string | null>(
    'generalRegistration.educationCurriculum.preEducationScheduleLine',
    null
  )

  const educationFormForSession = (sessionIndex: number) =>
    educationFormBySession[sessionIndex] ?? 'online'
  const participationForSession = (sessionIndex: number) =>
    participationBySession[sessionIndex] ?? 'individual'
  const assignmentForRound = (roundIndex: number) =>
    assignmentByRound[roundIndex] ?? EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT

  const onEducationFormRadioChange = (sessionIndex: number) => (e: RadioChangeEvent) => {
    const nextValue = String(e.target.value)
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.educationFormBySession',
      prev => {
        const next = { ...(prev ?? {}), [sessionIndex]: nextValue }
        if (educationFormScheduleDetail === 'perSchedule') {
          patchInstitutionApplicationProgramBridge({
            showPreferredEducationForm: Object.values(next).some(
              value => value === 'participant_selection'
            ),
          })
        }
        return next
      }
    )
  }

  const onParticipationRadioChange = (sessionIndex: number) => (e: RadioChangeEvent) => {
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.participationBySession',
      prev => ({ ...(prev ?? {}), [sessionIndex]: String(e.target.value) })
    )
  }

  const setSessionIps = (sessionIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    updateProgramRegistrationOverlayKey<Record<number, ProgramRegistrationIpsTypeValue>>(
      'generalRegistration.educationCurriculum.ipsBySession',
      prev => ({ ...(prev ?? {}), [sessionIndex]: next })
    )
  }

  const setAssignmentForRound = (
    roundIndex: number,
    next: ProgramRegistrationMultiRoundAssignmentValue
  ) => {
    updateProgramRegistrationOverlayKey<
      Record<number, ProgramRegistrationMultiRoundAssignmentValue>
    >('generalRegistration.educationCurriculum.assignmentByRound', prev => ({
      ...(prev ?? {}),
      [roundIndex]: next,
    }))
  }

  const handleDeleteChartSession = (chartIndex: number) => {
    if (chartIndex <= 1) return
    updateProgramRegistrationOverlayKey<Record<number, ProgramRegistrationIpsTypeValue>>(
      'generalRegistration.educationCurriculum.ipsBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.educationFormBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.participationBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
    )
    onDeleteCurriculumChartSession(chartIndex)
  }

  const handleDeleteRoundSession = (roundIndex: number) => {
    if (roundIndex <= 1) return
    updateProgramRegistrationOverlayKey<Record<number, ProgramRegistrationIpsTypeValue>>(
      'generalRegistration.educationCurriculum.ipsBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.educationFormBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.participationBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.progressSessionByRound',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    updateProgramRegistrationOverlayKey<
      Record<number, ProgramRegistrationMultiRoundAssignmentValue>
    >('generalRegistration.educationCurriculum.assignmentByRound', prev =>
      reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    onDeleteCurriculumSession(roundIndex)
  }

  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    participantOrganization,
    { context: 'perScheduleBlock' }
  )

  const renderLockedPreEducationIpsField = (options?: {
    fullRow?: boolean
    layout?: 'default' | 'inline'
  }) => (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow={options?.fullRow}
      edit={
        <ProgramRegistrationIpsTypeFields
          layout={options?.layout}
          disabled
          value={{ category: 'prepare', detail: 'none' }}
          onChange={() => {}}
        />
      }
      view="-"
    />
  )

  const renderPreEducationEducationFormField = (options?: { fullRow?: boolean }) => (
    <DetailInfoForm.Field
      label="교육 형태"
      fullRow={options?.fullRow}
      edit={
        <CmsRadioGroup
          size="large"
          value={educationFormForSession(PRE_EDUCATION_SESSION_INDEX)}
          onChange={onEducationFormRadioChange(PRE_EDUCATION_SESSION_INDEX)}
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

  const renderIndividualPreEducationScheduleBlock = () => {
    const extraPlan = getScheduleEventPerScheduleExtraPlan({
      educationFormScheduleDetail,
      participationScheduleDetail,
      ipsScheduleDetail,
      participantOrganization,
    })
    const scheduleRange = parseStoredEducationScheduleRange(preEducationScheduleLine)
    const scheduleHasClock = Boolean(
      scheduleRange && educationScheduleRangeHasClock(scheduleRange)
    )
    return (
      <div key="pre-education" className="program-registration-schedule-curriculum__block">
        <div className="program-registration-schedule-curriculum__session-heading">
          ■ {PRE_EDUCATION_SCHEDULE_LABEL}
        </div>
        <div className="program-registration-curriculum__session-row">
          <div className="program-registration-schedule-curriculum__session-panel">
            <DetailInfoForm
              title="교육 진행 (일정형)"
              hideHeader
              mode="edit"
              className="program-registration-paragraph"
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="일정명"
                  edit={
                    <CmsInput
                      inputSize="medium"
                      value={PRE_EDUCATION_SCHEDULE_LABEL}
                      disabled
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                    />
                  }
                  view="-"
                />
                <DetailInfoForm.Field
                  label="진행 일정"
                  edit={
                    <div className="detail-info-form-inputs-wrapper-no-gap">
                      <ParagraphDatePicker
                        mode="single"
                        presetMode="schedule"
                        customizable={false}
                        suppressAutoTodayWhenEmpty
                        value={scheduleRange?.[0] ?? null}
                        appliedSurfaceRange={educationScheduleAppliedSurfaceRange(scheduleRange)}
                        appliedSurfaceWithTime={scheduleHasClock}
                        onChange={() => {}}
                        onRangeChange={([start, end]) =>
                          updateProgramRegistrationOverlayKey<string | null>(
                            'generalRegistration.educationCurriculum.preEducationScheduleLine',
                            () => formatEducationScheduleLineFromRange([start, end])
                          )
                        }
                        width="100%"
                        placeholder="일정을 선택하세요"
                      />
                    </div>
                  }
                  view="-"
                />
              </DetailInfoForm.Row>
              {extraPlan.showIps ? (
                <DetailInfoForm.Row type="double">
                  {renderPreEducationEducationFormField()}
                  {renderLockedPreEducationIpsField({ layout: 'inline' })}
                </DetailInfoForm.Row>
              ) : (
                <DetailInfoForm.Row type="single">
                  {renderPreEducationEducationFormField({ fullRow: true })}
                </DetailInfoForm.Row>
              )}
            </DetailInfoForm>
          </div>
        </div>
      </div>
    )
  }

  const renderPreEducationChartBlock = () => {
    if (!scheduleCurriculumPreEducation) return null
    if (!participantOrganization) return renderIndividualPreEducationScheduleBlock()
    return (
      <ProgramRegistrationCurriculumChartSessionBlock
        key="pre-education"
        chartIndex={PRE_EDUCATION_SESSION_INDEX}
        headingLabel={PRE_EDUCATION_SCHEDULE_LABEL}
        onDeleteCurriculumChartSession={() => {}}
        extraRows={
          ipsScheduleDetail === 'perSchedule' ? (
            <DetailInfoForm.Row type="single">
              {renderLockedPreEducationIpsField({ fullRow: true })}
            </DetailInfoForm.Row>
          ) : null
        }
      />
    )
  }

  if (sessionRoundType === 'single') {
    const isSingleIpsPerChart = ipsScheduleDetail === 'perSchedule'
    const showChartSessionHeading =
      participantOrganization ||
      scheduleCurriculumPreEducation ||
      curriculumChartSessionCount > 1

    if (isSingleIpsPerChart) {
      return (
        <div className="program-registration-curriculum__sessions">
          {renderPreEducationChartBlock()}
          {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
            const chartIndex = i + 1
            const ipsValue = ipsBySession[chartIndex] ?? { category: '', detail: '' }
            return (
              <ProgramRegistrationCurriculumChartSessionBlock
                key={chartIndex}
                chartIndex={chartIndex}
                showHeading={showChartSessionHeading}
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
        {renderPreEducationChartBlock()}
        {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
          const chartIndex = i + 1
          return (
            <ProgramRegistrationCurriculumChartSessionBlock
              key={chartIndex}
              chartIndex={chartIndex}
              showHeading={showChartSessionHeading}
              onDeleteCurriculumChartSession={handleDeleteChartSession}
            />
          )
        })}
      </div>
    )
  }

  const showParticipationMethod = !participantOrganization
  const isAllPerLayout = isIndividualAllPerScheduleLayout({
    participantOrganization,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
  })

  const multiRowPlan = getProgramRegistrationCurriculumMultiSessionRowPlan(
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail
  )

  const renderEducationFormPerScheduleRow = (
    roundIndex: number,
    options?: { ipsLocked?: boolean }
  ) => {
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
                disabled={options?.ipsLocked}
                value={
                  options?.ipsLocked
                    ? { category: 'prepare', detail: 'none' }
                    : (ipsBySession[roundIndex] ?? { category: '', detail: '' })
                }
                onChange={(next: ProgramRegistrationIpsTypeValue) => {
                  if (options?.ipsLocked) return
                  setSessionIps(roundIndex, next)
                }}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      )
    }

    return <DetailInfoForm.Row type="single">{educationField}</DetailInfoForm.Row>
  }

  const renderParticipationField = (roundIndex: number, options?: { fullRow?: boolean }) => (
    <DetailInfoForm.Field
      label="참여 방식"
      fullRow={options?.fullRow}
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
  )

  const renderMultiRoundPlanExtraRows = (roundIndex: number): ReactNode => {
    if (educationFormScheduleDetail === 'perSchedule') {
      return (
        <>
          {renderEducationFormPerScheduleRow(roundIndex)}
          {showParticipationMethod &&
          multiRowPlan === 'p_eduPer_piAnyPer' &&
          participationScheduleDetail === 'perSchedule' ? (
            isAllPerLayout ? (
              <DetailInfoForm.Row type="double">
                <ProgramRegistrationMultiRoundAssignmentFields
                  embedded
                  value={assignmentForRound(roundIndex)}
                  onChange={next => setAssignmentForRound(roundIndex, next)}
                />
                {renderParticipationField(roundIndex)}
              </DetailInfoForm.Row>
            ) : (
              <DetailInfoForm.Row type="single">
                {renderParticipationField(roundIndex)}
              </DetailInfoForm.Row>
            )
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

  const renderPreEducationExtraRows = (): ReactNode => {
    if (educationFormScheduleDetail === 'perSchedule') {
      return renderEducationFormPerScheduleRow(PRE_EDUCATION_SESSION_INDEX, { ipsLocked: true })
    }
    if (ipsScheduleDetail === 'perSchedule') {
      return (
        <DetailInfoForm.Row type="single">
          {renderLockedPreEducationIpsField({ fullRow: true })}
        </DetailInfoForm.Row>
      )
    }
    return null
  }

  return (
    <div className="program-registration-curriculum__sessions">
      {scheduleCurriculumPreEducation ? (
        !participantOrganization ? (
          renderIndividualPreEducationScheduleBlock()
        ) : (
        <div key="pre-education" className="program-registration-curriculum__session-block">
          <div className="program-registration-curriculum__session-heading">
            ■ {PRE_EDUCATION_SCHEDULE_LABEL}
          </div>
          <div className="program-registration-curriculum__session-row">
            <DetailInfoForm
              title="교육 진행 (커리큘럼)"
              hideHeader
              mode="edit"
              className="program-registration-paragraph"
            >
              <ProgramRegistrationMultiRoundClassRow
                roundIndex={PRE_EDUCATION_SESSION_INDEX}
                fieldLabel="교육 내용"
                progressSession={progressSessionByRound[PRE_EDUCATION_SESSION_INDEX] ?? ''}
                onProgressSessionChange={value =>
                  updateProgramRegistrationOverlayKey<Record<number, string>>(
                    'generalRegistration.educationCurriculum.progressSessionByRound',
                    prev => ({ ...(prev ?? {}), [PRE_EDUCATION_SESSION_INDEX]: value })
                  )
                }
              />
              {renderPreEducationExtraRows()}
            </DetailInfoForm>
          </div>
        </div>
        )
      ) : null}
      {Array.from({ length: curriculumSessionCount }, (_, i) => {
        const roundIndex = i + 1
        const progressSession = progressSessionByRound[roundIndex] ?? ''

        return (
          <div key={roundIndex} className="program-registration-curriculum__session-block">
            {curriculumSessionCount > 1 || scheduleCurriculumPreEducation ? (
              <div className="program-registration-curriculum__session-heading">
                ■ {roundIndex}회차
              </div>
            ) : null}
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
                    updateProgramRegistrationOverlayKey<Record<number, string>>(
                      'generalRegistration.educationCurriculum.progressSessionByRound',
                      prev => ({ ...(prev ?? {}), [roundIndex]: value })
                    )
                  }
                />
                {isAllPerLayout ? null : (
                  <ProgramRegistrationMultiRoundAssignmentFields
                    value={assignmentForRound(roundIndex)}
                    onChange={next => setAssignmentForRound(roundIndex, next)}
                  />
                )}
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
