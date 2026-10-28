import { useEffect, useState } from 'react'
import type { ProgramApplicationType } from '../../api/types'
import type { EducationTeacherApplicationContent as TeacherApplicationContentModel } from '../../model/types'
import { GuidanceSection } from './guidance-section'
import { InstitutionInfoTable } from './institution-info-table'
import { PreferredSchedules } from './preferred-schedules'
import styles from './teacher-application-content.module.css'

export type TeacherApplicationContentProps = {
  applicationId: string
  applicationType?: ProgramApplicationType
  content: TeacherApplicationContentModel
  showGuidanceWriteLink?: boolean
  /** 기관 안내사항 양식이 없는 프로그램(교육받은 교사 등)은 false */
  institutionGuidanceEnabled?: boolean
  showPreferredEducationForm?: boolean
  /** 제미나이 등 — 제출값 조회 전용 */
  readOnly?: boolean
  /** 진행 중 + 안내사항 필수 + 조회 방식 데이터가 있을 때만 성범죄경력 행 노출 */
  showSexOffenseMethodRow?: boolean
}

export function TeacherApplicationContent({
  applicationId,
  applicationType,
  content,
  showGuidanceWriteLink = false,
  institutionGuidanceEnabled = true,
  showPreferredEducationForm = false,
  readOnly = false,
  showSexOffenseMethodRow = false,
}: TeacherApplicationContentProps) {
  const [guidance, setGuidance] = useState(content.guidance)

  useEffect(() => {
    setGuidance(content.guidance)
  }, [applicationId, content.guidance])

  const showGuidanceSection = institutionGuidanceEnabled

  return (
    <div className={styles.root}>
      <section className={styles.section} aria-label="신청 기관 정보">
        <InstitutionInfoTable
          institution={content.institution}
          showPreferredEducationForm={showPreferredEducationForm}
        />
      </section>
      {showGuidanceSection ? (
        <GuidanceSection
          applicationId={applicationId}
          applicationType={applicationType}
          guidance={guidance}
          showWriteLink={showGuidanceWriteLink && !readOnly}
          showSexOffenseMethodRow={showSexOffenseMethodRow}
        />
      ) : null}
      <PreferredSchedules schedules={content.preferredSchedules} />
    </div>
  )
}
