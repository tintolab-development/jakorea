import { Fragment, useMemo, type ReactNode } from 'react'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  getScheduleDetailPerBlockLayoutPlan,
  getScheduleEventPerScheduleExtraPlan,
  isScheduleEducationAndIpsBothPerSchedule,
  PRE_EDUCATION_SCHEDULE_LABEL,
  shouldUseScheduleEventBlockLayout,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  getProgramRegistrationCurriculumMultiSessionRowPlan,
  shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-curriculum-paragraph'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import {
  educationScheduleAppliedSurfaceRange,
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  parseEducationScheduleClock,
  parseEducationScheduleLineToRange,
  type EducationScheduleGroupTimeSlot,
} from '@/features/template/lib/format-education-schedule-line'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  useProgramRegistrationOverlayKv,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import './program-registration-paragraph.css'

type ScheduleEventAssignmentValue = {
  enabled: boolean
  period: string
}

const EMPTY_SCHEDULE_EVENT_ASSIGNMENT: ScheduleEventAssignmentValue = {
  enabled: false,
  period: '',
}

const PRE_EDUCATION_DETAIL_INDEX = 0

function reindexDetailRecordAfterDelete<T>(
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

/** Overlay는 ISO 또는 표기 줄(`26년 4월 20일…`)을 가질 수 있다. */
function overlayScheduleToRange(raw: string | null | undefined): [Dayjs, Dayjs] | null {
  const fromLine = parseEducationScheduleLineToRange(raw ?? undefined)
  if (fromLine) return fromLine
  if (!raw?.trim()) return null
  const parsed = dayjs(raw)
  return parsed.isValid() ? [parsed, parsed] : null
}

function ScheduleDetailAssignmentInputs({
  value,
  onChange,
}: {
  value: ScheduleEventAssignmentValue
  onChange: (next: ScheduleEventAssignmentValue) => void
}) {
  const appliedSurfaceRange = parseEducationScheduleLineToRange(value.period)

  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
      <CmsRadioGroup
        size="large"
        value={value.enabled ? 'yes' : 'no'}
        onChange={e => {
          const enabled = e.target.value === 'yes'
          onChange({
            enabled,
            period: enabled ? value.period : '',
          })
        }}
      >
        <CmsRadio value="yes">있음</CmsRadio>
        <CmsRadio value="no">없음</CmsRadio>
      </CmsRadioGroup>
      <DetailInfoForm.InputsSeparator />
      <ParagraphDatePicker
        mode="single"
        presetMode="period"
        customizable={false}
        suppressAutoTodayWhenEmpty
        disabled={!value.enabled}
        value={appliedSurfaceRange?.[0] ?? null}
        onChange={() => {}}
        appliedSurfaceRange={appliedSurfaceRange}
        onRangeChange={([start, end]) => {
          onChange({
            enabled: true,
            period: formatEducationScheduleLineFromRange([start, end]),
          })
        }}
        width={360}
        placeholder="제출 기한을 설정해 주세요"
      />
    </div>
  )
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function groupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

type ScheduleGroupTimeSlot = EducationScheduleGroupTimeSlot | null

function ScheduleCurriculumGroupTimeRow({
  groupLetter,
  showGroupLabel,
  slot,
  onChange,
  onDelete,
}: {
  groupLetter: string
  showGroupLabel: boolean
  slot: ScheduleGroupTimeSlot
  onChange: (value: EducationScheduleGroupTimeSlot | null) => void
  onDelete?: () => void
}) {
  const initialTimeRange = useMemo((): [Dayjs, Dayjs] | null => {
    const start = parseEducationScheduleClock(slot?.startTime, dayjs())
    const end = parseEducationScheduleClock(slot?.endTime, dayjs())
    if (!start || !end) return null
    return [start, end]
  }, [slot?.startTime, slot?.endTime])

  return (
    <div className="program-registration-schedule-curriculum__time-group">
      {showGroupLabel ? `그룹 ${groupLetter}` : null}
      <div className="program-registration-schedule-curriculum__time-group-control">
        <ParagraphTimePicker
          endTimeAlwaysOn
          placeholder="시간 선택"
          width={200}
          value={initialTimeRange?.[0] ?? null}
          initialTimeRange={initialTimeRange}
          onTimeRangeChange={([start, end]) => {
            onChange({
              startTime: start.format('HH:mm'),
              endTime: end.format('HH:mm'),
            })
          }}
        />
        {onDelete ? (
          <ItemDeleteButton
            className="item-delete-button"
            aria-label={`그룹 ${groupLetter} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onDelete()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

const IPS_PREPARE_NONE_VALUE: ProgramRegistrationIpsTypeValue = {
  category: 'prepare',
  detail: 'none',
}

export type ProgramRegistrationEducationScheduleCurriculumParagraphProps = {
  scheduleDetailCount: number
  onDeleteScheduleCurriculumDetail: (detailIndex: number) => void
  scheduleGroupCount: number
  onDeleteScheduleCurriculumGroup: (groupIndex: number) => void
  /** 프로그램 유형 설정에서 IPS 유형이「일정 별 상이」일 때만 (단일·일부 복수 조합) 세부 일정 하단에 IPS 행 */
  ipsPerSchedule?: boolean
  sessionRoundType: ProgramRegistrationSessionRoundType
  participantOrganization: boolean
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  /** 카드 헤더「사전 교육」ON이면 일정 앞에 사전 교육 블록을 두고, 그 블록의 IPS만 Prepare로 고정 */
  scheduleCurriculumPreEducation?: boolean
}

export function ProgramRegistrationEducationScheduleCurriculumParagraph({
  scheduleDetailCount,
  onDeleteScheduleCurriculumDetail,
  scheduleGroupCount,
  onDeleteScheduleCurriculumGroup,
  ipsPerSchedule = false,
  sessionRoundType,
  participantOrganization,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
  scheduleCurriculumPreEducation = false,
}: ProgramRegistrationEducationScheduleCurriculumParagraphProps) {
  const detailCount = Math.max(1, scheduleDetailCount)
  const groupCount =
    sessionRoundType === 'multi'
      ? 1
      : Math.min(
          Math.max(1, scheduleGroupCount),
          PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
        )
  const multiAllPer = shouldUseScheduleEventBlockLayout({
    sessionRound: sessionRoundType,
    participantOrganization,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
  })

  const [ipsByDetailIndex] = useProgramRegistrationOverlayKv<
    Record<number, ProgramRegistrationIpsTypeValue>
  >('generalRegistration.educationScheduleCurriculum.ipsByDetailIndex', {})

  const [scheduleDateByDetail] = useProgramRegistrationOverlayKv<Record<number, string | null>>(
    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso',
    {}
  )

  const [assignmentByDetail] = useProgramRegistrationOverlayKv<
    Record<number, ScheduleEventAssignmentValue>
  >('generalRegistration.educationScheduleCurriculum.assignmentByDetail', {})

  const [groupTimeByDetail] = useProgramRegistrationOverlayKv<
    Record<number, Array<ScheduleGroupTimeSlot>>
  >(GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY, {})

  const [educationFormByDetail] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationScheduleCurriculum.educationFormByDetail',
    {}
  )

  const [participationByDetail] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationScheduleCurriculum.participationByDetail',
    {}
  )
  const [eventNameByDetail] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'generalRegistration.educationScheduleCurriculum.eventNameByDetail',
    {}
  )

  const [preEducationName, setPreEducationName] = useProgramRegistrationOverlayKv(
    'generalRegistration.educationScheduleCurriculum.preEducationName',
    PRE_EDUCATION_SCHEDULE_LABEL
  )

  const setIpsForDetail = (detailIndex: number, next: ProgramRegistrationIpsTypeValue) => {
    updateProgramRegistrationOverlayKey<Record<number, ProgramRegistrationIpsTypeValue>>(
      'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex',
      prev => ({ ...(prev ?? {}), [detailIndex]: next })
    )
  }

  const ipsTypeValueForDetail = (
    detailIndex: number,
    locked = false
  ): ProgramRegistrationIpsTypeValue =>
    locked
      ? IPS_PREPARE_NONE_VALUE
      : (ipsByDetailIndex[detailIndex] ?? { category: '', detail: '' })

  const setIpsForDetailUnlessLocked = (
    detailIndex: number,
    next: ProgramRegistrationIpsTypeValue,
    locked = false
  ) => {
    if (locked) return
    setIpsForDetail(detailIndex, next)
  }

  const educationFormForDetail = (detailIndex: number) =>
    educationFormByDetail[detailIndex] ?? 'online'
  const participationForDetail = (detailIndex: number) =>
    participationByDetail[detailIndex] ?? 'individual'

  const onEducationFormRadioChange = (detailIndex: number) => (e: RadioChangeEvent) => {
    const nextValue = String(e.target.value)
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationScheduleCurriculum.educationFormByDetail',
      prev => {
        const next = { ...(prev ?? {}), [detailIndex]: nextValue }
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

  const onParticipationRadioChange = (detailIndex: number) => (e: RadioChangeEvent) => {
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationScheduleCurriculum.participationByDetail',
      prev => ({ ...(prev ?? {}), [detailIndex]: String(e.target.value) })
    )
  }

  const groupTimeSlot = (detailIndex: number, groupIndex: number): ScheduleGroupTimeSlot =>
    groupTimeByDetail[detailIndex]?.[groupIndex] ?? null

  const setGroupTime = (
    detailIndex: number,
    groupIndex: number,
    value: EducationScheduleGroupTimeSlot | null
  ) => {
    updateProgramRegistrationOverlayKey<Record<number, Array<ScheduleGroupTimeSlot>>>(
      GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
      prev => {
        const base = prev ?? {}
        const nextValues = [...(base[detailIndex] ?? [])]
        while (nextValues.length <= groupIndex) nextValues.push(null)
        nextValues[groupIndex] = value
        return { ...base, [detailIndex]: nextValues }
      }
    )
  }

  const deleteScheduleGroup = (groupIndex: number) => {
    updateProgramRegistrationOverlayKey<Record<number, Array<ScheduleGroupTimeSlot>>>(
      GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
      prev =>
        Object.fromEntries(
          Object.entries(prev ?? {}).map(([detailIndex, values]) => [
            detailIndex,
            values.filter((_, index) => index !== groupIndex),
          ])
        )
    )
    onDeleteScheduleCurriculumGroup(groupIndex)
  }

  const handleDeleteScheduleDetail = (detailIndex: number) => {
    if (detailIndex <= 1) return
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex',
      prev =>
        reindexDetailRecordAfterDelete(
          (prev as Record<number, ProgramRegistrationIpsTypeValue>) ?? {},
          detailIndex
        )
    )
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso',
      prev =>
        reindexDetailRecordAfterDelete((prev as Record<number, string | null>) ?? {}, detailIndex)
    )
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.assignmentByDetail',
      prev =>
        reindexDetailRecordAfterDelete(
          (prev as Record<number, ScheduleEventAssignmentValue>) ?? {},
          detailIndex
        )
    )
    updateProgramRegistrationOverlayKey(
      GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
      prev =>
        reindexDetailRecordAfterDelete(
          (prev as Record<number, Array<ScheduleGroupTimeSlot>>) ?? {},
          detailIndex
        )
    )
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.educationFormByDetail',
      prev => reindexDetailRecordAfterDelete((prev as Record<number, string>) ?? {}, detailIndex)
    )
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.participationByDetail',
      prev => reindexDetailRecordAfterDelete((prev as Record<number, string>) ?? {}, detailIndex)
    )
    updateProgramRegistrationOverlayKey(
      'generalRegistration.educationScheduleCurriculum.eventNameByDetail',
      prev => reindexDetailRecordAfterDelete((prev as Record<number, string>) ?? {}, detailIndex)
    )
    onDeleteScheduleCurriculumDetail(detailIndex)
  }

  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    participantOrganization,
    { context: 'perScheduleBlock' }
  )

  const showParticipationMethod = !participantOrganization

  const multiRowPlan =
    sessionRoundType === 'multi'
      ? getProgramRegistrationCurriculumMultiSessionRowPlan(
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail
        )
      : null

  const showEducationWithIpsPerBlock = isScheduleEducationAndIpsBothPerSchedule(
    educationFormScheduleDetail,
    ipsScheduleDetail
  )

  const perBlockLayoutPlan = getScheduleDetailPerBlockLayoutPlan(
    sessionRoundType,
    educationFormScheduleDetail,
    ipsScheduleDetail
  )

  const eventExtraPlan = getScheduleEventPerScheduleExtraPlan({
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
    participantOrganization,
  })

  const assignmentForDetail = (detailIndex: number) =>
    assignmentByDetail[detailIndex] ?? EMPTY_SCHEDULE_EVENT_ASSIGNMENT

  const setAssignmentForDetail = (detailIndex: number, next: ScheduleEventAssignmentValue) => {
    updateProgramRegistrationOverlayKey<Record<number, ScheduleEventAssignmentValue>>(
      'generalRegistration.educationScheduleCurriculum.assignmentByDetail',
      prev => ({ ...(prev ?? {}), [detailIndex]: next })
    )
  }

  const renderEducationFormField = (
    detailIndex: number,
    options?: { fullRow?: boolean }
  ) => (
    <DetailInfoForm.Field
      label="교육 형태"
      fullRow={options?.fullRow}
      edit={
        <CmsRadioGroup
          size="large"
          value={educationFormForDetail(detailIndex)}
          onChange={onEducationFormRadioChange(detailIndex)}
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

  const renderParticipationField = (
    detailIndex: number,
    options?: { fullRow?: boolean }
  ) => (
    <DetailInfoForm.Field
      label="참여 방식"
      fullRow={options?.fullRow}
      edit={
        <CmsRadioGroup
          size="large"
          value={participationForDetail(detailIndex)}
          onChange={onParticipationRadioChange(detailIndex)}
        >
          <CmsRadio value="individual">개인</CmsRadio>
          <CmsRadio value="team">팀</CmsRadio>
        </CmsRadioGroup>
      }
      view="-"
    />
  )

  const renderEventPerScheduleExtraRows = (detailIndex: number): ReactNode => {
    const assignment = assignmentForDetail(detailIndex)
    const assignmentField = (fullRow: boolean) => (
      <DetailInfoForm.Field
        label="과제 설정"
        fullRow={fullRow}
        view={
          <CurriculumAssignmentSettingView
            assignmentEnabled={assignment.enabled}
            assignmentPeriod={assignment.period}
          />
        }
        edit={
          <ScheduleDetailAssignmentInputs
            value={assignment}
            onChange={next => setAssignmentForDetail(detailIndex, next)}
          />
        }
      />
    )
    const showEducation = eventExtraPlan.showEducation
    const showIps = eventExtraPlan.showIps
    const showParticipation = eventExtraPlan.showParticipation
    const showAssignment = eventExtraPlan.showAssignment
    return (
      <>
        {showEducation && showIps ? (
          <DetailInfoForm.Row type="double">
            {renderEducationFormField(detailIndex)}
            {renderIpsFormField(detailIndex, { layout: 'inline' })}
          </DetailInfoForm.Row>
        ) : showEducation ? (
          <DetailInfoForm.Row type="single">
            {renderEducationFormField(detailIndex, { fullRow: true })}
          </DetailInfoForm.Row>
        ) : showIps ? (
          <DetailInfoForm.Row type="single">
            {renderIpsFormField(detailIndex, { fullRow: true })}
          </DetailInfoForm.Row>
        ) : null}
        {showParticipation ? (
          <DetailInfoForm.Row type="double">
            {assignmentField(false)}
            {renderParticipationField(detailIndex)}
          </DetailInfoForm.Row>
        ) : showAssignment ? (
          <DetailInfoForm.Row type="single">{assignmentField(true)}</DetailInfoForm.Row>
        ) : null}
      </>
    )
  }

  const renderIpsFormField = (
    detailIndex: number,
    options?: { fullRow?: boolean; layout?: 'default' | 'inline'; disabled?: boolean }
  ) => (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow={options?.fullRow}
      edit={
        <ProgramRegistrationIpsTypeFields
          layout={options?.layout}
          value={ipsTypeValueForDetail(detailIndex, options?.disabled)}
          onChange={next => setIpsForDetailUnlessLocked(detailIndex, next, options?.disabled)}
          disabled={options?.disabled}
        />
      }
      view="-"
    />
  )

  const renderPreEducationPerScheduleExtraRows = (): ReactNode => {
    if (eventExtraPlan.showIps) {
      return (
        <DetailInfoForm.Row type="double">
          {renderEducationFormField(PRE_EDUCATION_DETAIL_INDEX)}
          {renderIpsFormField(PRE_EDUCATION_DETAIL_INDEX, {
            layout: 'inline',
            disabled: true,
          })}
        </DetailInfoForm.Row>
      )
    }
    return (
      <DetailInfoForm.Row type="single">
        {renderEducationFormField(PRE_EDUCATION_DETAIL_INDEX, { fullRow: true })}
      </DetailInfoForm.Row>
    )
  }

  const renderPerBlockLayoutRows = (detailIndex: number): ReactNode => {
    if (perBlockLayoutPlan === 'none') return null
    const assignment = assignmentForDetail(detailIndex)
    const showAssignment = !participantOrganization

    if (perBlockLayoutPlan === 'assignment_education_then_ips') {
      if (!showAssignment) {
        return (
          <DetailInfoForm.Row type="double">
            {renderEducationFormField(detailIndex)}
            {renderIpsFormField(detailIndex, { layout: 'inline' })}
          </DetailInfoForm.Row>
        )
      }
      return (
        <>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="과제 설정"
              edit={
                <ScheduleDetailAssignmentInputs
                  value={assignment}
                  onChange={next => setAssignmentForDetail(detailIndex, next)}
                />
              }
              view="-"
            />
            {renderEducationFormField(detailIndex)}
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            {renderIpsFormField(detailIndex, { fullRow: true })}
          </DetailInfoForm.Row>
        </>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_education') {
      if (!showAssignment) {
        return (
          <DetailInfoForm.Row type="single">
            {renderEducationFormField(detailIndex, { fullRow: true })}
          </DetailInfoForm.Row>
        )
      }
      return (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="과제 설정"
            edit={
              <ScheduleDetailAssignmentInputs
                value={assignment}
                onChange={next => setAssignmentForDetail(detailIndex, next)}
              />
            }
            view="-"
          />
          {renderEducationFormField(detailIndex)}
        </DetailInfoForm.Row>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_ips') {
      if (!showAssignment) {
        return (
          <DetailInfoForm.Row type="single">
            {renderIpsFormField(detailIndex, { fullRow: true })}
          </DetailInfoForm.Row>
        )
      }
      return (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="과제 설정"
            edit={
              <ScheduleDetailAssignmentInputs
                value={assignment}
                onChange={next => setAssignmentForDetail(detailIndex, next)}
              />
            }
            view="-"
          />
          {renderIpsFormField(detailIndex, { layout: 'inline' })}
        </DetailInfoForm.Row>
      )
    }

    return null
  }

  const renderParticipationRows = (detailIndex: number): ReactNode => {
    if (sessionRoundType !== 'multi' || multiRowPlan == null) return null

    if (multiRowPlan === 'c_allCommon_piBothPer') {
      if (
        !showParticipationMethod ||
        shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail
        )
      ) {
        return null
      }
      return (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="참여 방식"
            edit={
              <CmsRadioGroup
                size="large"
                value={participationForDetail(detailIndex)}
                onChange={onParticipationRadioChange(detailIndex)}
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

    if (showParticipationMethod && multiRowPlan === 'c_allCommon_piPartPerOnly') {
      return (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="참여 방식"
            edit={
              <CmsRadioGroup
                size="large"
                value={participationForDetail(detailIndex)}
                onChange={onParticipationRadioChange(detailIndex)}
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

    if (
      multiRowPlan === 'p_eduPer_piAnyPer' &&
      participationScheduleDetail === 'perSchedule' &&
      showParticipationMethod
    ) {
      if (showEducationWithIpsPerBlock) {
        return (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="참여 방식"
              edit={
                <CmsRadioGroup
                  size="large"
                  value={participationForDetail(detailIndex)}
                  onChange={onParticipationRadioChange(detailIndex)}
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

      if (educationFormScheduleDetail === 'perSchedule') {
        return (
          <DetailInfoForm.Row type="double">
            {renderEducationFormField(detailIndex)}
            <DetailInfoForm.Field
              label="참여 방식"
              edit={
                <CmsRadioGroup
                  size="large"
                  value={participationForDetail(detailIndex)}
                  onChange={onParticipationRadioChange(detailIndex)}
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
    }

    return null
  }

  const renderGroupTimeField = (detailIndex: number) => (
    <div className="program-registration-schedule-curriculum__time-groups">
      {Array.from({ length: groupCount }, (_, gi) => {
        const letter = groupLetter(gi)
        return (
          <Fragment key={`${detailIndex}-${letter}`}>
            {gi > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <ScheduleCurriculumGroupTimeRow
              groupLetter={letter}
              showGroupLabel={groupCount > 1}
              slot={groupTimeSlot(detailIndex, gi)}
              onChange={value => setGroupTime(detailIndex, gi, value)}
              onDelete={gi > 0 ? () => deleteScheduleGroup(gi) : undefined}
            />
          </Fragment>
        )
      })}
    </div>
  )

  const renderDetailDeleteButton = (detailIndex: number, label: string) =>
    detailIndex > 1 ? (
      <ItemDeleteButton
        className="item-delete-button program-registration-curriculum__session-delete"
        aria-label={`${label} 삭제`}
        onClick={event => {
          event.stopPropagation()
          handleDeleteScheduleDetail(detailIndex)
        }}
      />
    ) : null

  const renderEventProgressScheduleField = (detailIndex: number) => {
    const scheduleRange = overlayScheduleToRange(scheduleDateByDetail[detailIndex])
    const scheduleHasClock = Boolean(
      scheduleRange && educationScheduleRangeHasClock(scheduleRange)
    )
    return (
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
            updateProgramRegistrationOverlayKey<Record<number, string | null>>(
              'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso',
              prev => ({
                ...(prev ?? {}),
                [detailIndex]: formatEducationScheduleLineFromRange([start, end]),
              })
            )
          }
          width="100%"
          placeholder="일정을 선택하세요"
        />
      </div>
    )
  }

  const renderPreEducationEventBlock = () =>
    scheduleCurriculumPreEducation ? (
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
                      value={preEducationName}
                      placeholder="행사 일정명을 작성하세요"
                      width="100%"
                      style={{ minWidth: 0, flex: '1 1 0' }}
                      onChange={event => setPreEducationName(event.target.value)}
                    />
                  }
                  view="-"
                />
                <DetailInfoForm.Field
                  label="진행 일정"
                  edit={renderEventProgressScheduleField(PRE_EDUCATION_DETAIL_INDEX)}
                  view="-"
                />
              </DetailInfoForm.Row>
              {renderPreEducationPerScheduleExtraRows()}
            </DetailInfoForm>
          </div>
        </div>
      </div>
    ) : null

  if (multiAllPer) {
    const showEventHeadings = detailCount > 1 || scheduleCurriculumPreEducation
    return (
      <>
        {renderPreEducationEventBlock()}
        {Array.from({ length: detailCount }, (_, i) => {
          const n = i + 1
          return (
            <div key={n} className="program-registration-schedule-curriculum__block">
              {showEventHeadings ? (
                <div className="program-registration-schedule-curriculum__session-heading">
                  ■ 행사 일정 {pad2(n)}
                </div>
              ) : null}
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
                            placeholder="행사 일정명을 작성하세요"
                            width="100%"
                            style={{ minWidth: 0, flex: '1 1 0' }}
                            value={eventNameByDetail[n] ?? ''}
                            onChange={event =>
                              updateProgramRegistrationOverlayKey<Record<number, string>>(
                                'generalRegistration.educationScheduleCurriculum.eventNameByDetail',
                                prev => ({ ...(prev ?? {}), [n]: event.target.value })
                              )
                            }
                          />
                        }
                        view="-"
                      />
                      <DetailInfoForm.Field
                        label="진행 일정"
                        edit={renderEventProgressScheduleField(n)}
                        view="-"
                      />
                    </DetailInfoForm.Row>
                    {renderEventPerScheduleExtraRows(n)}
                  </DetailInfoForm>
                </div>
                {renderDetailDeleteButton(n, `행사 일정 ${pad2(n)}`)}
              </div>
            </div>
          )
        })}
      </>
    )
  }

  const isSingleRound = sessionRoundType === 'single'

  return (
    <>
      {renderPreEducationEventBlock()}
      {Array.from({ length: detailCount }, (_, i) => {
        const n = i + 1
        return (
          <div key={n} className="program-registration-schedule-curriculum__block">
            {detailCount > 1 || scheduleCurriculumPreEducation ? (
              <div className="program-registration-schedule-curriculum__session-heading">
                ■ 세부 일정 {pad2(n)}
              </div>
            ) : null}
            <div className="program-registration-curriculum__session-row">
              <div className="program-registration-schedule-curriculum__session-panel">
                <DetailInfoForm
                  title="교육 진행 (일정형)"
                  hideHeader
                  mode="edit"
                  className="program-registration-paragraph"
                >
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="일정명"
                      fullRow
                      edit={
                        <CmsInput
                          inputSize="medium"
                          placeholder="세부 일정명을 작성하세요"
                          width="100%"
                          value={eventNameByDetail[n] ?? ''}
                          onChange={event =>
                            updateProgramRegistrationOverlayKey<Record<number, string>>(
                              'generalRegistration.educationScheduleCurriculum.eventNameByDetail',
                              prev => ({ ...(prev ?? {}), [n]: event.target.value })
                            )
                          }
                        />
                      }
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="진행 시간"
                      fullRow
                      edit={renderGroupTimeField(n)}
                      view="-"
                    />
                  </DetailInfoForm.Row>
                  {isSingleRound && ipsPerSchedule ? (
                    <DetailInfoForm.Row type="single">
                      {renderIpsFormField(n, { fullRow: true })}
                    </DetailInfoForm.Row>
                  ) : null}
                  {!isSingleRound ? (
                    <>
                      {renderPerBlockLayoutRows(n)}
                      {renderParticipationRows(n)}
                    </>
                  ) : null}
                </DetailInfoForm>
              </div>
              {renderDetailDeleteButton(n, `세부 일정 ${pad2(n)}`)}
            </div>
          </div>
        )
      })}
    </>
  )
}
