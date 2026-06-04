import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { GeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import {
  isGeneralProgramVolunteerInterviewScheduleVisible,
  resolveGeneralProgramVolunteerInterviewScheduleDisplay,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from '@/features/program/general/lib/volunteer-recruitment-display'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph.css'

const FORM_CLASS = 'program-registration-paragraph'

function UnavailableDatesReadRow({
  recurring,
  specific,
}: {
  recurring: string
  specific: string
}) {
  if (!recurring.trim() && !specific.trim()) return <>-</>
  if (!specific.trim()) return <>{recurring}</>
  if (!recurring.trim()) return <>{specific}</>
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{recurring}</span>
      <DetailInfoForm.InputsSeparator />
      <span>{specific}</span>
    </div>
  )
}

function GeneralProgramVolunteerInterviewScheduleView({
  display,
  isEdit,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
}: {
  display: GeneralProgramVolunteerInterviewScheduleDisplay
  isEdit: boolean
  exceptionBlockKeys: number[]
  onRemoveExceptionBlock: (key: number) => void
  commonScheduleSeed?: ReturnType<typeof resolveGeneralProgramVolunteerInterviewScheduleEditSeed>
}) {
  if (isEdit) {
    return (
      <RecruitFormVolunteerInterviewScheduleParagraph
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={onRemoveExceptionBlock}
        commonScheduleSeed={commonScheduleSeed}
      />
    )
  }

  return (
    <DetailInfoForm title="면접 진행 가능 일정" hideHeader mode="view" className={FORM_CLASS}>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="면접 진행 불가일"
          fullRow
          view={
            <UnavailableDatesReadRow
              recurring={display.recurringUnavailable}
              specific={display.specificUnavailableDates}
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="면접 진행 가능 시간"
          fullRow
          view={display.availableTimeSlots}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

const INTERVIEW_SCHEDULE_EDIT_DESCRIPTION =
  '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요'

export function GeneralProgramVolunteerInterviewScheduleSection({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const editSeed = resolveGeneralProgramVolunteerInterviewScheduleEditSeed(program)
  const recruitmentDisplay = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
  const interviewEnabledField = form?.watch('volunteerRecruitmentInterviewEnabled')
  const [exceptionBlockKeys, setExceptionBlockKeys] = useState<number[]>([])
  const showInterviewSchedule =
    isEdit && form
      ? interviewEnabledField === 'yes'
      : isGeneralProgramVolunteerInterviewScheduleVisible(program) &&
        recruitmentDisplay.interviewEnabledLabel === '면접 있음'

  if (!showInterviewSchedule) return null

  const isFormEdit = Boolean(isEdit && form)

  return (
    <section aria-label="면접 진행 가능 일정">
      <FormParagraphSectionHeader
        title="면접 진행 가능 일정"
        surface="responseEntry"
        titleAligned
        required
        description={isFormEdit ? INTERVIEW_SCHEDULE_EDIT_DESCRIPTION : undefined}
        titleTrailing={
          isFormEdit ? (
            <div className="volunteer-interview-available-schedule__card-title-actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                icon={<PlusOutlined aria-hidden />}
                onClick={() => setExceptionBlockKeys(prev => [...prev, Date.now()])}
              >
                예외 일정 추가
              </CmsButton>
            </div>
          ) : undefined
        }
      />
      <GeneralProgramVolunteerInterviewScheduleView
        display={display}
        isEdit={isFormEdit}
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={key =>
          setExceptionBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
        }
        commonScheduleSeed={editSeed}
      />
    </section>
  )
}
