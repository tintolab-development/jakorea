import { createFinalAnnounceDisabledDate } from '@/features/template/ui/form-set/recruit-form/shared/recruit-final-announce-date'
import type { Dayjs } from 'dayjs'
import { INTERVIEW_METHOD_OPTIONS } from '@/features/program/shared/lib/program-detail-info-constants'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  RECRUIT_FORM_MAX_SUFFIX_CLASS,
  RECRUIT_TEMPLATE_ANNOUNCE_DATE_WIDTH,
  RECRUIT_TEMPLATE_FIXED_DATE_STYLE,
  RECRUIT_TEMPLATE_INTERVIEW_METHOD_WIDTH,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-form-field-rows'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

export type RecruitInterviewPeriodState = {
  recruitAnchor: Dayjs | null
  setRecruitAnchor: (next: Dayjs | null) => void
  recruitRange: [Dayjs, Dayjs] | null
  setRecruitRange: (next: [Dayjs, Dayjs] | null) => void
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
  validationKeyPrefix,
}: {
  recruitPeriodLabel: string
  interviewEnabled: boolean
  state: RecruitInterviewPeriodState
  validationKeyPrefix: string
}) {
  // 일반 프로그램 등록 위저드만 시안 플레이스홀더 — 그 외 화면은 기존 문구 (early return 전에 호출)
  const isGeneralWizard = useIsGeneralRegistrationWizard()
  // 템플릿 관리 모집 폼도 시안 플레이스홀더 (QA 261113 #56)
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const showSpecPlaceholder = isGeneralWizard || isTemplateManagementScreen
  const docAnnouncePlaceholder = showSpecPlaceholder ? '합격자 발표일을 선택해 주세요' : '발표일'
  const finalAnnouncePlaceholder = showSpecPlaceholder ? '합격자 발표일을 선택해 주세요' : '합격자 발표일'
  const finalAnnounceDisabledDate = createFinalAnnounceDisabledDate(state.recruitRange)
  /** 템플릿 관리 시안 — 발표일 날짜 칸 고정 240 (등록·상세는 기존 남은 폭 채움) */
  const announceDateSizing = isTemplateManagementScreen
    ? { width: RECRUIT_TEMPLATE_ANNOUNCE_DATE_WIDTH, style: RECRUIT_TEMPLATE_FIXED_DATE_STYLE }
    : {}
  if (interviewEnabled) {
    return (
      <>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label={recruitPeriodLabel}
            validationKey={`${validationKeyPrefix}.recruitRangeSeal`}
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="period"
                  value={state.recruitAnchor}
                  width="100%"
                  placeholder="모집 기간을 선택해 주세요"
                  preferPeriodModeInPopover
                  suppressAutoTodayWhenEmpty
                  showTimeToggle={false}
                  appliedSurfaceRange={state.recruitRange}
                  appliedSurfaceWithTime={false}
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
            validationKey={[
              `${validationKeyPrefix}.docDeadlineIso`,
              `${validationKeyPrefix}.docAnnounceMethod`,
            ]}
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="date"
                  value={state.docDeadlineDate}
                  {...announceDateSizing}
                  placeholder={docAnnouncePlaceholder}
                  suppressAutoTodayWhenEmpty
                  onChange={next => state.setDocDeadlineDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="small"
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
            validationKey={[
              `${validationKeyPrefix}.interviewRangeSeal`,
              `${validationKeyPrefix}.interviewMethod`,
            ]}
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="period"
                  value={state.interviewAnchor}
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="면접 기간을 선택해 주세요"
                  preferPeriodModeInPopover
                  suppressAutoTodayWhenEmpty
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
                  inputSize="small"
                  width={isTemplateManagementScreen ? RECRUIT_TEMPLATE_INTERVIEW_METHOD_WIDTH : 140}
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
            validationKey={[
              `${validationKeyPrefix}.finalAnnounceIso`,
              `${validationKeyPrefix}.finalAnnounceMethod`,
            ]}
            edit={
              <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="date"
                  value={state.finalAnnounceDate}
                  {...announceDateSizing}
                  disabledDate={finalAnnounceDisabledDate}
                  placeholder={finalAnnouncePlaceholder}
                  suppressAutoTodayWhenEmpty
                  onChange={next => state.setFinalAnnounceDate(next)}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="small"
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
        validationKey={`${validationKeyPrefix}.recruitRangeSeal`}
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="period"
              value={state.recruitAnchor}
              width="100%"
              placeholder="모집 기간을 선택해 주세요"
              preferPeriodModeInPopover
              suppressAutoTodayWhenEmpty
              showTimeToggle={false}
              appliedSurfaceRange={state.recruitRange}
              appliedSurfaceWithTime={false}
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
        validationKey={[
          `${validationKeyPrefix}.finalAnnounceIso`,
          `${validationKeyPrefix}.finalAnnounceMethod`,
        ]}
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="date"
              value={state.finalAnnounceDate}
              {...announceDateSizing}
              disabledDate={finalAnnounceDisabledDate}
              placeholder={finalAnnouncePlaceholder}
              suppressAutoTodayWhenEmpty
              onChange={next => state.setFinalAnnounceDate(next)}
            />
            <DetailInfoForm.InputsSeparator />
            <CmsInput
              inputSize="small"
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
