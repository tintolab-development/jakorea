import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { applyEducationSurveyAnswersToDraft } from '@/features/mypage/education/surveys/lib/survey-answers'
import {
  getAllLectureReportAssignments,
  getLectureReportApiErrorMessage,
  getLectureReportContent,
  getLectureReportState,
  type LectureReportAssignment,
  type LectureReportContent,
  type LectureReportState,
} from '../api/lecture-report-client'

export type LectureReportPreviewLoaded = {
  assignment: LectureReportAssignment
  state: LectureReportState
  content: LectureReportContent
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function writingFormDraftFromLectureReportPreview(
  loaded: LectureReportPreviewLoaded,
): WritingFormDraft {
  const answers = loaded.content.answers ?? record(loaded.content.form.answers)
  const draft = writingFormDraftFromApplicationForm(loaded.content.form, answers)
  if (!draft) throw new Error('강의보고서 양식을 화면에 표시할 수 없습니다.')
  return applyEducationSurveyAnswersToDraft(draft, answers)
}

export async function loadLectureReportPreview(
  assignmentId: number,
  applicationId: string,
): Promise<LectureReportPreviewLoaded> {
  const state = await getLectureReportState(assignmentId)
  if (state.assignmentId !== assignmentId) {
    throw new Error('강의보고서 일정 정보가 요청한 배정과 일치하지 않습니다.')
  }
  if (
    applicationId &&
    state.instructorApplicationId != null &&
    state.instructorApplicationId !== Number(applicationId)
  ) {
    throw new Error('강의보고서 일정 정보가 현재 강의와 일치하지 않습니다.')
  }
  if (state.reportStatus !== 'SUBMITTED') {
    throw new Error('아직 제출된 강의보고서가 없습니다.')
  }

  const assignments = await getAllLectureReportAssignments(state.programId)
  const assignment = assignments.find(item => item.assignmentId === assignmentId)
  if (!assignment) throw new Error('강의보고서 일정 정보를 찾을 수 없습니다.')
  if (
    assignment.programId !== state.programId ||
    assignment.scheduleId !== state.programScheduleId
  ) {
    throw new Error('강의보고서 일정 정보가 현재 강의와 일치하지 않습니다.')
  }

  const content = await getLectureReportContent(assignmentId)
  return { assignment, state, content }
}

export function getLectureReportPreviewLoadErrorMessage(cause: unknown): string {
  return getLectureReportApiErrorMessage(
    cause,
    cause instanceof Error ? cause.message : '강의보고서를 불러오지 못했습니다.',
  )
}
