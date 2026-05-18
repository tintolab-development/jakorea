import { useMemo, useState, type CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { AppMultiSelect } from '@/shared/ui/app-multi-select'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { UjatRecruitVolunteerInfoProgramView } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-views/volunteer-info-program'
import '@/features/template/ui/form-editor/form-editor.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
const NOTICE_EXPOSURE_OPTIONS = [
  { label: '모집 시작일', value: 'start-day' },
  { label: '모집 하루 전', value: 'one-day-before' },
  { label: '모집 일주일 전', value: 'one-week-before' },
] as const

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

function UjatRecruitVolunteerInfoTemplateEditor() {
  const [noticeExposureTiming, setNoticeExposureTiming] = useState<string>('start-day')
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

  const [interviewAnchor, setInterviewAnchor] = useState<Dayjs | null>(null)
  const [interviewRange, setInterviewRange] = useState<[Dayjs, Dayjs] | null>(null)
  const interviewRangeWithTime = useMemo(
    () =>
      interviewRange == null ? false : dateRangeUsesClockTime(interviewRange[0], interviewRange[1]),
    [interviewRange]
  )

  const [docDeadlineDate, setDocDeadlineDate] = useState<Dayjs | null>(null)
  const [finalAnnounceDate, setFinalAnnounceDate] = useState<Dayjs | null>(null)
  const [recruitTargets, setRecruitTargets] = useState<string[]>(['university', 'adult'])

  return (
    <>
      <DetailInfoForm title="봉사자 모집 공고 노출 시점" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="모집 공고 노출 시점"
            fullRow
            edit={
              <CmsRadioGroup
                value={noticeExposureTiming}
                onChange={e => setNoticeExposureTiming(String(e.target.value))}
              >
                {NOTICE_EXPOSURE_OPTIONS.map(o => (
                  <CmsRadio key={o.value} value={o.value}>
                    {o.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="봉사자 모집 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                defaultValue="JA Korea 제36기 대학생경제교육봉사단 모집"
                placeholder="공고용 프로그램명을 입력하세요"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="활동 기수"
            edit={<CmsInput inputSize="medium" width="100%" placeholder="활동 기수를 입력하세요" />}
            view="-"
          />
        </DetailInfoForm.Row>

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
            label="봉사자 모집 현황"
            readOnlyDisplay
            view={
              <span className="form-editor-template-field-hint-text">{RECRUIT_PROGRESS_HINT}</span>
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            edit={
              <AppMultiSelect
                style={{ width: 240 }}
                value={recruitTargets}
                onChange={setRecruitTargets}
                disabled
                placeholder="모집 대상을 선택하세요"
                options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="모집 대상 상세"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                defaultValue="전공무관, 휴학생 지원 가능"
                placeholder="모집 대상 상세를 입력하세요"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="봉사자 모집 기간"
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
            label="1차 서류합격 발표"
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  value={docDeadlineDate}
                  placeholder="합격자 발표일"
                  suppressAutoTodayWhenEmpty
                  onChange={next => setDocDeadlineDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  inputSize="medium"
                  placeholder="발표 방법 안내"
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="2차 면접 기간"
            edit={
              <div className={MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={interviewAnchor}
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="면접 기간을 선택하세요"
                  preferPeriodModeInPopover
                  appliedSurfaceRange={interviewRange}
                  appliedSurfaceWithTime={interviewRangeWithTime}
                  onRangeChange={range => setInterviewRange(range)}
                  onChange={next => {
                    if (next == null) return
                    setInterviewAnchor(next)
                  }}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsSelect
                  inputSize="medium"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="면접 유형"
                  options={[
                    { label: '대면', value: 'offline' },
                    { label: '비대면', value: 'online' },
                  ]}
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
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  suppressAutoTodayWhenEmpty
                  onChange={next => setFinalAnnounceDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
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
    </>
  )
}

/** UJAT 프로그램 봉사자 모집 폼 — 봉사자 모집 정보 */
export function UjatRecruitVolunteerInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    const half = props.volunteerHalf ?? 'h1'
    return (
      <UjatRecruitVolunteerInfoProgramView
        program={props.program}
        sponsorName={props.sponsorName}
        form={props.form}
        isEdit={mode === 'edit'}
        volunteerHalf={half}
        showNoticeExposure={half === 'h2'}
        sectionTitle={props.sectionTitle}
        sectionDescription={props.sectionDescription}
      />
    )
  }
  return <UjatRecruitVolunteerInfoTemplateEditor />
}
