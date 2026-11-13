import { memo, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { createFinalAnnounceDisabledDate } from '@/features/template/ui/form-set/recruit-form/shared/recruit-final-announce-date'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import {
  syncInstitutionApplicationBridgeFromApplicantRecruitOverlay,
  useApplicantRecruitInstitutionOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import {
  RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
  RECRUIT_NEED_OR_NOT_DEFAULT,
} from '@/features/program/general/lib/recruit-radio-defaults'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  RecruitInquiryContactRow,
  RecruitNotesRow,
  RECRUIT_FORM_MAX_SUFFIX_CLASS,
  RECRUIT_TEMPLATE_ANNOUNCE_DATE_WIDTH,
  RECRUIT_TEMPLATE_FIXED_DATE_STYLE,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

/**
 * 시안 플레이스홀더 — 일반 프로그램 등록 위저드 + 템플릿 관리(일반 모집 폼, QA 261113 #56).
 * 1사1교·교육받은 교사 등록 위저드·상세 수정은 기존 문구.
 */
function useGeneralWizardPlaceholder(generalText: string, fallback: string): string {
  const isGeneralWizard = useIsGeneralRegistrationWizard()
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  return isGeneralWizard || isTemplateManagementScreen ? generalText : fallback
}

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

export const ApplicantRecruitInstitutionBridgeSync = memo(
  function ApplicantRecruitInstitutionBridgeSync({
    isTrainedTeachers,
  }: {
    isTrainedTeachers: boolean
  }) {
    const [preguidanceRequired] = useApplicantRecruitInstitutionOverlayKv<string>(
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
      RECRUIT_NEED_OR_NOT_DEFAULT
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
  }
)

export const ApplicantRecruitAnnouncementPublishedField = memo(
  function ApplicantRecruitAnnouncementPublishedField({
    fullRow = false,
    size = 'medium',
  }: {
    fullRow?: boolean
    /** 프로그램 상세·모집 양식 수정은 14px(medium). */
    size?: 'large' | 'medium'
  }) {
    const [announcementPublished, setAnnouncementPublished] =
      useApplicantRecruitInstitutionOverlayKv<
        ParticipantRecruitmentAnnouncementPublishedValue | ''
      >(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.announcementPublished,
        RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT
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
            size={size}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitStudentListRequiredField = memo(
  function ApplicantRecruitStudentListRequiredField({
    defaultValue = RECRUIT_NEED_OR_NOT_DEFAULT,
  }: {
    defaultValue?: 'need' | 'none'
  }) {
    // 템플릿 관리 모집 폼은 라디오를 모두 미선택으로 보여 준다(등록·상세는 기존 기본값).
    const isTemplateManagementScreen = useIsTemplateManagementScreen()
    const [studentListRequired, setStudentListRequired] =
      useApplicantRecruitInstitutionOverlayKv<string>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.studentListRequired,
        isTemplateManagementScreen ? '' : defaultValue
      )
    return (
      <DetailInfoForm.Field
        label="학생 명단 제출 여부"
        validationKey="recruit.institution.studentListRequired"
        edit={<NeedOrNotRadioGroup value={studentListRequired} onChange={setStudentListRequired} />}
        view="-"
      />
    )
  }
)

export const ApplicantRecruitPreguidanceRequiredField = memo(
  function ApplicantRecruitPreguidanceRequiredField({
    defaultValue = RECRUIT_NEED_OR_NOT_DEFAULT,
  }: {
    defaultValue?: 'need' | 'none'
  }) {
    // 템플릿 관리 모집 폼은 라디오를 모두 미선택으로 보여 준다(등록·상세는 기존 기본값).
    const isTemplateManagementScreen = useIsTemplateManagementScreen()
    const [preguidanceRequired, setPreguidanceRequired] =
      useApplicantRecruitInstitutionOverlayKv<string>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
        isTemplateManagementScreen ? '' : defaultValue
      )
    return (
      <DetailInfoForm.Field
        label="사전 안내 사항 작성 여부"
        validationKey="recruit.institution.preguidanceRequired"
        edit={<NeedOrNotRadioGroup value={preguidanceRequired} onChange={setPreguidanceRequired} />}
        view="-"
      />
    )
  }
)

export const ApplicantRecruitMaxInstructorsField = memo(
  function ApplicantRecruitMaxInstructorsField({ defaultValue }: { defaultValue?: number }) {
    const [maxInstructors, setMaxInstructors] = useApplicantRecruitInstitutionOverlayKv<
      number | undefined
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors, defaultValue)
    const maxInstructorsInput = maxInstructors != null ? String(maxInstructors) : ''
    const maxPlaceholder = useGeneralWizardPlaceholder('최대 강사', '최대값 입력')
    return (
      <DetailInfoForm.Field
        label="배정 가능 최대 강사 수"
        validationKey="recruit.institution.maxAssignableInstructors"
        edit={
          <NumberWithSuffixRow
            placeholder={maxPlaceholder}
            suffix="명"
            value={maxInstructorsInput}
            onChange={setMaxInstructors}
          />
        }
        view="-"
      />
    )
  }
)

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
  const maxPlaceholder = useGeneralWizardPlaceholder('최대 학급', '최대값 입력')
  return (
    <DetailInfoForm.Field
      label="신청 가능 최대 학급 수"
      validationKey="recruit.institution.maxClassCount"
      fullRow={fullRow}
      edit={
        <NumberWithSuffixRow
          placeholder={maxPlaceholder}
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
    const maxPlaceholder = useGeneralWizardPlaceholder('최대 일정', '최대값 입력')
    return (
      <DetailInfoForm.Field
        label="신청 가능 최대 일정 수"
        validationKey="recruit.institution.maxScheduleCount"
        fullRow={fullRow}
        edit={
          <NumberWithSuffixRow
            placeholder={maxPlaceholder}
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
    const maxPlaceholder = useGeneralWizardPlaceholder('최대 차시', '최대값 입력')
    return (
      <DetailInfoForm.Field
        label={label}
        validationKey="recruit.institution.maxSessionsPerDay"
        fullRow={fullRow}
        edit={
          <NumberWithSuffixRow
            placeholder={maxPlaceholder}
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

export const ApplicantRecruitProgramPeriodField = memo(
  function ApplicantRecruitProgramPeriodField() {
    const [programAnchorIso, setProgramAnchorIso] = useApplicantRecruitInstitutionOverlayKv<
      string | null
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.programAnchorIso, null)
    const [programRangeSeal, setProgramRangeSeal] =
      useApplicantRecruitInstitutionOverlayKv<RangeSeal>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.programRangeSeal,
        null
      )
    const programAnchor = programAnchorIso ? dayjs(programAnchorIso) : null
    const programPeriodPlaceholder = useGeneralWizardPlaceholder(
      '프로그램 운영 기간을 선택해 주세요',
      '운영 기간을 선택해 주세요'
    )
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
    return (
      <DetailInfoForm.Field
        label="프로그램 운영 기간"
        validationKey="recruit.institution.programRangeSeal"
        edit={
          <div className={MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="period"
              value={programAnchor}
              width="100%"
              placeholder={programPeriodPlaceholder}
              preferPeriodModeInPopover
              suppressAutoTodayWhenEmpty
              showTimeToggle={false}
              appliedSurfaceRange={programRange}
              appliedSurfaceWithTime={false}
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
  }
)

export const ApplicantRecruitRecruitPeriodField = memo(
  function ApplicantRecruitRecruitPeriodField() {
    const [recruitAnchorIso, setRecruitAnchorIso] = useApplicantRecruitInstitutionOverlayKv<
      string | null
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.recruitAnchorIso, null)
    const [recruitRangeSeal, setRecruitRangeSeal] =
      useApplicantRecruitInstitutionOverlayKv<RangeSeal>(
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
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="period"
              value={recruitAnchor}
              width="100%"
              placeholder="모집 기간을 선택해 주세요"
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
  }
)

export const ApplicantRecruitFinalAnnounceField = memo(
  function ApplicantRecruitFinalAnnounceField() {
    const [finalAnnounceIso, setFinalAnnounceIso] = useApplicantRecruitInstitutionOverlayKv<
      string | null
    >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceIso, null)
    const [finalAnnounceMethod, setFinalAnnounceMethod] =
      useApplicantRecruitInstitutionOverlayKv<string>(
        APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceMethod,
        ''
      )
    const [recruitRangeSeal] = useApplicantRecruitInstitutionOverlayKv<RangeSeal>(
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.recruitRangeSeal,
      null
    )
    const finalAnnounceDisabledDate = useMemo(
      () =>
        createFinalAnnounceDisabledDate(
          recruitRangeSeal == null
            ? null
            : [dayjs(recruitRangeSeal.start), dayjs(recruitRangeSeal.end)]
        ),
      [recruitRangeSeal]
    )
    const finalAnnounceDate = finalAnnounceIso ? dayjs(finalAnnounceIso) : null
    const finalAnnouncePlaceholder = useGeneralWizardPlaceholder(
      '합격자 발표일을 선택해 주세요',
      '합격자 발표일'
    )
    const setFinalAnnounceDate = (next: Dayjs | null) => {
      setFinalAnnounceIso(next == null ? null : next.toISOString())
    }
    /** 템플릿 관리 시안 — 발표일 날짜 칸 고정 240 (등록·상세는 기존 남은 폭 채움) */
    const isTemplateManagementScreen = useIsTemplateManagementScreen()

    return (
      <DetailInfoForm.Field
        label="최종 합격자 발표"
        validationKey={[
          'recruit.institution.finalAnnounceIso',
          'recruit.institution.finalAnnounceMethod',
        ]}
        edit={
          <div className={MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="date"
              value={finalAnnounceDate}
              {...(isTemplateManagementScreen
                ? {
                    width: RECRUIT_TEMPLATE_ANNOUNCE_DATE_WIDTH,
                    style: RECRUIT_TEMPLATE_FIXED_DATE_STYLE,
                  }
                : {})}
              disabledDate={finalAnnounceDisabledDate}
              placeholder={finalAnnouncePlaceholder}
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
  }
)

export const ApplicantRecruitTargetLevelsField = memo(function ApplicantRecruitTargetLevelsField() {
  const [targetLevels, setTargetLevels] = useApplicantRecruitInstitutionOverlayKv<string[]>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels,
    []
  )
  /** 템플릿 관리 시안 — 교육 대상 셀렉트 고정 240 (등록·상세는 기존 칸 채움) */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  return (
    <DetailInfoForm.Field
      label="교육 대상"
      validationKey="recruit.institution.targetLevels"
      edit={
        <CmsSelect
          mode="multiple"
          withAllOption={false}
          inputSize="small"
          placeholder="교육 대상을 선택해 주세요"
          width={isTemplateManagementScreen ? 240 : '100%'}
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
    const [targetLevelDetail, setTargetLevelDetail] =
      useApplicantRecruitInstitutionOverlayKv<string>(
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
            placeholder="상세 교육 대상을 입력해 주세요"
            value={targetLevelDetail}
            onChange={e => setTargetLevelDetail(e.target.value)}
          />
        }
        view="-"
      />
    )
  }
)

export const ApplicantRecruitInquiryContactFields = memo(
  function ApplicantRecruitInquiryContactFields() {
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
  }
)

export const ApplicantRecruitNotesFields = memo(function ApplicantRecruitNotesFields({
  fullRow,
}: {
  fullRow?: boolean
}) {
  const [notesNotApplicable, setNotesNotApplicable] =
    useApplicantRecruitInstitutionOverlayKv<boolean>(
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
