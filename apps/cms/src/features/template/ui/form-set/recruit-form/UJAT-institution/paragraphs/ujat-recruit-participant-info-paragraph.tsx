import { useMemo, useState, type CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { UjatRecruitParticipantInfoProgramView } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-views/participant-info-program'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
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

function UjatRecruitParticipantInfoTemplateEditor() {
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

  return (
    <DetailInfoForm title="참여자 모집 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          fullRow
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              defaultValue="2026년 JA Korea 초등 경제교육 대상 학교"
              placeholder="프로그램명을 입력하세요"
            />
          }
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
              disabled
              inputSize="medium"
              width={240}
              value="초등학교"
              options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
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
              defaultValue="경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교"
              placeholder="상세 교육 대상을 입력하세요"
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
  )
}

/** UJAT 프로그램 학교 모집 폼 — 참여자 모집 정보 */
export function UjatRecruitParticipantInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <UjatRecruitParticipantInfoProgramView
        program={props.program}
        sponsorName={props.sponsorName}
        form={props.form}
        isEdit={mode === 'edit'}
        sectionTitle={props.sectionTitle}
        sectionDescription={props.sectionDescription}
      />
    )
  }
  return <UjatRecruitParticipantInfoTemplateEditor />
}
