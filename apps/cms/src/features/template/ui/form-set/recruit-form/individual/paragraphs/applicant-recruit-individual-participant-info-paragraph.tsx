import { useMemo } from 'react'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  RecruitInquiryContactRow,
  RecruitNotesRow,
  RECRUIT_FORM_MAX_SUFFIX_CLASS,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import { RecruitInterviewConditionalRows } from '@/features/template/ui/form-set/recruit-form/shared/recruit-interview-conditional-rows'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'
import './applicant-recruit-individual-participant-info-paragraph.css'

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const MAX_SUFFIX_CLASS = RECRUIT_FORM_MAX_SUFFIX_CLASS
const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

const INTERVIEW_OPTIONS = [
  { label: '필요', value: 'yes' },
  { label: '불필요', value: 'no' },
] as const

type RangeSeal = { start: string; end: string } | null

/** 프로그램 참여자 모집 폼 (개인) — 참여자 모집 정보 */
export function ApplicantRecruitIndividualParticipantInfoParagraph() {
  const [announcementPublished, setAnnouncementPublished] =
    useGeneralRecruitOverlayKv<ParticipantRecruitmentAnnouncementPublishedValue>(
      'recruit.individual.announcementPublished',
      'published'
    )
  const [interviewRequired, setInterviewRequired] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.interviewRequired',
    'no'
  )

  const [programAnchorIso, setProgramAnchorIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.individual.programAnchorIso',
    null
  )
  const [programRangeSeal, setProgramRangeSeal] = useGeneralRecruitOverlayKv<RangeSeal>(
    'recruit.individual.programRangeSeal',
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
    'recruit.individual.recruitAnchorIso',
    null
  )
  const [recruitRangeSeal, setRecruitRangeSeal] = useGeneralRecruitOverlayKv<RangeSeal>(
    'recruit.individual.recruitRangeSeal',
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

  const [docDeadlineIso, setDocDeadlineIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.individual.docDeadlineIso',
    null
  )
  const docDeadlineDate = docDeadlineIso ? dayjs(docDeadlineIso) : null
  const setDocDeadlineDate = (next: Dayjs | null) => {
    setDocDeadlineIso(next == null ? null : next.toISOString())
  }
  const [docAnnounceMethod, setDocAnnounceMethod] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.docAnnounceMethod',
    ''
  )

  const [interviewAnchorIso, setInterviewAnchorIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.individual.interviewAnchorIso',
    null
  )
  const [interviewRangeSeal, setInterviewRangeSeal] = useGeneralRecruitOverlayKv<RangeSeal>(
    'recruit.individual.interviewRangeSeal',
    null
  )
  const interviewAnchor = interviewAnchorIso ? dayjs(interviewAnchorIso) : null
  const setInterviewAnchor = (next: Dayjs | null) => {
    setInterviewAnchorIso(next == null ? null : next.toISOString())
  }
  const interviewRange: [Dayjs, Dayjs] | null = useMemo(() => {
    if (interviewRangeSeal == null) return null
    return [dayjs(interviewRangeSeal.start), dayjs(interviewRangeSeal.end)]
  }, [interviewRangeSeal])
  const setInterviewRange = (next: [Dayjs, Dayjs] | null) => {
    if (next == null) {
      setInterviewRangeSeal(null)
      return
    }
    setInterviewRangeSeal({ start: next[0].toISOString(), end: next[1].toISOString() })
  }
  const interviewRangeWithTime = useMemo(
    () =>
      interviewRange == null
        ? false
        : dateRangeUsesClockTime(interviewRange[0], interviewRange[1]),
    [interviewRange]
  )
  const [interviewMethod, setInterviewMethod] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.interviewMethod',
    ''
  )

  const [finalAnnounceIso, setFinalAnnounceIso] = useGeneralRecruitOverlayKv<string | null>(
    'recruit.individual.finalAnnounceIso',
    null
  )
  const finalAnnounceDate = finalAnnounceIso ? dayjs(finalAnnounceIso) : null
  const setFinalAnnounceDate = (next: Dayjs | null) => {
    setFinalAnnounceIso(next == null ? null : next.toISOString())
  }
  const [finalAnnounceMethod, setFinalAnnounceMethod] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.finalAnnounceMethod',
    ''
  )

  const [targetLevels, setTargetLevels] = useGeneralRecruitOverlayKv<string[]>(
    'recruit.individual.targetLevels',
    []
  )
  const [targetLevelDetail, setTargetLevelDetail] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.targetLevelDetail',
    ''
  )
  const [inquiryContact, setInquiryContact] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.inquiryContact',
    ''
  )
  const [inquiryTel, setInquiryTel] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.inquiryTel',
    ''
  )
  const [inquiryEmail, setInquiryEmail] = useGeneralRecruitOverlayKv<string>(
    'recruit.individual.inquiryEmail',
    ''
  )
  const [notesNotApplicable, setNotesNotApplicable] = useGeneralRecruitOverlayKv<boolean>(
    'recruit.individual.notesNotApplicable',
    false
  )
  const [notes, setNotes] = useGeneralRecruitOverlayKv<string>('recruit.individual.notes', '')

  const interviewEnabled = interviewRequired === 'yes'

  return (
    <div className="applicant-recruit-individual-participant-info-paragraph__forms">
      <DetailInfoForm title="참여자 모집 정보" hideHeader mode="edit">
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
            label="참여자 면접 유무"
            edit={
              <CmsRadioGroup
                size="large"
                value={interviewRequired}
                onChange={e => setInterviewRequired(String(e.target.value))}
                className={RECRUITMENT_RADIO_CLASS}
              >
                {INTERVIEW_OPTIONS.map(o => (
                  <CmsRadio key={o.value} value={o.value} size="large">
                    {o.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
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

        <RecruitInterviewConditionalRows
          recruitPeriodLabel="참여자 모집 기간"
          interviewEnabled={interviewEnabled}
          state={{
            recruitAnchor,
            setRecruitAnchor,
            recruitRange,
            setRecruitRange,
            recruitRangeWithTime,
            docDeadlineDate,
            setDocDeadlineDate,
            docAnnounceMethod,
            setDocAnnounceMethod,
            interviewAnchor,
            setInterviewAnchor,
            interviewRange,
            setInterviewRange,
            interviewRangeWithTime,
            interviewMethod,
            setInterviewMethod,
            finalAnnounceDate,
            setFinalAnnounceDate,
            finalAnnounceMethod,
            setFinalAnnounceMethod,
          }}
        />

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
