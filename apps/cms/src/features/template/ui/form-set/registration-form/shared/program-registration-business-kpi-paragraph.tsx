import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export type ProgramRegistrationBusinessKpiProgressItem = {
  label: string
  disabled?: boolean
  placeholder?: string
  defaultValue?: string
}

export type ProgramRegistrationBusinessKpiParagraphProps = {
  /** Overlay key prefix (default: 'generalRegistration.kpi') */
  overlayKeyPrefix?: string
  /** 교육진행자 최종 인원 — 강사 입력란 */
  instructorDisabled?: boolean
  instructorPlaceholder?: string
  /** 교육진행자 최종 인원 — 봉사자 입력란 */
  volunteerDisabled?: boolean
  volunteerPlaceholder?: string
  /** 최종 파견 학교 수 입력란 */
  dispatchedSchoolDisabled?: boolean
  dispatchedSchoolPlaceholder?: string
  /** 최종 파견 학급 수 입력란 */
  dispatchedClassDisabled?: boolean
  dispatchedClassPlaceholder?: string
  /** 교육진행자 최종 인원 항목 오버라이드 — 미지정 시 강사/봉사자 */
  educationProgressItems?: readonly ProgramRegistrationBusinessKpiProgressItem[]
}

function KpiCountInput({
  disabled,
  placeholder,
  value,
  onChange,
}: {
  disabled?: boolean
  placeholder?: string
  value?: number | null
  onChange?: (val: number | null) => void
}) {
  return (
    <CmsNumericInput
      mode="integer"
      min={0}
      allowNegative={false}
      disabled={disabled}
      inputSize="medium"
      placeholder={placeholder ?? '목표값 입력'}
      value={value == null ? '' : String(value)}
      onValueChange={raw => {
        const trimmed = raw.trim()
        if (!trimmed) {
          onChange?.(null)
          return
        }
        const n = Number(trimmed.replace(/,/g, ''))
        onChange?.(Number.isFinite(n) ? n : null)
      }}
      width={120}
    />
  )
}

function KpiProgressItemInput({
  overlayKey,
  label,
  disabled,
  placeholder,
  showSeparator,
}: {
  overlayKey: string
  label: string
  disabled?: boolean
  placeholder?: string
  showSeparator: boolean
}) {
  const [value, setValue] = useProgramRegistrationOverlayKv<number | null>(overlayKey, null)
  return (
    <div className="program-registration-paragraph__instructor-kpi-group">
      {showSeparator ? <DetailInfoForm.InputsSeparator /> : null}
      <span className="detail-info-form--text">{label}</span>
      <KpiCountInput
        disabled={disabled}
        placeholder={placeholder ?? '목표값 입력'}
        value={value}
        onChange={setValue}
      />
    </div>
  )
}

export function ProgramRegistrationBusinessKpiParagraph({
  overlayKeyPrefix = 'generalRegistration.kpi',
  instructorDisabled = false,
  instructorPlaceholder = '목표값 입력',
  volunteerDisabled = false,
  volunteerPlaceholder = '목표값 입력',
  dispatchedSchoolDisabled = false,
  dispatchedSchoolPlaceholder = '목표값 입력',
  dispatchedClassDisabled = false,
  dispatchedClassPlaceholder = '목표값 입력',
  educationProgressItems,
}: ProgramRegistrationBusinessKpiParagraphProps = {}) {
  const [participantCount, setParticipantCount] = useProgramRegistrationOverlayKv<number | null>(
    `${overlayKeyPrefix}.participantCount`,
    null
  )
  const [instructor, setInstructor] = useProgramRegistrationOverlayKv<number | null>(
    `${overlayKeyPrefix}.instructor`,
    null
  )
  const [volunteer, setVolunteer] = useProgramRegistrationOverlayKv<number | null>(
    `${overlayKeyPrefix}.volunteer`,
    null
  )
  const [dispatchedSchool, setDispatchedSchool] = useProgramRegistrationOverlayKv<number | null>(
    `${overlayKeyPrefix}.dispatchedSchool`,
    null
  )
  const [dispatchedClass, setDispatchedClass] = useProgramRegistrationOverlayKv<number | null>(
    `${overlayKeyPrefix}.dispatchedClass`,
    null
  )

  const progressItems =
    educationProgressItems ??
    ([
      {
        label: '강사',
        disabled: instructorDisabled,
        placeholder: instructorPlaceholder,
      },
      {
        label: '봉사자',
        disabled: volunteerDisabled,
        placeholder: volunteerPlaceholder,
      },
    ] as const)

  return (
    <DetailInfoForm
      title="사업 KPI 목표"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 최종 인원"
          edit={
            <KpiCountInput
              placeholder="목표값 입력"
              value={participantCount}
              onChange={setParticipantCount}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육진행자 최종 인원"
          edit={
            <div className="detail-info-form-inputs-wrapper program-registration-paragraph__instructor-kpi-row">
              {progressItems.map((item, index) => {
                const isDefaultInstructor = !educationProgressItems && item.label === '강사'
                const isDefaultVolunteer = !educationProgressItems && item.label === '봉사자'
                if (isDefaultInstructor) {
                  return (
                    <div
                      key={item.label}
                      className="program-registration-paragraph__instructor-kpi-group"
                    >
                      {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                      <span className="detail-info-form--text">{item.label}</span>
                      <KpiCountInput
                        disabled={item.disabled}
                        placeholder={item.placeholder ?? '목표값 입력'}
                        value={instructor}
                        onChange={setInstructor}
                      />
                    </div>
                  )
                }
                if (isDefaultVolunteer) {
                  return (
                    <div
                      key={item.label}
                      className="program-registration-paragraph__instructor-kpi-group"
                    >
                      {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                      <span className="detail-info-form--text">{item.label}</span>
                      <KpiCountInput
                        disabled={item.disabled}
                        placeholder={item.placeholder ?? '목표값 입력'}
                        value={volunteer}
                        onChange={setVolunteer}
                      />
                    </div>
                  )
                }
                return (
                  <KpiProgressItemInput
                    key={item.label}
                    overlayKey={`${overlayKeyPrefix}.educationProgress.${item.label.replace(/\s+/g, '_')}`}
                    label={item.label}
                    disabled={item.disabled}
                    placeholder={item.placeholder}
                    showSeparator={index > 0}
                  />
                )
              })}
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최종 파견 학교 수"
          edit={
            <KpiCountInput
              disabled={dispatchedSchoolDisabled}
              placeholder={dispatchedSchoolPlaceholder}
              value={dispatchedSchool}
              onChange={setDispatchedSchool}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="최종 파견 학급 수"
          edit={
            <KpiCountInput
              disabled={dispatchedClassDisabled}
              placeholder={dispatchedClassPlaceholder}
              value={dispatchedClass}
              onChange={setDispatchedClass}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
