import {
  getSchoolTeacherEmploymentBadgeTone,
  getSchoolTeacherEmploymentStatusLabel,
  type SchoolTeacherEmploymentStatus,
} from '@jakorea/domain/instructor/employment-status'
import styles from './school-teacher-employment-status-badge.module.css'

export type SchoolTeacherEmploymentStatusBadgeProps = {
  status: SchoolTeacherEmploymentStatus
  className?: string
}

/** CMS `SchoolTeacherEmploymentStatusBadge` / `EditableStatusBadge` 읽기 전용 */
export function SchoolTeacherEmploymentStatusBadge({
  status,
  className,
}: SchoolTeacherEmploymentStatusBadgeProps) {
  const tone = getSchoolTeacherEmploymentBadgeTone(status)
  const classNames = [styles.badge, styles[tone], className].filter(Boolean).join(' ')

  return <span className={classNames}>{getSchoolTeacherEmploymentStatusLabel(status)}</span>
}
