import { useNavigate } from 'react-router-dom'
import type { ProgramApplicationType } from '../../api/types'
import type { EducationTeacherApplicationGuidance } from '../../model/types'
import { educationInstitutionGuidanceWritePath } from '../../lib/guidance-path'
import {
  PFButton,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
} from '@/shared/ui'
import {
  TEACHER_GUIDANCE_FIELDS,
  TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL,
} from './guidance-fields'
import { PipeSeparatedFieldValue } from './pipe-separated-field-value'
import styles from './teacher-application-content.module.css'

type GuidanceSectionProps = {
  applicationId: string
  applicationType?: ProgramApplicationType
  guidance: EducationTeacherApplicationGuidance
  showWriteLink?: boolean
}

export function GuidanceSection({
  applicationId,
  applicationType,
  guidance,
  showWriteLink = false,
}: GuidanceSectionProps) {
  const navigate = useNavigate()
  const showSexOffense = Boolean(guidance.sexOffenseConsentMethod?.trim())

  return (
    <section className={styles.sectionAfterDivider} aria-label="안내사항">
      <div className={styles.sectionHeader}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
          안내사항
        </PFText>
        {showWriteLink ? (
          <PFButton
            type="button"
            size="medium"
            variant="secondary"
            onClick={() =>
              navigate(educationInstitutionGuidanceWritePath(applicationId, applicationType))
            }
          >
            안내사항 수정하기
          </PFButton>
        ) : null}
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
              <PipeSeparatedFieldValue value={guidance.sexOffenseConsentMethod ?? ''} />
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </section>
  )
}
