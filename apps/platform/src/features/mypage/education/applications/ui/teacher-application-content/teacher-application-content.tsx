import { useEffect, useState } from 'react'
import type {
  EducationTeacherApplicationContent as TeacherApplicationContentModel,
  EducationTeacherApplicationGuidance,
} from '../../model/types'
import { updateMockTeacherApplicationGuidance } from '../../lib/mock-applications'
import { GuidanceSection } from './guidance-section'
import { InstitutionInfoTable } from './institution-info-table'
import { PreferredSchedules } from './preferred-schedules'
import styles from './teacher-application-content.module.css'

export type TeacherApplicationContentProps = {
  applicationId: string
  content: TeacherApplicationContentModel
}

export function TeacherApplicationContent({
  applicationId,
  content,
}: TeacherApplicationContentProps) {
  const [guidance, setGuidance] = useState(content.guidance)

  useEffect(() => {
    setGuidance(content.guidance)
  }, [applicationId, content.guidance])

  const handleSaveGuidance = (next: EducationTeacherApplicationGuidance) => {
    setGuidance(next)
    updateMockTeacherApplicationGuidance(applicationId, next)
  }

  return (
    <div className={styles.root}>
      <section className={styles.section} aria-label="신청 기관 정보">
        <InstitutionInfoTable institution={content.institution} />
      </section>
      <GuidanceSection guidance={guidance} onSave={handleSaveGuidance} />
      <PreferredSchedules schedules={content.preferredSchedules} />
    </div>
  )
}
