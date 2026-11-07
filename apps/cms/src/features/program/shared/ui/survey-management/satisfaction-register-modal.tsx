import type { SelectProps } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  SATISFACTION_WINDOW_DAYS,
  formatSatisfactionWindowExampleLine,
  type SatisfactionRunMode,
  type SatisfactionWindowDays,
} from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'

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
  schedulesLoading?: boolean
  hasSessionSchedules: boolean
  lastEducationScheduleLabel?: string | null
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
  schedulesLoading = false,
  hasSessionSchedules,
  onCancel,
  onSubmit,
}: SatisfactionRegisterModalProps) {
  const perSchedule = runMode === SATISFACTION_RUN_MODE_PER_SCHEDULE
  const scheduleReady = !perSchedule || (!schedulesLoading && hasSessionSchedules)
  const canSubmit =
    templateValue != null &&
    templateValue !== '' &&
    scheduleReady &&
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
        <div>
          <CmsRadioGroup
            label="설문 진행 방식"
            required
            size="medium"
            value={runMode}
            onChange={event => onRunModeChange(event.target.value as SatisfactionRunMode)}
          >
            <CmsRadio value={SATISFACTION_RUN_MODE_PER_SCHEDULE}>일정별</CmsRadio>
            <CmsRadio value={SATISFACTION_RUN_MODE_ONCE_AT_END}>종료 시 1회</CmsRadio>
          </CmsRadioGroup>
          <p className="survey-management-create-modal__hint">
            {perSchedule
              ? '확정된 모든 교육 일정에 동일한 만족도조사가 적용되며, 각 일정이 끝나면 자동으로 시작됩니다.'
              : '배정된 마지막 교육 일정이 끝난 뒤 한 번만 진행됩니다.'}
          </p>
        </div>
        {perSchedule ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CmsSelect
              width="100%"
              withAllOption={false}
              allowClear={false}
              label="설문 진행 기간"
              required
              options={SATISFACTION_WINDOW_DAYS.map(days => ({
                label: `일정 종료 후 ${days}일`,
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
            <p className="survey-management-satisfaction__schedule-select-hint">
              일정마다 참여 기간이 자동으로 적용됩니다.{' '}
              {formatSatisfactionWindowExampleLine(windowDays)}
            </p>
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}
