import type { SexOffenseInquiryCase } from '@jakorea/form-schema/program-application'
import type { ProgramApplicationType } from '../api/types'
import type { EducationDisplayStatus } from '../model/types'

export type AssignedInstructorQueryView =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; instructorCount: number }

export type AssignedInstructorCardBody = 'consents' | 'site_direct' | 'site_online' | 'name_only'

export function shouldMountTeacherEducationAssignmentAside(input: {
  isTeacher: boolean
  applicationType?: ProgramApplicationType | null
  hasTeacherAssignment: boolean
  displayStatus?: EducationDisplayStatus | null
}): boolean {
  if (!input.isTeacher) return false
  if (
    input.displayStatus === 'waiting_result' ||
    input.displayStatus === 'document_passed' ||
    input.displayStatus === 'rejected' ||
    input.displayStatus === 'cancelled' ||
    input.displayStatus === 'approval_cancelled'
  ) {
    return false
  }
  if (input.applicationType === 'INDIVIDUAL' || input.applicationType === 'ORGANIZATION') {
    return true
  }
  return input.hasTeacherAssignment
}

export function resolveAssignedInstructorQueryView(input: {
  enabled: boolean
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  instructorCount: number
}): AssignedInstructorQueryView {
  if (!input.enabled) return { kind: 'disabled' }
  if (input.isError) return { kind: 'error' }
  if (input.isSuccess) {
    return input.instructorCount > 0
      ? { kind: 'ready', instructorCount: input.instructorCount }
      : { kind: 'empty' }
  }
  if (input.isPending) return { kind: 'loading' }
  return { kind: 'loading' }
}

export function shouldShowTeacherAssignmentAside(input: {
  hasTextbook: boolean
  instructorView: AssignedInstructorQueryView
}): boolean {
  if (input.hasTextbook) return true
  return (
    input.instructorView.kind === 'loading' ||
    input.instructorView.kind === 'error' ||
    input.instructorView.kind === 'ready'
  )
}

export function resolveAssignedInstructorCardBody(
  sexOffenseInquiryCase: SexOffenseInquiryCase | null | undefined,
): AssignedInstructorCardBody {
  if (sexOffenseInquiryCase === 'site_direct') return 'site_direct'
  if (sexOffenseInquiryCase === 'site_online') return 'site_online'
  if (sexOffenseInquiryCase === undefined || sexOffenseInquiryCase === 'ja_system') {
    return 'consents'
  }
  return 'name_only'
}
