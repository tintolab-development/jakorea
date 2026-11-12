import { useEffect, type CSSProperties, type ReactNode } from 'react'
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
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  getProgramRegistrationEducationFormOptions,
} from './program-registration-education-form-options'
import {
  isEducationPlaceRowVisible,
  resolveEducationPlaceCommonEducationForm,
} from './program-registration-education-place-rules'
import { GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS } from '@/features/program/general/lib/curriculum-progress-session-options'
import {
  PRE_EDUCATION_SCHEDULE_LABEL,
  toPreEducationHeadingLabel,
} from '@/features/program/general/lib/schedule-detail-form'
import { getIndividualMultiRoundPerScheduleTableRows } from '@/features/program/general/lib/individual-per-schedule-table'
import { IndividualPerScheduleExtraRows } from './individual-per-schedule-extra-rows'
import {
  EMPTY_EDUCATION_PLACE_RECORD,
  ProgramRegistrationEducationPlacePerScheduleRow,
  educationPlaceRecordKeyOf,
} from './program-registration-education-place-fields'
import { REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT,
  ProgramRegistrationMultiRoundAssignmentFields,
  type ProgramRegistrationMultiRoundAssignmentValue,
} from './program-registration-multi-round-assignment-fields'
import { EducationProgressScheduleDatePicker } from '@/features/template/ui/shared/education-progress-schedule-date-picker'
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
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import './program-registration-paragraph.css'

/** 교육 내용 입력 플레이스홀더 — 일반 프로그램 등록 위저드는 시안 문구, 그 외(교육받은 교사·상세 수정)는 기존 문구 */
function useCurriculumContentPlaceholder(): string {
  return useIsGeneralRegistrationWizard() ? '교육 내용을 작성해 주세요' : '교육 내용을 작성하세요'
}

const EMPTY_STRING_BY_INDEX: Record<number, string> = {}
const CURRICULUM_UNIT_NAME_KEY = 'generalRegistration.educationCurriculum.unitNameBySession'
const CURRICULUM_UNIT_CONTENT_KEY = 'generalRegistration.educationCurriculum.unitContentBySession'
const CURRICULUM_ROUND_CONTENT_KEY = 'generalRegistration.educationCurriculum.roundContentByRound'
const CURRICULUM_PRE_EDUCATION_NAME_KEY =
  'generalRegistration.educationCurriculum.preEducationScheduleName'

function CurriculumOverlayTextInput({
  recordKey,
  index,
  placeholder,
  style,
}: {
  recordKey: string
  index: number
  placeholder: string
  style?: CSSProperties
}) {
  const [record] = useProgramRegistrationOverlayKv<Record<number, string>>(
    recordKey,
    EMPTY_STRING_BY_INDEX
  )
  return (
    <CmsInput
      inputSize="small"
      placeholder={placeholder}
      width="100%"
      style={style}
      value={record[index] ?? ''}
      onChange={event => {
        const nextValue = event.target.value
        updateProgramRegistrationOverlayKey<Record<number, string>>(recordKey, prev => {
          const current = prev ?? EMPTY_STRING_BY_INDEX
          if ((current[index] ?? '') === nextValue) return current
          return { ...current, [index]: nextValue }
        })
      }}
    />
  )
}

function PreEducationScheduleNameInput() {
  const [name, setName] = useProgramRegistrationOverlayKv(
    CURRICULUM_PRE_EDUCATION_NAME_KEY,
    PRE_EDUCATION_SCHEDULE_LABEL
  )
  return (
    <CmsInput
      inputSize="small"
      value={name}
      placeholder="행사 일정명을 작성하세요"
      width="100%"
      style={{ minWidth: 0, flex: '1 1 0' }}
      onChange={event => setName(event.target.value)}
    />
  )
}

const PRE_EDUCATION_SESSION_INDEX = 0

