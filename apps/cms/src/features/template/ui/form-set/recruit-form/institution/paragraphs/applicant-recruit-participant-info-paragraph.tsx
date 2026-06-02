import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import type { Dayjs } from 'dayjs'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  useApplicantRecruitInstitutionOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'
import './applicant-recruit-participant-info-paragraph.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const NEED_OR_NOT_OPTIONS = [
  { label: '필요', value: 'need' },
  { label: '불필요', value: 'none' },
] as const

const CERTIFICATE_OPTIONS = [
  { label: '제공', value: 'provide' },
  { label: '미제공', value: 'none' },
] as const

const MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
const inquiryColumnStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 8,
}

function InquiryContactColumn({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <CmsInput inputSize="medium" width={240} placeholder={placeholder} />
    </div>
  )
}

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
      <CmsInput
        inputSize="medium"
        type="number"
        min={0}
        placeholder={placeholder}
        width={120}
        value={value}
        onChange={e => onChange(parsePositiveIntInput(e.target.value))}
      />
      <span style={{ marginLeft: 6 }}>{suffix}</span>
    </div>
  )
}

export type ApplicantRecruitParticipantInfoParagraphProps = {
  /**
   * 학교/기관 대상 프로그램일 때만 최대 강사·학급·일정·차시 입력 노출.
   * 미전달 시 기관 모집 양식 편집기에서는 true로 간주.
   */
  showInstitutionApplicationLimits?: boolean
}

/** 프로그램 참여자 모집 폼 (학교) — 참여자 모집 정보 */
export function ApplicantRecruitParticipantInfoParagraph({
  showInstitutionApplicationLimits = true,
}: ApplicantRecruitParticipantInfoParagraphProps = {}) {
  const [preguidanceRequired, setPreguidanceRequired] = useState<string>('need')
  const [studentListRequired, setStudentListRequired] = useState<string>('need')
  const [certificateProvided, setCertificateProvided] = useState<string>('provide')

  const [maxInstructors, setMaxInstructors] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors, undefined)
  const [maxClassCount, setMaxClassCount] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount, undefined)
  const [maxScheduleCount, setMaxScheduleCount] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount, undefined)
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useApplicantRecruitInstitutionOverlayKv<
    number | undefined
  >(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay, undefined)

  const maxInstructorsInput = maxInstructors != null ? String(maxInstructors) : ''
  const maxClassInput = maxClassCount != null ? String(maxClassCount) : ''
  const maxScheduleInput = maxScheduleCount != null ? String(maxScheduleCount) : ''
  const maxSessionsInput = maxSessionsPerDay != null ? String(maxSessionsPerDay) : ''

  const [programAnchor, setProgramAnchor] = useState<Dayjs | null>(null)
  const [programRange, setProgramRange] = useState<[Dayjs, Dayjs] | null>(null)
  const programRangeWithTime = useMemo(
    () => (programRange == null ? false : dateRangeUsesClockTime(programRange[0], programRange[1])),
    [programRange]
  )

  const [recruitAnchor, setRecruitAnchor] = useState<Dayjs | null>(null)
  const [recruitRange, setRecruitRange] = useState<[Dayjs, Dayjs] | null>(null)
  const recruitRangeWithTime = useMemo(
    () => (recruitRange == null ? false : dateRangeUsesClockTime(recruitRange[0], recruitRange[1])),
    [recruitRange]
  )

  const [finalAnnounceDate, setFinalAnnounceDate] = useState<Dayjs | null>(null)

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

  return (
    <div className="applicant-recruit-participant-info-paragraph__forms">
      <DetailInfoForm title="참여자 모집 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="사전 안내 사항 작성 여부"
            fullRow
            edit={
              <CmsRadioGroup
                value={preguidanceRequired}
                onChange={e => setPreguidanceRequired(String(e.target.value))}
              >
                {NEED_OR_NOT_OPTIONS.map(o => (
                  <CmsRadio key={o.value} value={o.value}>
                    {o.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="학생 명단 제출 여부"
            edit={
              <CmsRadioGroup
                value={studentListRequired}
                onChange={e => setStudentListRequired(String(e.target.value))}
              >
                {NEED_OR_NOT_OPTIONS.map(o => (
                  <CmsRadio key={o.value} value={o.value}>
                    {o.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="수료증 발급 여부"
            edit={
              <CmsRadioGroup
                value={certificateProvided}
                onChange={e => setCertificateProvided(String(e.target.value))}
              >
                {CERTIFICATE_OPTIONS.map(o => (
                  <CmsRadio key={o.value} value={o.value}>
                    {o.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>

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

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="신청 가능 최대 일정 수"
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
              <DetailInfoForm.Field
                label="신청 가능 1일 최대 차시"
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
            </DetailInfoForm.Row>
          </>
        ) : null}
      </DetailInfoForm>

      <DetailInfoForm title="참여자 모집 정보" hideHeader mode="edit">
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
                inputSize="medium"
                width={240}
                placeholder="전체"
                options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="교육 대상 상세"
            edit={
              <CmsInput inputSize="medium" width="100%" placeholder="상세 교육 대상을 입력하세요" />
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
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="문의처"
            fullRow
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <InquiryContactColumn label="문의처" placeholder="담당 문의처" />
                <DetailInfoForm.InputsSeparator />
                <InquiryContactColumn label="Tel" placeholder="문의처 전화번호" />
                <DetailInfoForm.InputsSeparator />
                <InquiryContactColumn label="E-mail" placeholder="문의처 이메일" />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="비고란을 작성하세요 (없으면 -로 입력)"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
