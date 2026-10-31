import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import type { EducationUjatVolunteerApplicationContent } from '../../model/types'
import { hasUjatVolunteerApplicationProfile } from '../../lib/ujat-volunteer-application-content-from-answers'
import { EducationApplicationContent } from '../content'
import { PipeSeparatedFieldValue } from '../teacher-application-content/pipe-separated-field-value'
import styles from './ujat-volunteer-application-content.module.css'

export type UjatVolunteerApplicationContentProps = {
  profile?: EducationUjatVolunteerApplicationContent
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  preferredEducationScheduleLines?: readonly string[]
  alwaysShowPreferredSchedule?: boolean
}

function display(value: string): string {
  return value.trim() || '-'
}

export function UjatVolunteerApplicationContent({
  profile,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  preferredEducationScheduleLines,
  alwaysShowPreferredSchedule = false,
}: UjatVolunteerApplicationContentProps) {
  const showProfile = hasUjatVolunteerApplicationProfile(profile)
  const hasIntro = Boolean(selfIntroMotivation?.trim())
  const hasSchedule =
    alwaysShowPreferredSchedule ||
    Boolean(preferredEducationScheduleLabel?.trim()) ||
    Boolean(preferredEducationScheduleLines && preferredEducationScheduleLines.length > 0)
  const universityGrade = [profile?.universityName, profile?.gradeLabel]
    .map(part => part?.trim() ?? '')
    .filter(Boolean)
    .join(' | ')

  if (!showProfile && !hasIntro && !hasSchedule) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        신청 내용이 없습니다.
      </PFText>
    )
  }

  return (
    <div className={styles.root}>
      {showProfile && profile ? (
        <section className={styles.section} aria-label="봉사자 신청 기본 정보">
          <PFFormFieldTable>
            <PFFormFieldRow type="double">
              <PFFormField label="희망 교육 활동 지역">
                <p className={styles.fieldValue}>{display(profile.preferredRegion)}</p>
              </PFFormField>
              <PFFormField label="교육 진행 경험 여부">
                <p className={styles.fieldValue}>{display(profile.educationExperienceLabel)}</p>
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="double">
              <PFFormField label="대학교 및 학년">
                {universityGrade ? (
                  <PipeSeparatedFieldValue value={universityGrade} />
                ) : (
                  <p className={styles.fieldValue}>-</p>
                )}
              </PFFormField>
              <PFFormField label="대학 전공">
                <p className={styles.fieldValue}>{display(profile.major)}</p>
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow>
              <PFFormField label="지원 경로" fullWidth>
                <p className={styles.fieldValue}>{display(profile.applicationRouteLabel)}</p>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </section>
      ) : null}

      {hasIntro || hasSchedule ? (
        <EducationApplicationContent
          selfIntroMotivation={selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
          preferredEducationScheduleLines={preferredEducationScheduleLines}
          alwaysShowPreferredSchedule={alwaysShowPreferredSchedule}
        />
      ) : null}
    </div>
  )
}
