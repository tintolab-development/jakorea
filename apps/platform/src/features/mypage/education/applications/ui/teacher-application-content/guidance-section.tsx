import { useNavigate } from 'react-router-dom'
import type { EducationTeacherApplicationGuidance } from '../../model/types'
import { educationGuidanceEditPath } from '@/features/mypage/lib/constants'
import { PFButton, PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import {
  TEACHER_GUIDANCE_FIELDS,
  TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL,
} from './guidance-fields'
import { splitPipeSeparatedParts } from './split-pipe-parts'
import styles from './teacher-application-content.module.css'

type GuidanceSectionProps = {
  applicationId: string
  guidance: EducationTeacherApplicationGuidance
}

export function GuidanceSection({ applicationId, guidance }: GuidanceSectionProps) {
  const navigate = useNavigate()
  const showSexOffense = Boolean(
    guidance.sexOffenseConsent || guidance.sexOffenseConsentMethod?.trim(),
  )

  return (
    <section className={styles.sectionAfterDivider} aria-label="안내사항">
      <div className={styles.sectionHeader}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
          안내사항
        </PFText>
        <div className={styles.headerActions}>
          <PFButton
            type="button"
            size="medium"
            variant="secondary"
            onClick={() => navigate(educationGuidanceEditPath(applicationId))}
          >
            안내사항 수정하기
          </PFButton>
        </div>
      </div>

      <PFFormFieldTable>
        {TEACHER_GUIDANCE_FIELDS.map(field => (
          <PFFormFieldRow key={field.key}>
            <PFFormField label={field.label} labelWidth="wider" fullWidth>
              <p className={styles.fieldValue}>{guidance[field.key]}</p>
            </PFFormField>
          </PFFormFieldRow>
        ))}
        {showSexOffense ? (
          <PFFormFieldRow>
            <PFFormField
              label={TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL}
              labelWidth="wider"
              fullWidth
            >
              <p className={styles.inlineParts}>
                {splitPipeSeparatedParts(guidance.sexOffenseConsentMethod ?? '').map(
                  (part, index) => (
                    <span key={`sex-offense-${index}`} className={styles.inlinePartWrap}>
                      {index > 0 ? (
                        <span className={styles.sexOffensePartDivider} aria-hidden="true" />
                      ) : null}
                      <span className={styles.inlinePart}>{part}</span>
                    </span>
                  ),
                )}
              </p>
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </section>
  )
}
