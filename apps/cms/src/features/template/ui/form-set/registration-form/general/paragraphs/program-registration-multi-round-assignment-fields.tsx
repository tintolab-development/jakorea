import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
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
  fullRow,
  validationKey,
  untouched = false,
}: {
  value: ProgramRegistrationMultiRoundAssignmentValue
  onChange: (next: ProgramRegistrationMultiRoundAssignmentValue) => void
  /** true면 Row 없이 Field만 반환 (과제|참여 double 행용) */
  embedded?: boolean
  fullRow?: boolean
  validationKey?: string
  /** 회차 과제 설정 overlay가 아직 없음 — 템플릿 관리 화면에서는 라디오를 미선택으로 보여 준다 */
  untouched?: boolean
}) {
  // 템플릿 관리 등록 폼 시안(12932:1713): 라디오 미선택 시작 · 제출 기한 240. 등록·상세는 기존(없음 선택 · 360)
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const radioValue = isTemplateManagementScreen && untouched ? '' : value.enabled ? 'yes' : 'no'
  const deadlineWidth = isTemplateManagementScreen ? 240 : 360
  const appliedSurfaceRange = useMemo(
    () => parseEducationScheduleLineToRange(value.period),
    [value.period]
  )

  const field = (
    <DetailInfoForm.Field
      label="과제 설정"
      validationKey={validationKey}
      fullRow={fullRow ?? !embedded}
      view={
        <CurriculumAssignmentSettingView
          assignmentEnabled={value.enabled}
          assignmentPeriod={value.period}
        />
      }
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
          <CmsRadioGroup
            size="medium"
            value={radioValue}
            onChange={e => {
              const enabled = e.target.value === 'yes'
              onChange({
                enabled,
                period: enabled ? value.period : '',
              })
            }}
          >
            <CmsRadio size="medium" value="yes">있음</CmsRadio>
            <CmsRadio size="medium" value="no">없음</CmsRadio>
          </CmsRadioGroup>
          <DetailInfoForm.InputsSeparator />
          <ParagraphDatePicker inputSize="small"
            mode="single"
            presetMode="period"
            customizable={false}
            suppressAutoTodayWhenEmpty
            disabled={!value.enabled}
            value={appliedSurfaceRange?.[0] ?? null}
            onChange={() => {}}
            appliedSurfaceRange={appliedSurfaceRange}
            appliedSurfaceWithTime={Boolean(
              appliedSurfaceRange && educationScheduleRangeHasClock(appliedSurfaceRange)
            )}
            onRangeChange={([start, end]) => {
              onChange({
                enabled: true,
                period: formatEducationScheduleLineFromRange([start, end]),
              })
            }}
            width={deadlineWidth}
            placeholder="제출 기한을 설정해 주세요"
          />
        </div>
      }
    />
  )

  if (embedded) return field
  return <DetailInfoForm.Row type="single">{field}</DetailInfoForm.Row>
}
