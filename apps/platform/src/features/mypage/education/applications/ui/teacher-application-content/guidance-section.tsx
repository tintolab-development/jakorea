import { useEffect, useState } from 'react'
import type { EducationTeacherApplicationGuidance } from '../../model/types'
import {
  PFButton,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
  PFTextarea,
} from '@/shared/ui'
import {
  TEACHER_GUIDANCE_ANSWER_MAX_LENGTH,
  TEACHER_GUIDANCE_ANSWER_PLACEHOLDER,
  TEACHER_GUIDANCE_FIELDS,
  TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL,
} from './guidance-fields'
import { splitPipeSeparatedParts } from './split-pipe-parts'
import styles from './teacher-application-content.module.css'

type GuidanceSectionProps = {
  guidance: EducationTeacherApplicationGuidance
  onSave: (next: EducationTeacherApplicationGuidance) => void
}

export function GuidanceSection({ guidance, onSave }: GuidanceSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(guidance)
  const showSexOffense = Boolean(guidance.sexOffenseConsentMethod?.trim())

  useEffect(() => {
    if (!isEditing) {
      setDraft(guidance)
    }
  }, [guidance, isEditing])

  const startEdit = () => {
    setDraft({ ...guidance })
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft({ ...guidance })
    setIsEditing(false)
  }

  const completeEdit = () => {
    onSave({ ...draft })
    setIsEditing(false)
  }

  const updateField = (key: keyof EducationTeacherApplicationGuidance, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  return (
    <section className={styles.sectionAfterDivider} aria-label="안내사항">
      <div className={styles.sectionHeader}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
          안내사항
        </PFText>
        <div className={styles.headerActions}>
          {isEditing ? (
            <>
              <PFButton type="button" size="small" variant="secondary" onClick={cancelEdit}>
                취소
              </PFButton>
              <PFButton type="button" size="small" variant="primary" onClick={completeEdit}>
                완료
              </PFButton>
            </>
          ) : (
            <PFButton type="button" size="medium" variant="secondary" onClick={startEdit}>
              안내사항 수정하기
            </PFButton>
          )}
        </div>
      </div>

      <PFFormFieldTable>
        {TEACHER_GUIDANCE_FIELDS.map(field => (
          <PFFormFieldRow key={field.key}>
            <PFFormField label={field.label} labelWidth="wider" fullWidth>
              {isEditing ? (
                <PFTextarea
                  width="100%"
                  size="medium"
                  rows={3}
                  maxLength={TEACHER_GUIDANCE_ANSWER_MAX_LENGTH}
                  placeholder={TEACHER_GUIDANCE_ANSWER_PLACEHOLDER}
                  value={draft[field.key]}
                  onValueChange={value => updateField(field.key, value)}
                />
              ) : (
                <p className={styles.fieldValue}>{guidance[field.key]}</p>
              )}
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
              {isEditing ? (
                <PFTextarea
                  width="100%"
                  size="medium"
                  rows={2}
                  maxLength={TEACHER_GUIDANCE_ANSWER_MAX_LENGTH}
                  placeholder={TEACHER_GUIDANCE_ANSWER_PLACEHOLDER}
                  value={draft.sexOffenseConsentMethod ?? ''}
                  onValueChange={value => updateField('sexOffenseConsentMethod', value)}
                />
              ) : (
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
              )}
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </section>
  )
}
