import type { EducationTeacherAssignment } from '../../model/types'
import { TeacherAssignedInstructorCard } from './assigned-instructor-card'
import { TeacherTextbookInfoCard } from './textbook-info-card'
import styles from './assignment-aside.module.css'

export type TeacherEducationAssignmentAsideProps = {
  assignment: EducationTeacherAssignment
}

export function TeacherEducationAssignmentAside({
  assignment,
}: TeacherEducationAssignmentAsideProps) {
  const showTextbook = Boolean(assignment.textbook)
  const showInstructors = assignment.instructors.length > 0

  if (!showTextbook && !showInstructors) {
    return null
  }

  return (
    <aside className={styles.aside} aria-label="교재 및 배정 정보">
      {showTextbook && assignment.textbook ? (
        <TeacherTextbookInfoCard textbook={assignment.textbook} />
      ) : null}
      {showInstructors ? (
        <TeacherAssignedInstructorCard instructors={assignment.instructors} />
      ) : null}
    </aside>
  )
}
