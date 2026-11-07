import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
  SchoolTeacherEmploymentStatusDropdown,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import '@/features/user/detail/ui/user-basic-info-section.css'

export function GeminiApprovedTeacherEmploymentStatusField({
  teacherMemberId,
  employmentStatus,
  onChange,
}: {
  teacherMemberId?: string
  employmentStatus: SchoolTeacherEmploymentStatus
  onChange: (status: SchoolTeacherEmploymentStatus) => void | Promise<void>
}) {
  return (
    <span className="gemini-approved-training-detail-info__employment-dropdown">
      <SchoolTeacherEmploymentStatusDropdown
        userId={teacherMemberId ?? ''}
        employmentStatusLabel={SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[employmentStatus]}
        emptyFallback={null}
        onChange={onChange}
      />
    </span>
  )
}
