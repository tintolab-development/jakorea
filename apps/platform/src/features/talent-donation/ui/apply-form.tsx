import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  buildRequiredConsentDisagreeAlertMessage,
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
} from '@jakorea/domain/shared/required-consent-alert'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  PFAlertModal,
  PFButton,
  PFToggle,
  PFDateInput,
  PFDivider,
  PFFormPeriodPair,
  PFFormPeriodTilde,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import {
  EMPTY_TALENT_APPLY_FORM_VALUES,
  GENDER_OPTIONS,
  JA_PARTICIPATION_OPTIONS,
  TALENT_APPLY_FILE_GUIDE,
  TALENT_APPLY_PLACEHOLDERS as PH,
  TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE,
  TALENT_APPLY_STEP_TITLES,
  TALENT_APPLY_SUBMIT_LABEL,
  type TalentApplyFieldKey,
  type TalentApplyFormValues,
  type TalentApplyGender,
  type TalentApplyJaParticipation,
} from '../lib/apply-form'
import {
  TALENT_APPLY_PRIVACY_CONSENT_INTRO,
  TALENT_APPLY_PRIVACY_CONSENT_LABEL,
  TALENT_APPLY_PRIVACY_CONSENT_SECTIONS,
} from '../lib/privacy-consent'
import {
  collectTalentApplyFieldErrors,
  hasTalentApplyFieldErrors,
  type TalentApplyFieldErrors,
} from '../lib/validate-apply-form'
import styles from './apply-form.module.css'

type AlertState = {
  title: string
  description?: string
} | null

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor?: string
  children: string
  required?: boolean
}) {
  return (
    <label className={styles.fieldLabel} htmlFor={htmlFor}>
      <PFText as="span" typo="form-field-label" color="neutral-warm-600">
        {children}
      </PFText>
      {required ? (
        <PFText
          as="span"
          typo="bd-sm-md"
          color="error"
          className={styles.requiredMark}
          aria-hidden
        >
          *
        </PFText>
      ) : null}
    </label>
  )
}

