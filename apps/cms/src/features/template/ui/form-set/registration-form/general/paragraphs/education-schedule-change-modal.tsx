import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import { useComposedRegistrationBusinessPeriodDisabledDate } from '@/features/program/shared/ui/registration/registration-business-period-constraint'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { shiftEducationScheduleLineToDate } from '@/features/template/lib/format-education-schedule-line'
import './education-schedule-change-modal.css'

export function EducationScheduleChangeModal({
  open,
  lines,
  onCancel,
  onConfirm,
}: {
  open: boolean
  lines: readonly string[]
  onCancel: () => void
  onConfirm: (nextLines: string[]) => void
}) {
  const [changedDates, setChangedDates] = useState<Record<number, Dayjs | null>>({})
  const disabledDate = useComposedRegistrationBusinessPeriodDisabledDate()

  useEffect(() => {
    if (open) setChangedDates({})
  }, [open])

  const hasChange = lines.some((_, index) => changedDates[index] != null)

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 진행 일정 변경"
      width={1000}
      className="education-schedule-change-modal"
      footer={
        <div className="education-schedule-change-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!hasChange}
            onClick={() =>
              onConfirm(
                lines.map((line, index) => {
                  const next = changedDates[index]
                  return next ? shiftEducationScheduleLineToDate(line, next) : line
                })
              )
            }
          >
            일정 변경
          </CmsButton>
        </div>
      }
    >
      <div className="education-schedule-change-modal__content">
        <p className="education-schedule-change-modal__description">
          같은 날짜에 교육 예정인 모든 기관의 일정도 함께 변경됩니다.
        </p>
        <DetailInfoForm title="교육 진행 일정 변경" hideHeader mode="edit">
          {lines.map((line, index) => (
            <DetailInfoForm.Row key={`${line}-${index}`} type="double">
              <DetailInfoForm.Field
                label="기존 일정"
                readOnlyDisplay
                view={formatCmsScheduleDisplayLabel(line)}
              />
              <DetailInfoForm.Field
                label="변경 일정"
                view="-"
                edit={
                  <CmsDatePicker
                    inputSize="small"
                    value={changedDates[index] ?? null}
                    placeholder="변경 일정을 선택해 주세요"
                    style={{ width: '100%' }}
                    disabledDate={disabledDate}
                    onChange={date =>
                      setChangedDates(prev => ({
                        ...prev,
                        [index]: date ? dayjs(date) : null,
                      }))
                    }
                  />
                }
              />
            </DetailInfoForm.Row>
          ))}
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
