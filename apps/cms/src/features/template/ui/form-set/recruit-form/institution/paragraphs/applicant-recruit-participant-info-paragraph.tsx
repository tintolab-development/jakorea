import { useEffect, useMemo } from 'react'
import {
  patchInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  useApplicantRecruitInstitutionOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  RecruitInquiryContactRow,
  RecruitNotesRow,
  RECRUIT_FORM_MAX_SUFFIX_CLASS,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import '@/features/template/ui/form-editor/form-editor.css'
import './applicant-recruit-participant-info-paragraph.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const MAX_SUFFIX_CLASS = RECRUIT_FORM_MAX_SUFFIX_CLASS

const NEED_OR_NOT_OPTIONS = [
  { label: '필요', value: 'need' },
  { label: '불필요', value: 'none' },
] as const

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

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
        inputSize="medium"
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
      size="large"
      value={value}
      onChange={e => onChange(String(e.target.value))}
      className={RECRUITMENT_RADIO_CLASS}
    >
      {NEED_OR_NOT_OPTIONS.map(option => (
        <CmsRadio key={option.value} value={option.value} size="large">
          {option.label}
        </CmsRadio>
      ))}
    </CmsRadioGroup>
  )
}

export type ApplicantRecruitParticipantInfoParagraphProps = {
  /**
   * 학교/기관 대상 프로그램일 때만 최대 강사·학급·일정·차시 입력 노출.
   * 미전달 시 기관 모집 양식 편집기에서는 true로 간주.
   */
  showInstitutionApplicationLimits?: boolean
  layoutVariant?: 'general' | 'economy' | 'trainedTeachers'
  defaults?: {
    studentListRequired?: 'need' | 'none'
    preguidanceRequired?: 'need' | 'none'
    maxAssignableInstructors?: number
    maxClassCount?: number
    maxScheduleCount?: number
    maxSessionsPerDay?: number
  }
}

