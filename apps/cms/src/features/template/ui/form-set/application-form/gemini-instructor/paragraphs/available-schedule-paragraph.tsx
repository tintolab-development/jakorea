import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'
import {
  ProgramApplicationScheduleSummaryHintText,
  ProgramApplicationScheduleTemplateHintParagraph,
  GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT,
} from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

function GeminiInstructorAvailableScheduleTemplatePlaceholder() {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const summaryHint = (
    <div className="program-application-form-instructor__field-summary-wrap">
      <ProgramApplicationScheduleSummaryHintText />
    </div>
  )

  return (
    <div
      className={[
        'program-application-form-instructor__available-schedule',
        // 템플릿 관리 시안(12875:515880) — 안내 박스 ↔ 요약 표 16
        isTemplateManagementScreen &&
          'program-application-form-instructor__available-schedule--template-spec',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="program-application-schedule-template-placeholder">
        <ProgramApplicationScheduleTemplateHintParagraph
          hintText={GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT}
        />
      </div>
      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="강의 진행 가능일"
            edit={summaryHint}
            view={summaryHint}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

/** Gemini 찾아가는 연수 강사 신청 — 강의 진행 가능 일정 */
export function GeminiInstructorAvailableScheduleParagraph({
  scheduleSlots,
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
}: {
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
}) {
  if (isTemplateAuthoringMode) {
    return <GeminiInstructorAvailableScheduleTemplatePlaceholder />
  }

  return (
    <InstructorAvailableScheduleParagraph
      scheduleSlots={scheduleSlots}
      isTemplateAuthoringMode={false}
      readOnlyPreview={readOnlyPreview}
      overlayKeyPrefix="application.gemini.instructor"
    />
  )
}
