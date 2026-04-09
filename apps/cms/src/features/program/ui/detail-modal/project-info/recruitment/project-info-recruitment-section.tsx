/**
 * 참여자·강사·봉사자 모집 섹션 + 풀페이지 모달 서브탭 레이아웃 통합
 */

import { createInstitutionsSchema } from './institutions-schema'
import { createInstructorsSchema } from './instructors-schema'
import { createVolunteersSchema } from './volunteers-schema'
import { renderSchema } from './recruitment-schema-renderer'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import {
  formatDateOnly,
  formatDateRange,
  getInstructorRecruitmentStatus,
  getParticipantRecruitmentLifecycle,
  getVolunteerRecruitmentStatus,
  RECRUITMENT_RADIO_OPTIONS,
  TARGET_LEVEL_LABEL,
} from '../constants/program-detail-info-constants'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'

const STUDENT_LIST_OPTIONS = [
  { value: 'required' as const, label: '필요' },
  { value: 'not_required' as const, label: '불필요' },
]

/** lifecycleStatus 기반 강사 모집 현황 → 프로그램 진행 상태 라벨·스타일(기본 정보 탭과 동일) */
const INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'instructor_recruitment_planned',
  recruiting: 'recruiting_instructors',
  closed: 'education_completed',
}

/** 봉사자 모집 현황(예정/중/마감) → 프로그램 진행 상태 클래스(참여자·강사 탭과 동일 색상 토큰) */
const VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'volunteer_recruitment_planned',
  recruiting: 'recruiting_volunteers',
  closed: 'document_processing_completed',
}

/** 봉사자 모집 현황 라벨 (모집 예정 / 모집 중 / 모집 마감) */
const VOLUNTEER_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '봉사자 모집 예정',
  recruiting: '봉사자 모집 중',
  closed: '봉사자 모집 마감',
}

export interface ParticipantRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function ParticipantRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: ParticipantRecruitmentSectionProps) {
  const isFormEdit = isEditMode && form
  const participantRecruitmentLifecycle = getParticipantRecruitmentLifecycle(
    program,
    isFormEdit
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )
  const targetLabel = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '-'
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod = program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate ? `${formatDateOnly(resultDate)} | ${resultMethod}` : '-'
  const maxClassCount = program.rounds?.[0]?.classCount
  const maxClassLabel = maxClassCount != null ? `${maxClassCount}개` : '-'
  const notes = program.oneLineIntroduction ?? '-'
  const studentListValue = isFormEdit
    ? form.watch('studentListRequired')
    : program.studentListRequired
  const studentListLabel =
    studentListValue != null
      ? (STUDENT_LIST_OPTIONS.find(o => o.value === studentListValue)?.label ?? '-')
      : '-'

  const isEdit = Boolean(isFormEdit)
  const schema = createInstitutionsSchema({
    program,
    form: isFormEdit ? form : undefined,
    isEdit,
    sponsorName,
    participantRecruitmentLifecycle,
    targetLabel,
    resultLine,
    maxClassLabel,
    studentListLabel,
    notes,
  })

  return (
    <DetailInfoForm title="참여자 모집" mode={isFormEdit ? 'edit' : 'view'}>
      {renderSchema(schema, isEdit)}
    </DetailInfoForm>
  )
}

export interface InstructorRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function InstructorRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: InstructorRecruitmentSectionProps) {
  const recruitmentStatus = getInstructorRecruitmentStatus(program)
  const instructorRecruitmentLifecycle =
    recruitmentStatus != null ? INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus] : null

  const instructorTarget = program.instructorTarget ?? '성인'
  const instructorTargetDetail = program.instructorTargetDetail ?? '-'

  const notes =
    program.otherNotes ??
    program.oneLineIntroduction ??
    '상기 일정은 기관 사정에 따라 변동될 수 있습니다.'

  const isFormEdit = isEditMode && form
  const isEdit = Boolean(isFormEdit)
  const schema = createInstructorsSchema({
    program,
    form: isFormEdit ? form : undefined,
    isEdit,
    sponsorName,
    instructorRecruitmentLifecycle,
    instructorTarget,
    instructorTargetDetail,
    notes,
  })

  return (
    <DetailInfoForm title="강사 모집" mode={isFormEdit ? 'edit' : 'view'}>
      {renderSchema(schema, isEdit)}
    </DetailInfoForm>
  )
}

export interface VolunteerRecruitmentSectionProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function VolunteerRecruitmentSection({
  program,
  sponsorName,
  isEditMode = false,
  form,
}: VolunteerRecruitmentSectionProps) {
  const recruitmentStatus = getVolunteerRecruitmentStatus(program)
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? (VOLUNTEER_RECRUITMENT_LABELS[recruitmentStatus] ??
        RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ??
        '-')
      : '-'
  const volunteerRecruitmentLifecycle =
    recruitmentStatus != null ? VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus] : null

  const volunteerTarget = program.volunteerTarget ?? '대학(원)생'
  const volunteerTargetDetail = program.volunteerTargetDetail ?? '-'

  const volunteerStart =
    program.volunteerApplicationStartDate ??
    program.instructorApplicationStartDate ??
    program.applicationStartDate
  const volunteerEnd =
    program.volunteerApplicationEndDate ??
    program.instructorApplicationEndDate ??
    program.applicationEndDate

  const volunteerPeriodLabel = formatDateRange(volunteerStart, volunteerEnd)

  const notes = (program.oneLineIntroduction ?? '').trim() || '-'

  const isFormEdit = isEditMode && form
  const isEdit = Boolean(isFormEdit)
  const schema = createVolunteersSchema({
    program,
    form: isFormEdit ? form : undefined,
    isEdit,
    sponsorName,
    recruitmentStatusLabel,
    volunteerRecruitmentLifecycle,
    volunteerTarget,
    volunteerTargetDetail,
    volunteerPeriodLabel,
    notes,
  })

  return (
    <DetailInfoForm title="봉사자 모집" mode={isFormEdit ? 'edit' : 'view'}>
      {renderSchema(schema, isEdit)}
    </DetailInfoForm>
  )
}
