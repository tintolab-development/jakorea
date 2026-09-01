import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/shared/paragraph-date-picker.css'

export type ProgramRegistrationMultiRoundAssignmentValue = {
  enabled: boolean
  period: string
}

export const EMPTY_PROGRAM_REGISTRATION_MULTI_ROUND_ASSIGNMENT: ProgramRegistrationMultiRoundAssignmentValue =
  {
    enabled: false,
    period: '',
  }

export function ProgramRegistrationMultiRoundAssignmentFields({
  value,
  onChange,
  embedded = false,
}: {
  value: ProgramRegistrationMultiRoundAssignmentValue
  onChange: (next: ProgramRegistrationMultiRoundAssignmentValue) => void
  /** true면 Row 없이 Field만 반환 (과제|참여 double 행용) */
  embedded?: boolean
}) {
  const appliedSurfaceRange = useMemo(
    () => parseEducationScheduleLineToRange(value.period),
    [value.period]
  )

  const field = (
    <DetailInfoForm.Field
      label="과제 설정"
      fullRow={!embedded}
      view={
        <CurriculumAssignmentSettingView
          assignmentEnabled={value.enabled}
          assignmentPeriod={value.period}
        />
      }
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
          <CmsRadioGroup
            size="large"
            value={value.enabled ? 'yes' : 'no'}
            onChange={e => {
              const enabled = e.target.value === 'yes'
              onChange({
                enabled,
                period: enabled ? value.period : '',
              })
            }}
          >
            <CmsRadio value="yes">있음</CmsRadio>
            <CmsRadio value="no">없음</CmsRadio>
          </CmsRadioGroup>
          <DetailInfoForm.InputsSeparator />
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            customizable={false}
            suppressAutoTodayWhenEmpty
            disabled={!value.enabled}
            value={appliedSurfaceRange?.[0] ?? null}
            onChange={() => {}}
            appliedSurfaceRange={appliedSurfaceRange}
            onRangeChange={([start, end]) => {
              onChange({
                enabled: true,
                period: formatEducationScheduleLineFromRange([start, end]),
              })
            }}
            width={360}
            placeholder="제출 기한을 설정해 주세요"
          />
        </div>
      }
    />
  )

  if (embedded) return field
  return <DetailInfoForm.Row type="single">{field}</DetailInfoForm.Row>
}
