import type { Dayjs } from 'dayjs'
import type { SelectProps } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import {
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  SATISFACTION_WINDOW_DAYS,
  satisfactionDeadlinePreviewCopy,
  satisfactionStartHintCopy,
  type SatisfactionRunMode,
  type SatisfactionWindowDays,
} from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'

export type SatisfactionStartMode = 'auto' | 'immediate' | 'custom'

export type SatisfactionRegisterModalProps = {
  open: boolean
  submitting: boolean
  title: string
  description: string
  templateOptions: SelectProps['options']
  templateValue: string | null
  onTemplateChange: (value: string | null) => void
  audienceOptions?: SelectProps['options']
  audienceValue?: string | null
  onAudienceChange?: (value: string | null) => void
  audienceError?: string | null
  runMode: SatisfactionRunMode
  onRunModeChange: (value: SatisfactionRunMode) => void
  windowDays: SatisfactionWindowDays
  onWindowDaysChange: (value: SatisfactionWindowDays) => void
  startMode: SatisfactionStartMode
  onStartModeChange: (value: SatisfactionStartMode) => void
  customStartAt: Dayjs | null
  onCustomStartAtChange: (value: Dayjs | null) => void
  scheduleOptions: SelectProps['options']
  scheduleValues: string[]
  onScheduleValuesChange: (values: string[]) => void
  schedulesLoading?: boolean
  hasSessionSchedules: boolean
  onCancel: () => void
  onSubmit: () => void
}

export function SatisfactionRegisterModal({
  open,
  submitting,
  title,
  description,
  templateOptions,
  templateValue,
  onTemplateChange,
  audienceOptions,
  audienceValue,
  onAudienceChange,
  audienceError,
  runMode,
  onRunModeChange,
  windowDays,
  onWindowDaysChange,
  startMode,
  onStartModeChange,
  customStartAt,
  onCustomStartAtChange,
  scheduleOptions,
  scheduleValues,
  onScheduleValuesChange,
  schedulesLoading = false,
  hasSessionSchedules,
  onCancel,
  onSubmit,
}: SatisfactionRegisterModalProps) {
  const perSchedule = runMode === SATISFACTION_RUN_MODE_PER_SCHEDULE
  const scheduleReady =
    !perSchedule ||
    (hasSessionSchedules && scheduleValues.length > 0 && scheduleValues.every(value => value !== ''))
  const startReady =
    runMode !== SATISFACTION_RUN_MODE_ONCE_AT_END ||
    startMode !== 'custom' ||
    customStartAt != null
  const canSubmit =
    templateValue != null &&
    templateValue !== '' &&
    scheduleReady &&
    startReady &&
    (audienceOptions == null || (audienceValue != null && audienceValue !== ''))

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={600}
      className="survey-management-create-modal"
      description={description}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
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
        {audienceOptions != null && onAudienceChange != null ? (
          <CmsSelect
            width="100%"
            withAllOption={false}
            allowClear={false}
            label="대상"
            required
            options={audienceOptions}
            value={audienceValue ?? undefined}
            onChange={value => onAudienceChange(value ?? null)}
            error={Boolean(audienceError)}
            message={audienceError ?? undefined}
          />
        ) : null}
        <CmsSelect
          width="100%"
          withAllOption={false}
          allowClear={false}
          label="템플릿 유형"
          required
          placeholder="사용할 설문 양식을 선택해 주세요"
          options={templateOptions}
          value={templateValue ?? undefined}
          onChange={value => onTemplateChange(value ?? null)}
        />
        <CmsRadioGroup
          label="진행 방식"
          required
          size="medium"
          value={runMode}
          onChange={event => onRunModeChange(event.target.value as SatisfactionRunMode)}
        >
          <CmsRadio value={SATISFACTION_RUN_MODE_PER_SCHEDULE}>일정별</CmsRadio>
          <CmsRadio value={SATISFACTION_RUN_MODE_ONCE_AT_END}>종료 시 1회</CmsRadio>
        </CmsRadioGroup>
        <p className="survey-management-create-modal__hint">{satisfactionStartHintCopy(runMode)}</p>
        {perSchedule ? (
          <CmsSelect
            width="100%"
            mode="multiple"
            withAllOption={false}
            allowClear={false}
            label="교육 일정"
            required
            placeholder="만족도조사를 진행할 교육 일정을 선택해 주세요"
            options={scheduleOptions}
            value={scheduleValues}
            onChange={value =>
              onScheduleValuesChange(Array.isArray(value) ? value.map(String) : [])
            }
            disabled={!hasSessionSchedules || schedulesLoading}
          />
        ) : (
          <CmsRadioGroup
            label="시작 설정"
            required
            size="medium"
            value={startMode}
            onChange={event => onStartModeChange(event.target.value as SatisfactionStartMode)}
          >
            <CmsRadio value="immediate">바로 시작</CmsRadio>
            <CmsRadio value="custom">직접 설정</CmsRadio>
            <CmsRadio value="auto">마지막 교육 일정 종료일</CmsRadio>
          </CmsRadioGroup>
        )}
        {runMode === SATISFACTION_RUN_MODE_ONCE_AT_END && startMode === 'custom' ? (
          <div>
            <p className="survey-management-create-modal__hint">시작일·시각</p>
            <CmsDatePicker
              showTime
              value={customStartAt}
              onChange={value => onCustomStartAtChange(value)}
              placeholder="시작일·시각을 선택해 주세요"
            />
          </div>
        ) : null}
        <CmsSelect
          width="100%"
          withAllOption={false}
          allowClear={false}
          label="참여 기간"
          required
          options={SATISFACTION_WINDOW_DAYS.map(days => ({
            label: `${days}일`,
            value: String(days),
          }))}
          value={String(windowDays)}
          onChange={value => {
            const next = Number(value)
            if (SATISFACTION_WINDOW_DAYS.includes(next as SatisfactionWindowDays)) {
              onWindowDaysChange(next as SatisfactionWindowDays)
            }
          }}
        />
        <p className="survey-management-create-modal__hint">
          {satisfactionDeadlinePreviewCopy(windowDays)}
        </p>
      </div>
    </ContentModal>
  )
}
