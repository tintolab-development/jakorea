import type { Dayjs } from 'dayjs'
import { INTERVIEW_METHOD_OPTIONS } from '@/features/program/shared/lib/program-detail-info-constants'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { RECRUIT_FORM_MAX_SUFFIX_CLASS } from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'

export type RecruitInterviewPeriodState = {
  recruitAnchor: Dayjs | null
  setRecruitAnchor: (next: Dayjs | null) => void
  recruitRange: [Dayjs, Dayjs] | null
  setRecruitRange: (next: [Dayjs, Dayjs] | null) => void
  recruitRangeWithTime: boolean
  docDeadlineDate: Dayjs | null
  setDocDeadlineDate: (next: Dayjs | null) => void
  docAnnounceMethod: string
  setDocAnnounceMethod: (next: string) => void
  interviewAnchor: Dayjs | null
  setInterviewAnchor: (next: Dayjs | null) => void
  interviewRange: [Dayjs, Dayjs] | null
  setInterviewRange: (next: [Dayjs, Dayjs] | null) => void
  interviewRangeWithTime: boolean
  interviewMethod: string
  setInterviewMethod: (next: string) => void
  finalAnnounceDate: Dayjs | null
  setFinalAnnounceDate: (next: Dayjs | null) => void
  finalAnnounceMethod: string
  setFinalAnnounceMethod: (next: string) => void
}

export function RecruitInterviewConditionalRows({
  recruitPeriodLabel,
  interviewEnabled,
  state,
}: {
  recruitPeriodLabel: string
  interviewEnabled: boolean
  state: RecruitInterviewPeriodState
}) {
  if (interviewEnabled) {
    return (
      <>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label={recruitPeriodLabel}
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={state.recruitAnchor}
                  width="100%"
                  placeholder="모집 기간을 선택하세요"
                  preferPeriodModeInPopover
                  appliedSurfaceRange={state.recruitRange}
                  appliedSurfaceWithTime={state.recruitRangeWithTime}
                  onRangeChange={range => state.setRecruitRange(range)}
                  onChange={next => {
                    if (next == null) return
                    state.setRecruitAnchor(next)
                  }}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="1차 서류 합격자 발표"
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  value={state.docDeadlineDate}
                  placeholder="발표일"
                  suppressAutoTodayWhenEmpty
                  onChange={next => state.setDocDeadlineDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="발표 방법 안내"
                  value={state.docAnnounceMethod}
                  onChange={e => state.setDocAnnounceMethod(e.target.value)}
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
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="period"
                  value={state.interviewAnchor}
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="면접 기간을 선택하세요"
                  preferPeriodModeInPopover
                  appliedSurfaceRange={state.interviewRange}
                  appliedSurfaceWithTime={state.interviewRangeWithTime}
                  onRangeChange={range => state.setInterviewRange(range)}
                  onChange={next => {
                    if (next == null) return
                    state.setInterviewAnchor(next)
                  }}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsSelect
                  inputSize="medium"
                  width={140}
                  placeholder="면접 유형"
                  options={INTERVIEW_METHOD_OPTIONS}
                  withAllOption={false}
                  value={state.interviewMethod || undefined}
                  onChange={v => state.setInterviewMethod(v == null ? '' : String(v))}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  value={state.finalAnnounceDate}
                  placeholder="합격자 발표일"
                  suppressAutoTodayWhenEmpty
                  onChange={next => state.setFinalAnnounceDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="발표 방법 안내"
                  value={state.finalAnnounceMethod}
                  onChange={e => state.setFinalAnnounceMethod(e.target.value)}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </>
    )
  }

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label={recruitPeriodLabel}
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              mode="single"
              presetMode="period"
              value={state.recruitAnchor}
              width="100%"
              placeholder="모집 기간을 선택하세요"
              preferPeriodModeInPopover
              appliedSurfaceRange={state.recruitRange}
              appliedSurfaceWithTime={state.recruitRangeWithTime}
              onRangeChange={range => state.setRecruitRange(range)}
              onChange={next => {
                if (next == null) return
                state.setRecruitAnchor(next)
              }}
            />
          </div>
        }
        view="-"
      />
      <DetailInfoForm.Field
        label="최종 합격자 발표"
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              mode="single"
              presetMode="date"
              value={state.finalAnnounceDate}
              placeholder="합격자 발표일"
              suppressAutoTodayWhenEmpty
              onChange={next => state.setFinalAnnounceDate(next)}
            />
            <DetailInfoForm.InputsSeparator />
            <CmsInput
              inputSize="medium"
              width="100%"
              style={{ flex: '1 1 0', minWidth: 0 }}
              placeholder="발표 방법 안내"
              value={state.finalAnnounceMethod}
              onChange={e => state.setFinalAnnounceMethod(e.target.value)}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}
