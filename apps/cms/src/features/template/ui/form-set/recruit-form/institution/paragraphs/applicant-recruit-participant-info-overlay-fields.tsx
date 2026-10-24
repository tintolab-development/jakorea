import { memo, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  syncInstitutionApplicationBridgeFromApplicantRecruitOverlay,
  useApplicantRecruitInstitutionOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  RecruitInquiryContactRow,
  RecruitNotesRow,
  RECRUIT_FORM_MAX_SUFFIX_CLASS,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import { CmsNumericInput } from '@/shared/ui/numeric-input'

type RangeSeal = { start: string; end: string } | null

const NEED_OR_NOT_OPTIONS = [
  { label: '필요', value: 'need' },
  { label: '불필요', value: 'none' },
] as const

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'
const MAX_SUFFIX_CLASS = RECRUIT_FORM_MAX_SUFFIX_CLASS

function NumberWithSuffixRow({
  placeholder,
  suffix,
  value,
  onChange,
}: {
  placeholder: string
  suffix: string
  value: string
  onChange: (next: number | undefined) => void
}) {
  return (
    <div className={MAX_SUFFIX_CLASS}>
      <CmsNumericInput
        inputSize="small"
        mode="integer"
        min={0}
        placeholder={placeholder}
        width={120}
        value={value}
        onValueChange={raw => onChange(parsePositiveIntInput(raw))}
      />
      <span style={{ marginLeft: 6 }}>{suffix}</span>
    </div>
  )
}

function NeedOrNotRadioGroup({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <CmsRadioGroup
      size="medium"
      value={value}
      onChange={e => onChange(String(e.target.value))}
      className={RECRUITMENT_RADIO_CLASS}
    >
      {NEED_OR_NOT_OPTIONS.map(option => (
        <CmsRadio key={option.value} value={option.value} size="medium">
          {option.label}
        </CmsRadio>
      ))}
    </CmsRadioGroup>
  )
}

export const ApplicantRecruitInstitutionBridgeSync = memo(function ApplicantRecruitInstitutionBridgeSync({
  isTrainedTeachers,
}: {
  isTrainedTeachers: boolean
}) {
  const [preguidanceRequired] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
    'need'
  )
  const [maxInstructors] = useApplicantRecruitInstitutionOverlayKv<number | undefined>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors,
    undefined
  )
  const [maxClassCount] = useApplicantRecruitInstitutionOverlayKv<number | undefined>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount,
    undefined
  )
  const [maxScheduleCount] = useApplicantRecruitInstitutionOverlayKv<number | undefined>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount,
    undefined
  )
  const [maxSessionsPerDay] = useApplicantRecruitInstitutionOverlayKv<number | undefined>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay,
    undefined
  )

  useEffect(() => {
    syncInstitutionApplicationBridgeFromApplicantRecruitOverlay(undefined, {
      preEducationNoticeRequired: isTrainedTeachers ? false : preguidanceRequired === 'need',
      maxAssignableInstructors: isTrainedTeachers ? 0 : maxInstructors,
    })
  }, [
    isTrainedTeachers,
    preguidanceRequired,
    maxInstructors,
    maxClassCount,
    maxScheduleCount,
    maxSessionsPerDay,
  ])

  return null
})