function JaParticipationRadioGroup({
  value,
  onChange,
  error,
}: {
  value: TalentApplyJaParticipation
  onChange: (next: TalentApplyJaParticipation) => void
  error?: boolean
}) {
  return (
    <div
      className={styles.radioGroup}
      role="radiogroup"
      aria-label="JA 프로그램 참여 여부"
      aria-invalid={error || undefined}
    >
      {JA_PARTICIPATION_OPTIONS.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name="talent-apply-ja-participation"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'neutral-cool-500'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

export function TalentDonationApplyForm() {
  const [values, setValues] = useState<TalentApplyFormValues>(EMPTY_TALENT_APPLY_FORM_VALUES)
  const [errors, setErrors] = useState<TalentApplyFieldErrors>({})
  const [alert, setAlert] = useState<AlertState>(null)
  const [attachedFileName, setAttachedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sidoOptions = getSidoOptions()
  const sigunguOptions = getSigunguOptions(values.sido)

  const patch = <K extends keyof TalentApplyFormValues>(
    key: K,
    next: TalentApplyFormValues[K],
    clearKeys: TalentApplyFieldKey[] = [key as TalentApplyFieldKey]
  ) => {
    setValues(prev => ({ ...prev, [key]: next }))
    setErrors(prev => {
      const updated = { ...prev }
      for (const fieldKey of clearKeys) {
        delete updated[fieldKey]
      }
      return updated
    })
  }

  const handlePhoneChange = (next: string) => {
    patch('phone', formatKoreanPhoneNumber(next))
  }

  const handleSidoChange = (next: string) => {
    setValues(prev => ({ ...prev, sido: next, sigungu: '' }))
    setErrors(prev => {
      const updated = { ...prev }
      delete updated.sido
      delete updated.sigungu
      return updated
    })
  }

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setAttachedFileName(file?.name ?? '')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = collectTalentApplyFieldErrors(values)
    setErrors(nextErrors)

    if (hasTalentApplyFieldErrors(nextErrors)) {
      if (nextErrors.privacy && Object.keys(nextErrors).length === 1) {
        setAlert({
          title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
          description: buildRequiredConsentDisagreeAlertMessage([
            TALENT_APPLY_PRIVACY_CONSENT_LABEL,
          ]),
        })
        return
      }

      setAlert({
        title: '안내',
        description: TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE,
      })
      return
    }

    // TODO: 재능기부 신청 API가 준비되면 이 지점에서 mutation/service를 연결한다.
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.step} aria-labelledby="talent-apply-step-basic">
          <div className={styles.stepHeader}>
            <PFDivider variant="focus" />
            <PFText
              as="h2"
              id="talent-apply-step-basic"
              typo="form-section-title"
              color="black"
              className={styles.stepTitle}
            >
              {TALENT_APPLY_STEP_TITLES.basic}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-name" required>
                이름
              </FieldLabel>
              <PFTextInput
                id="talent-apply-name"
                className={styles.control}
                size="xlarge"
                width="100%"
                placeholder={PH.name}
                value={values.name}
                error={Boolean(errors.name)}
                onValueChange={value => patch('name', value)}
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-birth" required>
                생년월일
              </FieldLabel>
              <PFDateInput
                id="talent-apply-birth"
                className={styles.control}
                size="xlarge"
                width="100%"
                picker="date"
                placeholder={PH.birthDate}
                value={values.birthDate}
                error={Boolean(errors.birthDate)}
                onValueChange={value => patch('birthDate', value)}
                aria-label="생년월일"
              />
            </div>

            <div className={styles.field}>
              <FieldLabel required>성별</FieldLabel>
              <div className={styles.genderOptions} role="group" aria-label="성별">
                {GENDER_OPTIONS.map(option => (
                  <PFButton
                    key={option.value}
                    type="button"
                    size="xlarge"
                    variant="tertiary"
                    selected={values.gender === option.value}
                    width="100%"
                    onClick={() => patch('gender', option.value as TalentApplyGender)}
                  >
                    {option.label}
                  </PFButton>
                ))}
              </div>
              {errors.gender ? (
                <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fieldErrorText}>
                  성별을 선택해 주세요
                </PFText>
              ) : null}
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-phone" required>
                휴대폰 번호
              </FieldLabel>
              <PFTextInput
                id="talent-apply-phone"
                className={styles.control}
                size="xlarge"
                width="100%"
                placeholder={PH.phone}
                value={values.phone}
                error={Boolean(errors.phone)}
                onValueChange={handlePhoneChange}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-email" required>
                이메일
              </FieldLabel>
              <PFTextInput
                id="talent-apply-email"
                className={styles.control}
                size="xlarge"
                width="100%"
                placeholder={PH.email}
                value={values.email}
                error={Boolean(errors.email)}
                onValueChange={value => patch('email', value)}
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-affiliation" required>
                소속/학교명
              </FieldLabel>
              <PFTextInput
                id="talent-apply-affiliation"
                className={styles.control}
                size="xlarge"
                width="100%"
                placeholder={PH.affiliation}
                value={values.affiliation}
                error={Boolean(errors.affiliation)}
                onValueChange={value => patch('affiliation', value)}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel required>지역 주소</FieldLabel>
              <div className={styles.regionRow}>
                <PFSelect
                  size="xlarge"
                  width="100%"
                  placeholder={PH.sido}
                  aria-label="시/도"
                  options={sidoOptions}
                  value={values.sido}
                  error={Boolean(errors.sido)}
                  onValueChange={handleSidoChange}
                />
                <PFSelect
                  size="xlarge"
                  width="100%"
                  placeholder={PH.sigungu}
                  aria-label="시/군/구"
                  options={sigunguOptions}
                  value={values.sigungu}
                  disabled={!values.sido}
                  error={Boolean(errors.sigungu)}
                  onValueChange={value => patch('sigungu', value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <FieldLabel required>재능기부 가능 기간</FieldLabel>
              <PFFormPeriodPair className={styles.periodPair}>
                <PFDateInput
                  size="xlarge"
                  width="100%"
                  picker="date"
                  placeholder={PH.periodStart}
                  value={values.periodStart}
                  error={Boolean(errors.periodStart)}
                  onValueChange={value =>
                    patch('periodStart', value, ['periodStart', 'periodEnd'])
                  }
                  aria-label="재능기부 가능 시작일"
                />
                <PFFormPeriodTilde />
                <PFDateInput
                  size="xlarge"
                  width="100%"
                  picker="date"
                  placeholder={PH.periodEnd}
                  value={values.periodEnd}
                  error={Boolean(errors.periodEnd)}
                  onValueChange={value =>
                    patch('periodEnd', value, ['periodStart', 'periodEnd'])
                  }
                  aria-label="재능기부 가능 종료일"
                />
              </PFFormPeriodPair>
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="talent-apply-step-talent">
          <div className={styles.stepHeader}>
            <PFDivider variant="focus" />
            <PFText
              as="h2"
              id="talent-apply-step-talent"
              typo="form-section-title"
              color="black"
              className={styles.stepTitle}
            >
              {TALENT_APPLY_STEP_TITLES.talent}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-bio" required>
                간단한 약력 소개
              </FieldLabel>
              <textarea
                id="talent-apply-bio"
                className={[styles.textarea, errors.bio ? styles.textareaError : undefined]
                  .filter(Boolean)
                  .join(' ')}
                value={values.bio}
                onChange={event => patch('bio', event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-talent-intro" required>
                기부 가능한 재능 소개
              </FieldLabel>
              <textarea
                id="talent-apply-talent-intro"
                className={[
                  styles.textarea,
                  errors.talentIntro ? styles.textareaError : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                value={values.talentIntro}
                onChange={event => patch('talentIntro', event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="talent-apply-motivation" required>
                참여 동기
              </FieldLabel>
              <textarea
                id="talent-apply-motivation"
                className={[
                  styles.textarea,
                  errors.motivation ? styles.textareaError : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                value={values.motivation}
                onChange={event => patch('motivation', event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel required>JA 프로그램 참여 여부</FieldLabel>
              <JaParticipationRadioGroup
                value={values.jaParticipation}
                error={Boolean(errors.jaParticipation)}
                onChange={value => patch('jaParticipation', value)}
              />
              {errors.jaParticipation ? (
                <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fieldErrorText}>
                  JA 프로그램 참여 여부를 선택해 주세요
                </PFText>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="talent-apply-step-files">
          <div className={styles.stepHeader}>
            <PFDivider variant="focus" />
            <PFText
              as="h2"
              id="talent-apply-step-files"
              typo="form-section-title"
              color="black"
              className={styles.stepTitle}
            >
              {TALENT_APPLY_STEP_TITLES.files}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel>첨부파일</FieldLabel>
              <div className={styles.fileUpload}>
                <PFButton
                  type="button"
                  size="xlarge"
                  variant="secondary"
                  width="100%"
                  onClick={handlePickFile}
                >
                  파일찾기
                </PFButton>
                <div className={styles.fileGuideBox}>
                  <PFText
                    as="p"
                    typo="bd-md-rg"
                    color={attachedFileName ? 'black' : 'neutral-warm-500'}
                    className={styles.fileGuide}
                  >
                    {attachedFileName || TALENT_APPLY_FILE_GUIDE}
                  </PFText>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.visuallyHiddenFile}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="talent-apply-step-privacy">
          <div className={styles.stepHeader}>
            <PFDivider variant="focus" />
            <PFText
              as="h2"
              id="talent-apply-step-privacy"
              typo="form-section-title"
              color="black"
              className={styles.stepTitle}
            >
              {TALENT_APPLY_STEP_TITLES.privacy}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel required>{TALENT_APPLY_PRIVACY_CONSENT_LABEL}</FieldLabel>
              <div className={styles.privacyContent}>
                <div className={styles.privacyBox}>
                  <PFText
                    as="p"
                    typo="bd-sm-sb"
                    color="neutral-cool-700"
                    className={styles.privacyParagraph}
                  >
                    {TALENT_APPLY_PRIVACY_CONSENT_INTRO}
                  </PFText>
                  {TALENT_APPLY_PRIVACY_CONSENT_SECTIONS.map(section => (
                    <div key={section.heading}>
                      <PFText
                        as="p"
                        typo="bd-sm-sb"
                        color="black"
                        className={styles.privacyHeading}
                      >
                        {section.heading}
                      </PFText>
                      {section.paragraphs.map(paragraph => (
                        <PFText
                          key={paragraph}
                          as="p"
                          typo="caption-rg"
                          color="neutral-cool-700"
                          className={styles.privacyParagraph}
                        >
                          {paragraph}
                        </PFText>
                      ))}
                    </div>
                  ))}
                </div>
                <div
                  className={[
                    styles.agreementBar,
                    values.privacyAgreed ? styles.agreementBarChecked : undefined,
                    errors.privacy ? styles.agreementError : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <PFToggle
                    variant="check-large"
                    checked={values.privacyAgreed}
                    onChange={checked => {
                      setValues(prev => ({ ...prev, privacyAgreed: checked }))
                      setErrors(prev => {
                        const updated = { ...prev }
                        delete updated.privacy
                        return updated
                      })
                    }}
                  >
                    <PFText
                      typo="bd-lg-sb"
                      color={values.privacyAgreed ? 'primary-600' : 'neutral-cool-700'}
                    >
                      전체 동의하기
                    </PFText>
                  </PFToggle>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.submit}>
          <PFButton type="submit" size="xlarge" width="100%">
            {TALENT_APPLY_SUBMIT_LABEL}
          </PFButton>
        </div>
      </form>

      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        onConfirm={() => setAlert(null)}
      />
    </>
  )
}