type ProgramRegistrationEducationCurriculumParagraphProps = {
  sessionRoundType: ProgramRegistrationSessionRoundType
  participantIndividual: boolean
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
  /** 사전 교육/교육 연수 블록 헤딩 라벨 (기본: 사전 교육) */
  preEducationBlockLabel?: string
  /**
   * prepend: 별도 사전교육 블록을 앞에 추가 (일반 기본)
   * replaceFirst: 첫 차시/회차를 연수로 치환 (교육받은 교사)
   */
  preEducationDisplayMode?: 'prepend' | 'replaceFirst'
  /** 교육받은 교사 — 과제 설정 비노출 (교육일지와 구분) */
  hideAssignmentSettings?: boolean
  /** 일반 등록·참여자 <개인> — 교육 진행 장소(일정 별 상이 시 블록 최하단) */
  educationPlaceEnabled?: boolean
  /**
   * 교육받은 교사 「교사 연수」(시안 9899:221372) — prepend 블록에 일정명 행을 두지 않고
   * 진행 일정 · 교육 형태 | IPS(Prepare 고정)만. 일정명은 서버 teacherTrainingScheduleName.
   * 생략 시 기존(일반 사전 교육) 동작 그대로.
   */
  hidePreEducationScheduleName?: boolean
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

function ProgramRegistrationCurriculumUnitContentInputs({ chartIndex }: { chartIndex: number }) {
  const contentPlaceholder = useCurriculumContentPlaceholder()
  return (
    <div className="detail-info-form-inputs-wrapper">
      <CurriculumOverlayTextInput
        recordKey={CURRICULUM_UNIT_NAME_KEY}
        index={chartIndex}
        placeholder="단원명을 입력해 주세요"
        style={{ minWidth: 0, flex: '1 1 0' }}
      />
      <DetailInfoForm.InputsSeparator />
      <CurriculumOverlayTextInput
        recordKey={CURRICULUM_UNIT_CONTENT_KEY}
        index={chartIndex}
        placeholder={contentPlaceholder}
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
  const contentPlaceholder = useCurriculumContentPlaceholder()
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={fieldLabel ?? `${roundIndex}회차 수업`}
        validationKey={[
          `curriculum.progressSession[${roundIndex}]`,
          `curriculum.roundContent[${roundIndex}]`,
        ]}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <CmsSelect
              inputSize="small"
              withAllOption={false}
              placeholder="진행 차시"
              width={144}
              options={GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS}
              value={progressSession || undefined}
              onChange={v => onProgressSessionChange(String(v ?? ''))}
            />
            <DetailInfoForm.InputsSeparator />
            <CurriculumOverlayTextInput
              recordKey={CURRICULUM_ROUND_CONTENT_KEY}
              index={roundIndex}
              placeholder={contentPlaceholder}
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
              validationKey={[
                `curriculum.unitName[${chartIndex}]`,
                `curriculum.unitContent[${chartIndex}]`,
              ]}
              fullRow
              edit={<ProgramRegistrationCurriculumUnitContentInputs chartIndex={chartIndex} />}
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
  participantIndividual,
  participantOrganization,
  curriculumSessionCount,
  onDeleteCurriculumSession,
  curriculumChartSessionCount,
  onDeleteCurriculumChartSession,
  educationFormScheduleDetail,
  participationScheduleDetail,
  ipsScheduleDetail,
  scheduleCurriculumPreEducation = false,
  preEducationBlockLabel = PRE_EDUCATION_SCHEDULE_LABEL,
  preEducationDisplayMode = 'prepend',
  hideAssignmentSettings = false,
  educationPlaceEnabled = false,
  hidePreEducationScheduleName = false,
}: ProgramRegistrationEducationCurriculumParagraphProps) {
  const [educationPlaceScheduleDetail] = useProgramRegistrationOverlayKv<string>(
    REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
    'common'
  )
  const showEducationPlacePerSchedule =
    educationPlaceEnabled && educationPlaceScheduleDetail === 'perSchedule'
  const educationPlaceRecordKey = educationPlaceRecordKeyOf('curriculumSession')
  const [educationPlaceRecord] = useProgramRegistrationOverlayKv<Record<number, string>>(
    educationPlaceRecordKey,
    EMPTY_EDUCATION_PLACE_RECORD
  )
  const handleEducationPlaceChange = (index: number, next: string) => {
    updateProgramRegistrationOverlayKey<Record<number, string>>(educationPlaceRecordKey, prev => ({
      ...(prev ?? {}),
      [index]: next,
    }))
  }
  const replaceFirstTraining =
    scheduleCurriculumPreEducation && preEducationDisplayMode === 'replaceFirst'
  const prependTraining = scheduleCurriculumPreEducation && preEducationDisplayMode === 'prepend'
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
  // 블록 제목 표시만 「사전 교육」 — overlay 기본 일정명은 저장 라벨 그대로 기록한다.
  const preEducationHeadingLabel = toPreEducationHeadingLabel(preEducationBlockLabel)

  useEffect(() => {
    // 일정명 행이 없는 교사 연수는 일정명을 기록하지 않는다 (서버 연수 일정명이 정본)
    if (!prependTraining || hidePreEducationScheduleName) return
    updateProgramRegistrationOverlayKey<string>(CURRICULUM_PRE_EDUCATION_NAME_KEY, prev =>
      typeof prev === 'string' && prev.trim() ? prev : PRE_EDUCATION_SCHEDULE_LABEL
    )
  }, [prependTraining, hidePreEducationScheduleName])

  // 사전 교육 교육 형태 — 라디오 표시 기본값(online)을 overlay에 기록. 미터치·자동채우기 후 0번 누락 방지
  const preEducationEducationFormMissing = !educationFormBySession?.[PRE_EDUCATION_SESSION_INDEX]
  useEffect(() => {
    if (!prependTraining || !preEducationEducationFormMissing) return
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.educationFormBySession',
      prev =>
        prev?.[PRE_EDUCATION_SESSION_INDEX]
          ? prev
          : { ...(prev ?? {}), [PRE_EDUCATION_SESSION_INDEX]: 'online' }
    )
  }, [prependTraining, preEducationEducationFormMissing])

  const educationFormForSession = (sessionIndex: number) =>
    educationFormBySession[sessionIndex] ?? 'online'
  const [singleEducationForm] = useProgramRegistrationOverlayKv<string>(
    'generalRegistration.typeSettings.singleEducationForm',
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
  const [multiCommonEducationForm] = useProgramRegistrationOverlayKv<string>(
    'generalRegistration.typeSettings.multiCommonEducationForm',
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
  /** 교육 형태 「온라인」 행은 교육 진행 장소 숨김·필수 제외 */
  const isEducationPlaceVisibleAt = (index: number) =>
    isEducationPlaceRowVisible({
      sessionRoundType,
      educationFormScheduleDetail,
      commonEducationForm: resolveEducationPlaceCommonEducationForm({
        sessionRoundType,
        singleEducationForm,
        multiCommonEducationForm,
      }),
      rowEducationForm: educationFormBySession[index],
    })
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
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.unitNameBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.unitContentBySession',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(educationPlaceRecordKey, prev =>
      reindexSessionRecordAfterDelete(prev ?? {}, chartIndex)
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
    updateProgramRegistrationOverlayKey<Record<number, string>>(
      'generalRegistration.educationCurriculum.roundContentByRound',
      prev => reindexSessionRecordAfterDelete(prev ?? {}, roundIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(educationPlaceRecordKey, prev =>
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
          size="medium"
          value={educationFormForSession(PRE_EDUCATION_SESSION_INDEX)}
          onChange={onEducationFormRadioChange(PRE_EDUCATION_SESSION_INDEX)}
        >
          {perScheduleEducationFormOptions.map(opt => (
            <CmsRadio size="medium" key={opt.value} value={opt.value}>
              {opt.label}
            </CmsRadio>
          ))}
        </CmsRadioGroup>
      }
      view="-"
    />
  )

  const renderIndividualPreEducationScheduleBlock = () => {
    const scheduleRange = parseStoredEducationScheduleRange(preEducationScheduleLine)
    const scheduleHasClock = Boolean(scheduleRange && educationScheduleRangeHasClock(scheduleRange))
    return (
      <div key="pre-education" className="program-registration-schedule-curriculum__block">
        <div className="program-registration-schedule-curriculum__session-heading">
          ■ {preEducationHeadingLabel}
        </div>
        <div className="program-registration-curriculum__session-row">
          <div className="program-registration-schedule-curriculum__session-panel">
            <DetailInfoForm
              title="교육 진행 (일정형)"
              hideHeader
              mode="edit"
              className="program-registration-paragraph"
            >
              <DetailInfoForm.Row type={hidePreEducationScheduleName ? 'single' : 'double'}>
                {hidePreEducationScheduleName ? null : (
                  <DetailInfoForm.Field
                    label="일정명"
                    validationKey="curriculum.preEducationScheduleName"
                    edit={<PreEducationScheduleNameInput />}
                    view="-"
                  />
                )}
                <DetailInfoForm.Field
                  label="진행 일정"
                  validationKey="curriculum.preEducationScheduleLine"
                  fullRow={hidePreEducationScheduleName}
                  edit={
                    <div className="detail-info-form-inputs-wrapper-no-gap">
                      <EducationProgressScheduleDatePicker
                        participantIndividual={participantIndividual}
                        participantOrganization={participantOrganization}
                        programType="curriculum"
                        sessionRound={sessionRoundType}
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
                      />
                    </div>
                  }
                  view="-"
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                {renderPreEducationEducationFormField()}
                {renderLockedPreEducationIpsField({ layout: 'inline' })}
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
        </div>
      </div>
    )
  }

  const renderPreEducationChartBlock = () => {
    if (!prependTraining) return null
    return renderIndividualPreEducationScheduleBlock()
  }

  const isTrainingSession = (index: number) => replaceFirstTraining && index === 1

  const renderLockedTrainingIpsRow = () => (
    <DetailInfoForm.Row type="single">
      {renderLockedPreEducationIpsField({ fullRow: true })}
    </DetailInfoForm.Row>
  )

  if (sessionRoundType === 'single') {
    const isSingleIpsPerChart = ipsScheduleDetail === 'perSchedule'
    // 시안 — 차시가 1개여도 차시별 표 위에 「■ 1차시」 소제목을 둔다.
    const showChartSessionHeading = true

    return (
      <div className="program-registration-curriculum__sessions">
        {renderPreEducationChartBlock()}
        {Array.from({ length: curriculumChartSessionCount }, (_, i) => {
          const chartIndex = i + 1
          const trainingSession = isTrainingSession(chartIndex)
          const ipsValue = ipsBySession[chartIndex] ?? { category: '', detail: '' }
          const ipsExtraRows = trainingSession ? (
            renderLockedTrainingIpsRow()
          ) : isSingleIpsPerChart ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                validationKey={`curriculum.ips[${chartIndex}]`}
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
          ) : null
          const extraRows =
            showEducationPlacePerSchedule &&
            !trainingSession &&
            isEducationPlaceVisibleAt(chartIndex) ? (
              <>
                {ipsExtraRows}
                <ProgramRegistrationEducationPlacePerScheduleRow
                  kind="curriculumSession"
                  index={chartIndex}
                  value={educationPlaceRecord[chartIndex] ?? ''}
                  onChange={handleEducationPlaceChange}
                />
              </>
            ) : (
              ipsExtraRows
            )
          return (
            <ProgramRegistrationCurriculumChartSessionBlock
              key={chartIndex}
              chartIndex={chartIndex}
              headingLabel={trainingSession ? preEducationHeadingLabel : undefined}
              showHeading={showChartSessionHeading || trainingSession}
              onDeleteCurriculumChartSession={handleDeleteChartSession}
              extraRows={extraRows}
            />
          )
        })}
      </div>
    )
  }

  const showParticipationMethod = !participantOrganization
  const individualExtraRows = showParticipationMethod
    ? getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
      })
    : []

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
            size="medium"
            value={educationFormForSession(roundIndex)}
            onChange={onEducationFormRadioChange(roundIndex)}
          >
            {perScheduleEducationFormOptions.map(opt => (
              <CmsRadio size="medium" key={opt.value} value={opt.value}>
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
            validationKey={`curriculum.ips[${roundIndex}]`}
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
          size="medium"
          value={participationForSession(roundIndex)}
          onChange={onParticipationRadioChange(roundIndex)}
        >
          <CmsRadio size="medium" value="individual">
            개인
          </CmsRadio>
          <CmsRadio size="medium" value="team">
            팀
          </CmsRadio>
        </CmsRadioGroup>
      }
      view="-"
    />
  )

  const renderMultiRoundPlanExtraRows = (roundIndex: number): ReactNode => {
    if (educationFormScheduleDetail === 'perSchedule') {
      return renderEducationFormPerScheduleRow(roundIndex)
    }

    if (multiRowPlan === 'c_allCommon_piBothPer') {
      return (
        <>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="IPS 유형"
              validationKey={`curriculum.ips[${roundIndex}]`}
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
                    size="medium"
                    value={participationForSession(roundIndex)}
                    onChange={onParticipationRadioChange(roundIndex)}
                  >
                    <CmsRadio size="medium" value="individual">
                      개인
                    </CmsRadio>
                    <CmsRadio size="medium" value="team">
                      팀
                    </CmsRadio>
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
                size="medium"
                value={participationForSession(roundIndex)}
                onChange={onParticipationRadioChange(roundIndex)}
              >
                <CmsRadio size="medium" value="individual">
                  개인
                </CmsRadio>
                <CmsRadio size="medium" value="team">
                  팀
                </CmsRadio>
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
      {prependTraining ? renderIndividualPreEducationScheduleBlock() : null}
      {Array.from({ length: curriculumSessionCount }, (_, i) => {
        const roundIndex = i + 1
        const progressSession = progressSessionByRound[roundIndex] ?? ''
        const trainingSession = isTrainingSession(roundIndex)
        const roundHeading = trainingSession ? preEducationHeadingLabel : `${roundIndex}회차`

        return (
          <div key={roundIndex} className="program-registration-curriculum__session-block">
            {curriculumSessionCount > 1 || scheduleCurriculumPreEducation || trainingSession ? (
              <div className="program-registration-curriculum__session-heading">
                ■ {roundHeading}
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
                {showParticipationMethod ? (
                  <IndividualPerScheduleExtraRows
                    rows={individualExtraRows}
                    renderField={(field, options) => {
                      if (field === 'assignment') {
                        if (hideAssignmentSettings) return null
                        return (
                          <ProgramRegistrationMultiRoundAssignmentFields
                            embedded
                            fullRow={options.fullRow}
                            validationKey={`curriculum.assignment[${roundIndex}]`}
                            value={assignmentForRound(roundIndex)}
                            onChange={next => setAssignmentForRound(roundIndex, next)}
                          />
                        )
                      }
                      if (field === 'education') {
                        return (
                          <DetailInfoForm.Field
                            label="교육 형태"
                            fullRow={options.fullRow}
                            edit={
                              <CmsRadioGroup
                                size="medium"
                                value={educationFormForSession(roundIndex)}
                                onChange={onEducationFormRadioChange(roundIndex)}
                              >
                                {perScheduleEducationFormOptions.map(opt => (
                                  <CmsRadio size="medium" key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </CmsRadio>
                                ))}
                              </CmsRadioGroup>
                            }
                            view="-"
                          />
                        )
                      }
                      if (field === 'ips') {
                        return (
                          <DetailInfoForm.Field
                            label="IPS 유형"
                            validationKey={`curriculum.ips[${roundIndex}]`}
                            fullRow={options.fullRow}
                            edit={
                              <ProgramRegistrationIpsTypeFields
                                layout={options.layout}
                                value={ipsBySession[roundIndex] ?? { category: '', detail: '' }}
                                onChange={(next: ProgramRegistrationIpsTypeValue) =>
                                  setSessionIps(roundIndex, next)
                                }
                              />
                            }
                            view="-"
                          />
                        )
                      }
                      return renderParticipationField(roundIndex, { fullRow: options.fullRow })
                    }}
                  />
                ) : trainingSession ? (
                  renderLockedTrainingIpsRow()
                ) : (
                  renderMultiRoundPlanExtraRows(roundIndex)
                )}
                {showEducationPlacePerSchedule &&
                !trainingSession &&
                isEducationPlaceVisibleAt(roundIndex) ? (
                  <ProgramRegistrationEducationPlacePerScheduleRow
                    kind="curriculumSession"
                    index={roundIndex}
                    value={educationPlaceRecord[roundIndex] ?? ''}
                    onChange={handleEducationPlaceChange}
                  />
                ) : null}
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
