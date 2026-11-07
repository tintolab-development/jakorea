import type { SexOffenseInquiryCase } from '@jakorea/form-schema/program-application'
import type {
  EducationTeacherAssignedInstructor,
  EducationTeacherAssignment,
} from '../../model/types'
import {
  resolveAssignedInstructorQueryView,
  shouldShowTeacherAssignmentAside,
} from '../../lib/teacher-assignment-aside'
import { useAssignedInstructorsQuery } from '../../api/use-assigned-instructors-query'
import type {
  AssignedInstructor,
  AssignedInstructorApplicationType,
} from '../../api/assigned-instructors'
import type { ProgramApplicationType } from '../../api/types'
import { TeacherAssignedInstructorCard } from './assigned-instructor-card'
import { TeacherTextbookInfoCard } from './textbook-info-card'
import { PFText } from '@/shared/ui'
import styles from './assignment-aside.module.css'

export type TeacherEducationAssignmentAsideProps = {
  applicationId?: string
  applicationType?: ProgramApplicationType
  assignment: EducationTeacherAssignment
  sexOffenseInquiryCase?: SexOffenseInquiryCase | null
}

function mapAssignedInstructors(
  instructors: AssignedInstructor[],
): EducationTeacherAssignedInstructor[] {
  return instructors.map(instructor => ({
    id: String(instructor.instructorMemberId),
    instructorMemberId: instructor.instructorMemberId,
    name: instructor.name,
    assignmentId: instructor.assignmentId,
    programScheduleId: instructor.programScheduleId,
    assignmentStatus: instructor.assignmentStatus,
    ...(instructor.phone ? { phone: instructor.phone } : {}),
    ...(instructor.email ? { email: instructor.email } : {}),
    consentDocumentsRequested: instructor.consentDocumentsRequested,
    consents: instructor.consents.map(consent => ({
      id: consent.documentId != null ? String(consent.documentId) : consent.consentType,
      consentType: consent.consentType,
      title: consent.title,
      documentId: consent.documentId,
      originalFileName: consent.originalFileName ?? undefined,
    })),
  }))
}

export function TeacherEducationAssignmentAside({
  applicationId,
  applicationType,
  assignment,
  sexOffenseInquiryCase,
}: TeacherEducationAssignmentAsideProps) {
  const assignedQuery = useAssignedInstructorsQuery(applicationId, applicationType)
  const instructors = assignedQuery.isSuccess
    ? mapAssignedInstructors(assignedQuery.data.instructors)
    : []
  const instructorView = resolveAssignedInstructorQueryView({
    enabled: assignedQuery.remoteEnabled,
    isPending: assignedQuery.isPending,
    isError: assignedQuery.isError,
    isSuccess: assignedQuery.isSuccess,
    instructorCount: instructors.length,
  })
  const showTextbook = Boolean(assignment.textbook)
  if (!shouldShowTeacherAssignmentAside({ hasTextbook: showTextbook, instructorView })) {
    return null
  }

  const assignedApplicationType =
    applicationType === 'INDIVIDUAL' || applicationType === 'ORGANIZATION'
      ? (applicationType as AssignedInstructorApplicationType)
      : undefined

  return (
    <aside className={styles.aside} aria-label="교재 및 배정 정보">
      {showTextbook && assignment.textbook ? (
        <TeacherTextbookInfoCard textbook={assignment.textbook} />
      ) : null}
      {instructorView.kind === 'loading' ? (
        <div className={styles.statusCard} role="status">
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500">
            배정 강사 정보를 불러오는 중입니다.
          </PFText>
        </div>
      ) : null}
      {instructorView.kind === 'error' ? (
        <div className={styles.statusCard} role="alert">
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500">
            배정 강사 정보를 불러오지 못했습니다.
          </PFText>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              void assignedQuery.refetch()
            }}
          >
            다시 시도
          </button>
        </div>
      ) : null}
      {instructorView.kind === 'ready' ? (
        <TeacherAssignedInstructorCard
          applicationId={applicationId}
          applicationType={assignedApplicationType}
          instructors={instructors}
          onRefresh={() => assignedQuery.refetch()}
          sexOffenseInquiryCase={sexOffenseInquiryCase}
        />
      ) : null}
    </aside>
  )
}
