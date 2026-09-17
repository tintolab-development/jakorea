import { useState, type FormEvent } from 'react'
import type { EducationTeacherApplicationGuidance } from '../../model/types'
import { ParagraphCard } from '@/features/form-template'
import {
  PFButton,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
  PFTextInput,
  PFTextarea,
} from '@/shared/ui'
import {
  TEACHER_GUIDANCE_ANSWER_MAX_LENGTH,
  TEACHER_GUIDANCE_ANSWER_PLACEHOLDER,
  TEACHER_GUIDANCE_FIELDS,
  TEACHER_GUIDANCE_THANKS_MESSAGE,
  TEACHER_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS,
  TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS,
} from '../teacher-application-content/guidance-fields'
import {
  fromTeacherGuidanceEditDraft,
  hasTeacherSexOffenseGuidance,
  toTeacherGuidanceEditDraft,
  type TeacherGuidanceEditDraft,
} from './sex-offense'
import styles from './guidance-edit-form.module.css'

export type TeacherGuidanceEditFormProps = {
  initialGuidance: EducationTeacherApplicationGuidance
  onSubmit: (next: EducationTeacherApplicationGuidance) => void
}

function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={name}>
      {options.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

export function TeacherGuidanceEditForm({
  initialGuidance,
  onSubmit,
}: TeacherGuidanceEditFormProps) {
  const hadSexOffense = hasTeacherSexOffenseGuidance(initialGuidance)
  const [draft, setDraft] = useState<TeacherGuidanceEditDraft>(() =>
    toTeacherGuidanceEditDraft(initialGuidance),
  )

  const updateTextField = (
    key: keyof Pick<
      TeacherGuidanceEditDraft,
      'computerInRoom' | 'waitingPlace' | 'meal' | 'otherNotes'
    >,
    value: string,
  ) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(fromTeacherGuidanceEditDraft(draft, hadSexOffense))
  }

  const sexOffense = draft.sexOffenseConsent
  const showSiteSubmission = sexOffense?.inquiryMethod === 'criminal_record_site'
  const showOnlineFields = showSiteSubmission && sexOffense?.siteSubmission === 'online'

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {TEACHER_GUIDANCE_FIELDS.map(field => (
        <ParagraphCard
          key={field.key}
          editableHeading={{
            isEditMode: false,
            titleValue: field.label,
            titleRequired: true,
            onTitleChange: () => {},
            descriptionValue: field.description,
            onDescriptionChange: () => {},
            showDescription: true,
          }}
        >
          <PFTextarea
            variant="formPage"
            width="100%"
            rows={3}
            maxLength={TEACHER_GUIDANCE_ANSWER_MAX_LENGTH}
            placeholder={TEACHER_GUIDANCE_ANSWER_PLACEHOLDER}
            value={draft[field.key]}
            onValueChange={value => updateTextField(field.key, value)}
          />
        </ParagraphCard>
      ))}

      {hadSexOffense && sexOffense ? (
        <ParagraphCard
          editableHeading={{
            isEditMode: false,
            titleValue: TEACHER_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.title,
            titleRequired: true,
            onTitleChange: () => {},
            descriptionValue: TEACHER_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description,
            onDescriptionChange: () => {},
            showDescription: true,
          }}
        >
          <PFFormFieldTable>
            <PFFormFieldRow>
              <PFFormField label="조회 방식" labelWidth="wider" fullWidth>
                <RadioGroup
                  name="sex-offense-inquiry"
                  value={sexOffense.inquiryMethod}
                  options={TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS}
                  onChange={inquiryMethod => {
                    setDraft(prev => ({
                      ...prev,
                      sexOffenseConsent: {
                        inquiryMethod,
                        siteSubmission:
                          inquiryMethod === 'criminal_record_site'
                            ? (prev.sexOffenseConsent?.siteSubmission ?? 'online')
                            : undefined,
                        orgId: prev.sexOffenseConsent?.orgId,
                        verificationCode: prev.sexOffenseConsent?.verificationCode,
                      },
                    }))
                  }}
                />
              </PFFormField>
            </PFFormFieldRow>
            {showSiteSubmission ? (
              <PFFormFieldRow>
                <PFFormField label="사이트 제출 방식" labelWidth="wider" fullWidth>
                  <RadioGroup
                    name="sex-offense-site-submission"
                    value={sexOffense.siteSubmission ?? 'online'}
                    options={TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS}
                    onChange={siteSubmission => {
                      setDraft(prev => ({
                        ...prev,
                        sexOffenseConsent: {
                          inquiryMethod: 'criminal_record_site',
                          siteSubmission,
                          orgId: prev.sexOffenseConsent?.orgId,
                          verificationCode: prev.sexOffenseConsent?.verificationCode,
                        },
                      }))
                    }}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
            {showOnlineFields ? (
              <PFFormFieldRow type="double">
                <PFFormField label="ID" labelWidth="wider">
                  <PFTextInput
                    variant="formPage"
                    placeholder="기관 아이디"
                    value={sexOffense.orgId ?? ''}
                    onValueChange={orgId => {
                      setDraft(prev => ({
                        ...prev,
                        sexOffenseConsent: {
                          inquiryMethod: 'criminal_record_site',
                          siteSubmission: 'online',
                          orgId,
                          verificationCode: prev.sexOffenseConsent?.verificationCode,
                        },
                      }))
                    }}
                  />
                </PFFormField>
                <PFFormField label="검증번호" labelWidth="wider">
                  <PFTextInput
                    variant="formPage"
                    placeholder="검증번호"
                    value={sexOffense.verificationCode ?? ''}
                    onValueChange={verificationCode => {
                      setDraft(prev => ({
                        ...prev,
                        sexOffenseConsent: {
                          inquiryMethod: 'criminal_record_site',
                          siteSubmission: 'online',
                          orgId: prev.sexOffenseConsent?.orgId,
                          verificationCode,
                        },
                      }))
                    }}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </ParagraphCard>
      ) : null}

      <ParagraphCard>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.thanksBody}>
          {TEACHER_GUIDANCE_THANKS_MESSAGE}
        </PFText>
      </ParagraphCard>

      <div className={styles.actions}>
        <PFButton type="submit" size="xlarge" width={240}>
          수정하기
        </PFButton>
      </div>
    </form>
  )
}
