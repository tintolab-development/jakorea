import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import type { EducationUjatVolunteerApplicationContent } from '../../model/types'
import { hasUjatVolunteerApplicationProfile } from '../../lib/ujat-volunteer-application-content-from-answers'
import { filterBlankMypagePreferredScheduleLines } from '../../lib/mypage-preferred-schedule-lines'
import type {
  VolunteerApplicationInfoField,
  VolunteerApplicationTextSection,
} from '../../lib/volunteer-application-extras-from-answers'
import { EducationApplicationContent } from '../content'
import { PipeSeparatedFieldValue } from '../teacher-application-content/pipe-separated-field-value'
import styles from './ujat-volunteer-application-content.module.css'

export type UjatVolunteerApplicationContentProps = {
  profile?: EducationUjatVolunteerApplicationContent
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  preferredEducationScheduleLines?: readonly string[]
  alwaysShowPreferredSchedule?: boolean
  freeTextSections?: readonly VolunteerApplicationTextSection[]
  infoFields?: readonly VolunteerApplicationInfoField[]
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
  freeTextSections,
  infoFields,
}: UjatVolunteerApplicationContentProps) {
  const showProfile = hasUjatVolunteerApplicationProfile(profile)
  const hasIntro = Boolean(selfIntroMotivation?.trim())
  const scheduleLines = filterBlankMypagePreferredScheduleLines(preferredEducationScheduleLines ?? [])
  const hasSchedule =
    scheduleLines.length > 0 || Boolean(preferredEducationScheduleLabel?.trim())
  const hasExtras = (freeTextSections?.length ?? 0) > 0 || (infoFields?.length ?? 0) > 0
  const universityGrade = [profile?.universityName, profile?.gradeLabel]
    .map(part => part?.trim() ?? '')
    .filter(Boolean)
    .join(' | ')

  if (!showProfile && !hasIntro && !hasSchedule && !hasExtras) {
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
            {profile.previousTermLabel.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="이전 UJAT 활동 기수" fullWidth>
                  <p className={styles.fieldValue}>{display(profile.previousTermLabel)}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
            {profile.interviewScheduleLabel.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="면접 진행 가능 일정" fullWidth>
                  {profile.interviewScheduleLabel
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(line => (
                      <p key={line} className={styles.fieldValue}>
                        {line}
                      </p>
                    ))}
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </section>
      ) : null}

      {hasIntro || hasSchedule || hasExtras ? (
        <EducationApplicationContent
          selfIntroMotivation={selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
          preferredEducationScheduleLines={scheduleLines}
          alwaysShowPreferredSchedule={alwaysShowPreferredSchedule && scheduleLines.length > 0}
          freeTextSections={freeTextSections}
          infoFields={infoFields}
        />
      ) : null}
    </div>
  )
}
