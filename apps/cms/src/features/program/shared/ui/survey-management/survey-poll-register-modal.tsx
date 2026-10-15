import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { SelectProps } from 'antd'

export const SURVEY_POLL_REGISTER_MODAL_COPY = {
  title: '신규 설문조사 등록',
  description:
    '새로운 설문조사를 등록하시겠습니까?\n설문조사 신규 등록을 위해 사용할 템플릿 유형과 설문 대상을 선택해 주세요',
  descriptionWithoutSchedule:
    '새로운 설문조사를 등록하시겠습니까?\n설문조사 신규 등록을 위해 사용할 템플릿 유형을 선택해 주세요',
  templateLabel: '템플릿 유형',
  templatePlaceholder: '사용할 설문 양식을 선택해 주세요',
  scheduleLabel: '설문 대상 일정',
  schedulePlaceholder: '설문을 진행할 교육 일정을 선택해 주세요',
  scheduleEmptyHint: '등록된 교육 일정이 없습니다. 프로그램 일정을 먼저 등록해 주세요.',
} as const

export type SurveyPollRegisterModalProps = {
  open: boolean
  className?: string
  submitting: boolean
  templateOptions: SelectProps['options']
  templateValue: string | null
  onTemplateChange: (value: string | null) => void
  scheduleOptions: SelectProps['options']
  scheduleValue: string | null
  onScheduleChange: (value: string | null) => void
  schedulesLoading?: boolean
  hasSessionSchedules: boolean
  /** false — 신청 일정 단락 없음; 일정 선택 UI 숨김 */
  showScheduleField?: boolean
  onCancel: () => void
  onSubmit: () => void
}

export function SurveyPollRegisterModal({
  open,
  className = 'survey-management-create-modal',
  submitting,
  templateOptions,
  templateValue,
  onTemplateChange,
  scheduleOptions,
  scheduleValue,
  onScheduleChange,
  schedulesLoading = false,
  hasSessionSchedules,
  showScheduleField = true,
  onCancel,
  onSubmit,
}: SurveyPollRegisterModalProps) {
  const scheduleSelectionReady =
    !showScheduleField ||
    (scheduleValue != null && scheduleValue !== '' && hasSessionSchedules)
  const canSubmit =
    templateValue != null && templateValue !== '' && scheduleSelectionReady

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={SURVEY_POLL_REGISTER_MODAL_COPY.title}
      width={600}
      className={className}
      description={
        showScheduleField
          ? SURVEY_POLL_REGISTER_MODAL_COPY.description
          : SURVEY_POLL_REGISTER_MODAL_COPY.descriptionWithoutSchedule
      }
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            width={120}
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            width={120}
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            신규 등록
          </CmsButton>
        </>
      }
    >
      <div className="survey-management-create-modal__fields">
        <CmsSelect
          width="100%"
          withAllOption={false}
          allowClear={false}
          label={SURVEY_POLL_REGISTER_MODAL_COPY.templateLabel}
          required
          placeholder={SURVEY_POLL_REGISTER_MODAL_COPY.templatePlaceholder}
          options={templateOptions}
          value={templateValue ?? undefined}
          onChange={value => onTemplateChange(value ?? null)}
        />
        {showScheduleField ? (
          <CmsSelect
            width="100%"
            withAllOption={false}
            allowClear={false}
            label={SURVEY_POLL_REGISTER_MODAL_COPY.scheduleLabel}
            required
            placeholder={SURVEY_POLL_REGISTER_MODAL_COPY.schedulePlaceholder}
            options={scheduleOptions}
            value={scheduleValue ?? undefined}
            onChange={value => onScheduleChange(value ?? null)}
            disabled={!hasSessionSchedules || schedulesLoading}
            message={
              !hasSessionSchedules && !schedulesLoading
                ? SURVEY_POLL_REGISTER_MODAL_COPY.scheduleEmptyHint
                : undefined
            }
          />
        ) : null}
      </div>
    </ContentModal>
  )
}