export const ApplicantRecruitAnnouncementPublishedField = memo(
  function ApplicantRecruitAnnouncementPublishedField({
    fullRow = false,
  }: {
    fullRow?: boolean
  }) {
    const [announcementPublished, setAnnouncementPublished] =
      useApplicantRecruitInstitutionOverlayKv<ParticipantRecruitmentAnnouncementPublishedValue>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.announcementPublished,
        'published'
      )
    return (
      <DetailInfoForm.Field
        label="공고 게시 여부"
        validationKey="recruit.institution.announcementPublished"
        fullRow={fullRow}
        edit={
          <ParticipantRecruitmentAnnouncementPublishedRadios
            value={announcementPublished}
            onChange={setAnnouncementPublished}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitStudentListRequiredField = memo(
  function ApplicantRecruitStudentListRequiredField({
    defaultValue = 'need',
  }: {
    defaultValue?: 'need' | 'none'
  }) {
    const [studentListRequired, setStudentListRequired] =
      useApplicantRecruitInstitutionOverlayKv<string>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.studentListRequired,
        defaultValue
      )
    return (
      <DetailInfoForm.Field
        label="학생 명단 제출 여부"
        validationKey="recruit.institution.studentListRequired"
        edit={
          <NeedOrNotRadioGroup value={studentListRequired} onChange={setStudentListRequired} />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitPreguidanceRequiredField = memo(
  function ApplicantRecruitPreguidanceRequiredField({
    defaultValue = 'need',
  }: {
    defaultValue?: 'need' | 'none'
  }) {
    const [preguidanceRequired, setPreguidanceRequired] =
      useApplicantRecruitInstitutionOverlayKv<string>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
        defaultValue
      )
    return (
      <DetailInfoForm.Field
        label="사전 안내 사항 작성 여부"
        validationKey="recruit.institution.preguidanceRequired"
        edit={
          <NeedOrNotRadioGroup value={preguidanceRequired} onChange={setPreguidanceRequired} />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitMaxInstructorsField = memo(function ApplicantRecruitMaxInstructorsField({
  defaultValue,
}: {
  defaultValue?: number
}) {
  const [maxInstructors, setMaxInstructors] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors, defaultValue)
  const maxInstructorsInput = maxInstructors != null ? String(maxInstructors) : ''
  return (
    <DetailInfoForm.Field
      label="배정 가능 최대 강사 수"
      validationKey="recruit.institution.maxAssignableInstructors"
      edit={
        <NumberWithSuffixRow
          placeholder="최대값 입력"
          suffix="명"
          value={maxInstructorsInput}
          onChange={setMaxInstructors}
        />
      }
      view="-"
    />
  )
})

export const ApplicantRecruitMaxClassCountField = memo(function ApplicantRecruitMaxClassCountField({
  defaultValue,
  fullRow,
}: {
  defaultValue?: number
  fullRow?: boolean
}) {
  const [maxClassCount, setMaxClassCount] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount, defaultValue)
  const maxClassInput = maxClassCount != null ? String(maxClassCount) : ''
  return (
    <DetailInfoForm.Field
      label="신청 가능 최대 학급 수"
      validationKey="recruit.institution.maxClassCount"
      fullRow={fullRow}
      edit={
        <NumberWithSuffixRow
          placeholder="최대값 입력"
          suffix="개"
          value={maxClassInput}
          onChange={setMaxClassCount}
        />
      }
      view="-"
    />
  )
})

export const ApplicantRecruitMaxScheduleCountField = memo(
  function ApplicantRecruitMaxScheduleCountField({
    defaultValue,
    fullRow,
  }: {
    defaultValue?: number
    fullRow?: boolean
  }) {
    const [maxScheduleCount, setMaxScheduleCount] = useApplicantRecruitInstitutionOverlayKv<
      number | undefined
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount, defaultValue)
    const maxScheduleInput = maxScheduleCount != null ? String(maxScheduleCount) : ''
    return (
      <DetailInfoForm.Field
        label="신청 가능 최대 일정 수"
        validationKey="recruit.institution.maxScheduleCount"
        fullRow={fullRow}
        edit={
          <NumberWithSuffixRow
            placeholder="최대값 입력"
            suffix="개"
            value={maxScheduleInput}
            onChange={setMaxScheduleCount}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitMaxSessionsPerDayField = memo(
  function ApplicantRecruitMaxSessionsPerDayField({
    defaultValue,
    label = '일별 신청 가능 최대 차시 수',
    suffix = '회',
    fullRow,
  }: {
    defaultValue?: number
    label?: string
    suffix?: string
    fullRow?: boolean
  }) {
    const [maxSessionsPerDay, setMaxSessionsPerDay] = useApplicantRecruitInstitutionOverlayKv<
      number | undefined
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay, defaultValue)
    const maxSessionsInput = maxSessionsPerDay != null ? String(maxSessionsPerDay) : ''
    return (
      <DetailInfoForm.Field
        label={label}
        validationKey="recruit.institution.maxSessionsPerDay"
        fullRow={fullRow}
        edit={
          <NumberWithSuffixRow
            placeholder="최대값 입력"
            suffix={suffix}
            value={maxSessionsInput}
            onChange={setMaxSessionsPerDay}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitProgramPeriodField = memo(function ApplicantRecruitProgramPeriodField() {
  const [programAnchorIso, setProgramAnchorIso] = useApplicantRecruitInstitutionOverlayKv<
    string | null
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.programAnchorIso, null)
  const [programRangeSeal, setProgramRangeSeal] = useApplicantRecruitInstitutionOverlayKv<RangeSeal>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.programRangeSeal,
    null
  )
  const programAnchor = programAnchorIso ? dayjs(programAnchorIso) : null
  const setProgramAnchor = (next: Dayjs | null) => {
    setProgramAnchorIso(next == null ? null : next.toISOString())
  }
  const programRange: [Dayjs, Dayjs] | null = useMemo(() => {
    if (programRangeSeal == null) return null
    return [dayjs(programRangeSeal.start), dayjs(programRangeSeal.end)]
  }, [programRangeSeal])
  const setProgramRange = (next: [Dayjs, Dayjs] | null) => {
    if (next == null) {
      setProgramRangeSeal(null)
      return
    }
    setProgramRangeSeal({ start: next[0].toISOString(), end: next[1].toISOString() })
  }
  const programRangeWithTime = useMemo(
    () => (programRange == null ? false : dateRangeUsesClockTime(programRange[0], programRange[1])),
    [programRange]
  )

  return (
    <DetailInfoForm.Field
      label="프로그램 운영 기간"
      validationKey="recruit.institution.programRangeSeal"
      edit={
        <div className={MAX_SUFFIX_CLASS}>
          <ParagraphDatePicker inputSize="small"
            mode="single"
            presetMode="period"
            value={programAnchor}
            width="100%"
            placeholder="운영 기간을 선택하세요"
            preferPeriodModeInPopover
            suppressAutoTodayWhenEmpty
            appliedSurfaceRange={programRange}
            appliedSurfaceWithTime={programRangeWithTime}
            onRangeChange={range => setProgramRange(range)}
            onChange={next => {
              if (next == null) return
              setProgramAnchor(next)
            }}
          />
        </div>
      }
      view="-"
    />
  )
})

export const ApplicantRecruitRecruitPeriodField = memo(function ApplicantRecruitRecruitPeriodField() {
  const [recruitAnchorIso, setRecruitAnchorIso] = useApplicantRecruitInstitutionOverlayKv<
    string | null
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.recruitAnchorIso, null)
  const [recruitRangeSeal, setRecruitRangeSeal] = useApplicantRecruitInstitutionOverlayKv<RangeSeal>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.recruitRangeSeal,
    null
  )
  const recruitAnchor = recruitAnchorIso ? dayjs(recruitAnchorIso) : null
  const setRecruitAnchor = (next: Dayjs | null) => {
    setRecruitAnchorIso(next == null ? null : next.toISOString())
  }
  const recruitRange: [Dayjs, Dayjs] | null = useMemo(() => {
    if (recruitRangeSeal == null) return null
    return [dayjs(recruitRangeSeal.start), dayjs(recruitRangeSeal.end)]
  }, [recruitRangeSeal])
  const setRecruitRange = (next: [Dayjs, Dayjs] | null) => {
    if (next == null) {
      setRecruitRangeSeal(null)
      return
    }
    setRecruitRangeSeal({ start: next[0].toISOString(), end: next[1].toISOString() })
  }

  return (
    <DetailInfoForm.Field
      label="참여자 모집 기간"
      validationKey="recruit.institution.recruitRangeSeal"
      edit={
        <div className={MAX_SUFFIX_CLASS}>
          <ParagraphDatePicker inputSize="small"
            mode="single"
            presetMode="period"
            value={recruitAnchor}
            width="100%"
            placeholder="모집 기간을 선택하세요"
            preferPeriodModeInPopover
            suppressAutoTodayWhenEmpty
            showTimeToggle={false}
            appliedSurfaceRange={recruitRange}
            appliedSurfaceWithTime={false}
            onRangeChange={range => setRecruitRange(range)}
            onChange={next => {
              if (next == null) return
              setRecruitAnchor(next)
            }}
          />
        </div>
      }
      view="-"
    />
  )
})

export const ApplicantRecruitFinalAnnounceField = memo(function ApplicantRecruitFinalAnnounceField() {
  const [finalAnnounceIso, setFinalAnnounceIso] = useApplicantRecruitInstitutionOverlayKv<
    string | null
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceIso, null)
  const [finalAnnounceMethod, setFinalAnnounceMethod] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceMethod,
    ''
  )
  const finalAnnounceDate = finalAnnounceIso ? dayjs(finalAnnounceIso) : null
  const setFinalAnnounceDate = (next: Dayjs | null) => {
    setFinalAnnounceIso(next == null ? null : next.toISOString())
  }

  return (
    <DetailInfoForm.Field
      label="최종 합격자 발표"
      validationKey={[
        'recruit.institution.finalAnnounceIso',
        'recruit.institution.finalAnnounceMethod',
      ]}
      edit={
        <div className={MAX_SUFFIX_CLASS}>
          <ParagraphDatePicker inputSize="small"
            mode="single"
            presetMode="date"
            value={finalAnnounceDate}
            placeholder="합격자 발표일"
            suppressAutoTodayWhenEmpty
            onChange={next => setFinalAnnounceDate(next)}
          />
          <DetailInfoForm.InputsSeparator />
          <CmsInput
            inputSize="small"
            width="100%"
            style={{ flex: '1 1 0', minWidth: 0 }}
            placeholder="발표 방법 안내"
            value={finalAnnounceMethod}
            onChange={e => setFinalAnnounceMethod(e.target.value)}
          />
        </div>
      }
      view="-"
    />
  )
})

export const ApplicantRecruitTargetLevelsField = memo(function ApplicantRecruitTargetLevelsField() {
  const [targetLevels, setTargetLevels] = useApplicantRecruitInstitutionOverlayKv<string[]>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels,
    []
  )
  return (
    <DetailInfoForm.Field
      label="교육 대상"
      validationKey="recruit.institution.targetLevels"
      edit={
        <CmsSelect
          mode="multiple"
          withAllOption={false}
          inputSize="small"
          placeholder="교육 대상을 선택하세요"
          width="100%"
          options={[...TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS]}
          value={targetLevels}
          onChange={v => setTargetLevels(Array.isArray(v) ? v.map(String) : [])}
        />
      }
      view="-"
    />
  )
})

export const ApplicantRecruitTargetLevelDetailField = memo(
  function ApplicantRecruitTargetLevelDetailField() {
    const [targetLevelDetail, setTargetLevelDetail] = useApplicantRecruitInstitutionOverlayKv<string>(
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevelDetail,
      ''
    )
    return (
      <DetailInfoForm.Field
        label="교육 대상 상세"
        validationKey="recruit.institution.targetLevelDetail"
        edit={
          <CmsInput
            inputSize="small"
            width="100%"
            placeholder="상세 교육 대상을 입력하세요"
            value={targetLevelDetail}
            onChange={e => setTargetLevelDetail(e.target.value)}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitInquiryContactFields = memo(function ApplicantRecruitInquiryContactFields() {
  const [inquiryContact, setInquiryContact] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryContact,
    ''
  )
  const [inquiryTel, setInquiryTel] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryTel,
    ''
  )
  const [inquiryEmail, setInquiryEmail] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryEmail,
    ''
  )
  return (
    <RecruitInquiryContactRow
      inquiryContact={inquiryContact}
      onInquiryContactChange={setInquiryContact}
      inquiryTel={inquiryTel}
      onInquiryTelChange={setInquiryTel}
      inquiryEmail={inquiryEmail}
      onInquiryEmailChange={setInquiryEmail}
    />
  )
})

export const ApplicantRecruitNotesFields = memo(function ApplicantRecruitNotesFields({
  fullRow,
}: {
  fullRow?: boolean
}) {
  const [notesNotApplicable, setNotesNotApplicable] = useApplicantRecruitInstitutionOverlayKv<boolean>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.notesNotApplicable,
    false
  )
  const [notes, setNotes] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.notes,
    ''
  )
  return (
    <RecruitNotesRow
      fullRow={fullRow}
      notesNotApplicable={notesNotApplicable}
      onNotesNotApplicableChange={setNotesNotApplicable}
      notes={notes}
      onNotesChange={setNotes}
    />
  )
})
