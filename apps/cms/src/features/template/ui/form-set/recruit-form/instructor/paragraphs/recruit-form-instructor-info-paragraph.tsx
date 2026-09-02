import { useMemo, type CSSProperties } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { INSTRUCTOR_TARGET_OPTIONS } from '@/features/program/shared/lib/program-detail-info-constants'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'
import './recruit-form-instructor-info-paragraph.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

type RangeSeal = { start: string; end: string } | null

const inquiryColumnStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 8,
}

function InquiryContactColumn({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <CmsInput
        inputSize="medium"
        width={240}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

/** 프로그램 강사 모집 폼 — 강사 모집 정보 */
export function RecruitFormInstructorInfoParagraph() {
  const [announcementPublished, setAnnouncementPublished] =
    useGeneralRecruitOverlayKv<ParticipantRecruitmentAnnouncementPublishedValue>(
      'recruit.instructor.announcementPublished',
      'published'
    )
  const [recruitTargets, setRecruitTargets] = useGeneralRecruitOverlayKv<string[]>(
    'recruit.instructor.recruitTargets',
    ['성인']
  )

  const [programAnchorIso, setProgramAnchorIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.instructor.programAnchorIso',
    null
  )
  const [programRangeSeal, setProgramRangeSeal] = useGeneralRecruitOverlayKv<RangeSeal>(
    'recruit.instructor.programRangeSeal',
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

  const [recruitAnchorIso, setRecruitAnchorIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.instructor.recruitAnchorIso',
    null
  )
  const [recruitRangeSeal, setRecruitRangeSeal] = useGeneralRecruitOverlayKv<RangeSeal>(
    'recruit.instructor.recruitRangeSeal',
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

  const [finalAnnounceIso, setFinalAnnounceIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.instructor.finalAnnounceIso',
    null
  )
  const finalAnnounceDate = finalAnnounceIso ? dayjs(finalAnnounceIso) : null
  const setFinalAnnounceDate = (next: Dayjs | null) => {
    setFinalAnnounceIso(next == null ? null : next.toISOString())
  }
  const [recruitTargetDetail, setRecruitTargetDetail] = useGeneralRecruitOverlayKv<string>(
    'recruit.instructor.recruitTargetDetail',
    ''
  )
  const [finalAnnounceMethod, setFinalAnnounceMethod] = useGeneralRecruitOverlayKv<string>(
    'recruit.instructor.finalAnnounceMethod',
    ''
  )
  const [inquiryContact, setInquiryContact] = useGeneralRecruitOverlayKv<string>(
    'recruit.instructor.inquiryContact',
    ''
  )
  const [inquiryTel, setInquiryTel] = useGeneralRecruitOverlayKv<string>(
    'recruit.instructor.inquiryTel',
    ''
  )
  const [inquiryEmail, setInquiryEmail] = useGeneralRecruitOverlayKv<string>(
    'recruit.instructor.inquiryEmail',
    ''
  )
  const [notesNotApplicable, setNotesNotApplicable] = useGeneralRecruitOverlayKv<boolean>(
    'recruit.instructor.notesNotApplicable',
    false
  )
  const [notes, setNotes] = useGeneralRecruitOverlayKv<string>('recruit.instructor.notes', '')

  return (
    <div className="recruit-form-instructor-info-paragraph__forms">
      <DetailInfoForm title="강사 모집 정보" hideHeader mode="edit">
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
      </DetailInfoForm>

      <DetailInfoForm title="강사 모집 정보" hideHeader mode="edit">
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
          label="강사 모집 현황"
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
            <CmsSelect
              mode="multiple"
              inputSize="medium"
              width={240}
              withAllOption={false}
              placeholder="모집 대상을 선택하세요"
              options={[...INSTRUCTOR_TARGET_OPTIONS]}
              value={recruitTargets}
              onChange={v => setRecruitTargets(Array.isArray(v) ? v.map(String) : [])}
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
              placeholder="상세 모집 대상을 입력하세요"
              value={recruitTargetDetail}
              onChange={e => setRecruitTargetDetail(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사 모집 기간"
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

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="문의처"
          fullRow
          edit={
            <div className={MAX_SUFFIX_CLASS}>
              <InquiryContactColumn
                label="문의처"
                placeholder="담당 문의처"
                value={inquiryContact}
                onChange={setInquiryContact}
              />
              <DetailInfoForm.InputsSeparator />
              <InquiryContactColumn
                label="Tel"
                placeholder="문의처 전화번호"
                value={inquiryTel}
                onChange={setInquiryTel}
              />
              <DetailInfoForm.InputsSeparator />
              <InquiryContactColumn
                label="E-mail"
                placeholder="문의처 이메일"
                value={inquiryEmail}
                onChange={setInquiryEmail}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="비고"
          fullRow
          edit={
            <div className={MAX_SUFFIX_CLASS}>
              <CmsCheckbox
                checkboxSize="medium"
                checked={notesNotApplicable}
                onChange={e => {
                  const checked = e.target.checked
                  setNotesNotApplicable(checked)
                  if (checked) setNotes('')
                }}
              >
                해당 없음
              </CmsCheckbox>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                placeholder="비고란을 작성하세요"
                value={notes}
                disabled={notesNotApplicable}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