/** 프로그램 참여자 모집 폼 (학교) — 참여자 모집 정보 */
export function ApplicantRecruitParticipantInfoParagraph({
  showInstitutionApplicationLimits = true,
  layoutVariant = 'general',
  defaults,
}: ApplicantRecruitParticipantInfoParagraphProps = {}) {
  const institutionApplicationBridge = useInstitutionApplicationProgramBridge()
  const showMaxScheduleCountField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxScheduleFields(institutionApplicationBridge)
  const showMaxSessionsPerDayField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxSessionsPerDayField(institutionApplicationBridge)
  type RangeSeal = { start: string; end: string } | null

  const [announcementPublished, setAnnouncementPublished] =
    useApplicantRecruitInstitutionOverlayKv<ParticipantRecruitmentAnnouncementPublishedValue>(
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.announcementPublished,
      'published'
    )
  const [preguidanceRequired, setPreguidanceRequired] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
    defaults?.preguidanceRequired ?? 'need'
  )
  const [studentListRequired, setStudentListRequired] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.studentListRequired,
    defaults?.studentListRequired ?? 'need'
  )
  const [maxInstructors, setMaxInstructors] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors,
    defaults?.maxAssignableInstructors
  )
  const [maxClassCount, setMaxClassCount] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount, defaults?.maxClassCount)
  const [maxScheduleCount, setMaxScheduleCount] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount, defaults?.maxScheduleCount)
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay, defaults?.maxSessionsPerDay)

  const maxInstructorsInput = maxInstructors != null ? String(maxInstructors) : ''
  const maxClassInput = maxClassCount != null ? String(maxClassCount) : ''
  const maxScheduleInput = maxScheduleCount != null ? String(maxScheduleCount) : ''
  const maxSessionsInput = maxSessionsPerDay != null ? String(maxSessionsPerDay) : ''

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
  const recruitRangeWithTime = useMemo(
    () => (recruitRange == null ? false : dateRangeUsesClockTime(recruitRange[0], recruitRange[1])),
    [recruitRange]
  )

  const [finalAnnounceIso, setFinalAnnounceIso] = useApplicantRecruitInstitutionOverlayKv<
    string | null
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceIso, null)
  const finalAnnounceDate = finalAnnounceIso ? dayjs(finalAnnounceIso) : null
  const setFinalAnnounceDate = (next: Dayjs | null) => {
    setFinalAnnounceIso(next == null ? null : next.toISOString())
  }
  const [targetLevels, setTargetLevels] = useApplicantRecruitInstitutionOverlayKv<string[]>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevels,
    layoutVariant === 'economy' ? ['high'] : []
  )
  const [notesNotApplicable, setNotesNotApplicable] = useApplicantRecruitInstitutionOverlayKv<boolean>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.notesNotApplicable,
    false
  )
  const [notes, setNotes] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.notes,
    ''
  )
  const [finalAnnounceMethod, setFinalAnnounceMethod] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceMethod,
    ''
  )
  const [targetLevelDetail, setTargetLevelDetail] = useApplicantRecruitInstitutionOverlayKv<string>(
    APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.targetLevelDetail,
    ''
  )
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

  useEffect(() => {
    patchInstitutionApplicationProgramBridge({
      preEducationNoticeRequired: preguidanceRequired === 'need',
      maxAssignableInstructors: maxInstructors,
      maxClassCount,
      maxScheduleCount,
      maxSessionsPerDay,
    })
  }, [
    preguidanceRequired,
    maxInstructors,
    maxClassCount,
    maxScheduleCount,
    maxSessionsPerDay,
  ])

  if (layoutVariant === 'economy') {
    return (
      <div className="applicant-recruit-participant-info-paragraph__forms">
        <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              fullRow
              edit={
                <ParticipantRecruitmentAnnouncementPublishedRadios
                  value={announcementPublished}
                  onChange={setAnnouncementPublished}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="배정 가능 최대 강사 수"
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
            <DetailInfoForm.Field
              label="신청 가능 최대 학급 수"
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
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="프로그램 운영 기간"
              edit={
                <div className={MAX_SUFFIX_CLASS}>
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="period"
                    value={programAnchor}
                    width="100%"
                    placeholder="프로그램 운영 기간을 선택하세요"
                    preferPeriodModeInPopover
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
            <DetailInfoForm.Field
              label="참여자 모집 현황"
              readOnlyDisplay
              view={
                <span className="form-editor-template-field-hint-text">{RECRUIT_PROGRESS_HINT}</span>
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육 대상"
              edit={
                <CmsSelect
                  mode="multiple"
                  inputSize="medium"
                  width={240}
                  withAllOption={false}
                  placeholder="교육 대상을 선택하세요"
                  options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                  value={targetLevels}
                  onChange={v => setTargetLevels(Array.isArray(v) ? v.map(String) : [])}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="교육 대상 상세"
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  placeholder="상세 교육 대상을 입력하세요"
                  value={targetLevelDetail}
                  onChange={e => setTargetLevelDetail(e.target.value)}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="참여자 모집 기간"
              edit={
                <div className={MAX_SUFFIX_CLASS}>
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="period"
                    value={recruitAnchor}
                    width="100%"
                    placeholder="모집 기간을 선택하세요"
                    preferPeriodModeInPopover
                    appliedSurfaceRange={recruitRange}
                    appliedSurfaceWithTime={recruitRangeWithTime}
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
            <DetailInfoForm.Field
              label="최종 합격자 발표"
              edit={
                <div className={MAX_SUFFIX_CLASS}>
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="date"
                    value={finalAnnounceDate}
                    placeholder="합격자 발표일"
                    suppressAutoTodayWhenEmpty
                    onChange={next => setFinalAnnounceDate(next)}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <CmsInput
                    inputSize="medium"
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
          </DetailInfoForm.Row>

          <RecruitInquiryContactRow
            inquiryContact={inquiryContact}
            onInquiryContactChange={setInquiryContact}
            inquiryTel={inquiryTel}
            onInquiryTelChange={setInquiryTel}
            inquiryEmail={inquiryEmail}
            onInquiryEmailChange={setInquiryEmail}
          />

          <RecruitNotesRow
            fullRow
            notesNotApplicable={notesNotApplicable}
            onNotesNotApplicableChange={setNotesNotApplicable}
            notes={notes}
            onNotesChange={setNotes}
          />
        </DetailInfoForm>
      </div>
    )
  }

  const isTrainedTeachers = layoutVariant === 'trainedTeachers'
  const isGeneral = layoutVariant === 'general'
  const showTrainedTeachersScheduleLimits =
    isTrainedTeachers && showInstitutionApplicationLimits

  return (
    <div className="applicant-recruit-participant-info-paragraph__forms">
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        {isTrainedTeachers ? (
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              edit={
                <ParticipantRecruitmentAnnouncementPublishedRadios
                  value={announcementPublished}
                  onChange={setAnnouncementPublished}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="학생 명단 제출 여부"
              edit={
                <NeedOrNotRadioGroup
                  value={studentListRequired}
                  onChange={setStudentListRequired}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : (
          <>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="공고 게시 여부"
                fullRow
                edit={
                  <ParticipantRecruitmentAnnouncementPublishedRadios
                    value={announcementPublished}
                    onChange={setAnnouncementPublished}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="학생 명단 제출 여부"
                edit={
                  <NeedOrNotRadioGroup
                    value={studentListRequired}
                    onChange={setStudentListRequired}
                  />
                }
                view="-"
              />
              <DetailInfoForm.Field
                label="사전 안내 사항 작성 여부"
                edit={
                  <NeedOrNotRadioGroup
                    value={preguidanceRequired}
                    onChange={setPreguidanceRequired}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
          </>
        )}

        {showInstitutionApplicationLimits ? (
          <>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="배정 가능 최대 강사 수"
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
              <DetailInfoForm.Field
                label="신청 가능 최대 학급 수"
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
            </DetailInfoForm.Row>

            {(isGeneral && showInstitutionApplicationLimits) ||
            showTrainedTeachersScheduleLimits ||
            showMaxScheduleCountField ||
            showMaxSessionsPerDayField ? (
              <DetailInfoForm.Row
                type={
                  isGeneral ||
                  showTrainedTeachersScheduleLimits ||
                  (showMaxScheduleCountField && showMaxSessionsPerDayField)
                    ? 'double'
                    : 'single'
                }
              >
                {isGeneral || showTrainedTeachersScheduleLimits || showMaxScheduleCountField ? (
                  <DetailInfoForm.Field
                    label="신청 가능 최대 일정 수"
                    fullRow={
                      !isGeneral &&
                      !showTrainedTeachersScheduleLimits &&
                      !showMaxSessionsPerDayField
                    }
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
                ) : null}
                {isGeneral || showTrainedTeachersScheduleLimits || showMaxSessionsPerDayField ? (
                  <DetailInfoForm.Field
                    label="신청 가능 1일 최대 차시"
                    fullRow={
                      !isGeneral &&
                      !showTrainedTeachersScheduleLimits &&
                      !showMaxScheduleCountField
                    }
                    edit={
                      <NumberWithSuffixRow
                        placeholder="최대값 입력"
                        suffix="차시"
                        value={maxSessionsInput}
                        onChange={setMaxSessionsPerDay}
                      />
                    }
                    view="-"
                  />
                ) : null}
              </DetailInfoForm.Row>
            ) : null}
          </>
        ) : null}
      </DetailInfoForm>

      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 운영 기간"
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={programAnchor}
                  width="100%"
                  placeholder="프로그램 운영 기간을 선택하세요"
                  preferPeriodModeInPopover
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
          <DetailInfoForm.Field
            label="참여자 모집 현황"
            readOnlyDisplay
            view={
              <span className="form-editor-template-field-hint-text">{RECRUIT_PROGRESS_HINT}</span>
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 대상"
            edit={
              <CmsSelect
                mode="multiple"
                inputSize="medium"
                width={240}
                withAllOption={false}
                placeholder="교육 대상을 선택하세요"
                options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                value={targetLevels}
                onChange={v => setTargetLevels(Array.isArray(v) ? v.map(String) : [])}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="교육 대상 상세"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="상세 교육 대상을 입력하세요"
                value={targetLevelDetail}
                onChange={e => setTargetLevelDetail(e.target.value)}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 모집 기간"
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={recruitAnchor}
                  width="100%"
                  placeholder="모집 기간을 선택하세요"
                  preferPeriodModeInPopover
                  appliedSurfaceRange={recruitRange}
                  appliedSurfaceWithTime={recruitRangeWithTime}
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
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  value={finalAnnounceDate}
                  placeholder="합격자 발표일"
                  suppressAutoTodayWhenEmpty
                  onChange={next => setFinalAnnounceDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
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
        </DetailInfoForm.Row>

        <RecruitInquiryContactRow
          inquiryContact={inquiryContact}
          onInquiryContactChange={setInquiryContact}
          inquiryTel={inquiryTel}
          onInquiryTelChange={setInquiryTel}
          inquiryEmail={inquiryEmail}
          onInquiryEmailChange={setInquiryEmail}
        />

        <RecruitNotesRow
          fullRow
          notesNotApplicable={notesNotApplicable}
          onNotesNotApplicableChange={setNotesNotApplicable}
          notes={notes}
          onNotesChange={setNotes}
        />
      </DetailInfoForm>
    </div>
  )
}
