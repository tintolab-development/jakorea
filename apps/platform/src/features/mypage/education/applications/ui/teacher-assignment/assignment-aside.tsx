import type {
  EducationTeacherAssignedInstructor,
  EducationTeacherAssignment,
} from '../../model/types'
import { useAssignedInstructorsQuery } from '../../api/use-assigned-instructors-query'
import type { AssignedInstructorApplicationType } from '../../api/assigned-instructors'
import type { ProgramApplicationType } from '../../api/types'
import { TeacherAssignedInstructorCard } from './assigned-instructor-card'
import { TeacherTextbookInfoCard } from './textbook-info-card'
import styles from './assignment-aside.module.css'

export type TeacherEducationAssignmentAsideProps = {
  applicationId?: string
  applicationType?: ProgramApplicationType
  assignment: EducationTeacherAssignment
}

export function TeacherEducationAssignmentAside({
  applicationId,
  applicationType,
  assignment,
}: TeacherEducationAssignmentAsideProps) {
  const assignedQuery = useAssignedInstructorsQuery(applicationId, applicationType)
  const instructors: EducationTeacherAssignedInstructor[] = assignedQuery.isSuccess
    ? assignedQuery.data.instructors.map(instructor => ({
        id: String(instructor.instructorMemberId),
        instructorMemberId: instructor.instructorMemberId,
        name: instructor.name,
        consentDocumentsRequested: instructor.consentDocumentsRequested,
        consents: instructor.consents.map(consent => ({
          id: consent.documentId != null ? String(consent.documentId) : consent.consentType,
          consentType: consent.consentType,
          title: consent.title,
          documentId: consent.documentId,
          originalFileName: consent.originalFileName ?? undefined,
        })),
      }))
    : []
  const showTextbook = Boolean(assignment.textbook)
  const showInstructors = instructors.length > 0

  if (!showTextbook && !showInstructors) {
    return null
  }

  return (
    <aside className={styles.aside} aria-label="교재 및 배정 정보">
      {showTextbook && assignment.textbook ? (
        <TeacherTextbookInfoCard textbook={assignment.textbook} />
      ) : null}
      {showInstructors ? (
        <TeacherAssignedInstructorCard
          applicationId={applicationId}
          applicationType={
            applicationType === 'INDIVIDUAL' || applicationType === 'ORGANIZATION'
              ? (applicationType as AssignedInstructorApplicationType)
              : undefined
          }
          instructors={instructors}
          onRefresh={() => assignedQuery.refetch()}
        />
      ) : null}
    </aside>
  )
}
