import { type ChangeEvent, useRef, useState } from 'react'
import axios from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  buildRequiredConsentDisagreeAlertMessage,
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
} from '@jakorea/domain/shared/required-consent-alert'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { Controller, useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import { AddressSearchModal } from '@/features/auth'
import {
  PFAlertModal,
  PFAttachedFileList,
  PFButton,
  PFSelect,
  PFText,
  PFTextInput,
  PFToggle,
} from '@/shared/ui'
import { validateUploadFileSize } from '@/shared/lib/file-upload-policy'
import { useCreatePublicCareerTalentApplication } from '../api/hooks'
import {
  CAREERS_TALENT_APPLY_PLACEHOLDERS as PH,
  CAREERS_TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE,
  CAREERS_TALENT_APPLY_STEP_TITLES,
  CAREERS_TALENT_APPLY_SUBMIT_ERROR_MESSAGE,
  CAREERS_TALENT_APPLY_SUBMIT_LABEL,
  CAREERS_TALENT_APPLY_SUBMIT_SUCCESS_MESSAGE,
  CAREERS_TALENT_CAREER_OPTIONS,
  CAREERS_TALENT_EDUCATION_LEVEL_OPTIONS,
  CAREERS_TALENT_JOB_OPTIONS,
  EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES,
  type CareersTalentCareerType,
  type CareersTalentJobInterest,
} from '../lib/talent-apply-form'
import {
  CAREERS_TALENT_PRIVACY_CONSENT_INTRO,
  CAREERS_TALENT_PRIVACY_CONSENT_LABEL,
  CAREERS_TALENT_PRIVACY_CONSENT_SECTIONS,
} from '../lib/talent-privacy-consent'
import {
  careersTalentApplyFormSchema,
  mapCareersTalentApplyFormErrors,
  type CareersTalentApplyFormInput,
} from '../lib/validate-talent-apply-form'
import styles from './talent-apply-form.module.css'

type AlertState = {
  title: string
  description?: string
} | null

function messageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      const message = data.message.trim()
      if (message) return message
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  return CAREERS_TALENT_APPLY_SUBMIT_ERROR_MESSAGE
}

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
      <PFText as="span" typo="label-md" color="neutral-warm-600" className={styles.fieldLabelText}>
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

function CareerTypeRadioGroup({
  value,
  onChange,
  error,
}: {
  value: CareersTalentCareerType | ''
  onChange: (next: CareersTalentCareerType) => void
  error?: boolean
}) {
  return (
    <div
      className={styles.radioGroup}
      role="radiogroup"
      aria-label="경력"
      aria-invalid={error || undefined}
    >
      {CAREERS_TALENT_CAREER_OPTIONS.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name="careers-talent-career-type"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-md"
            color={value === option.value ? 'primary-500' : 'neutral-cool-500'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

export function TalentApplyForm() {
  const [alert, setAlert] = useState<AlertState>(null)
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File }>>([])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mutation = useCreatePublicCareerTalentApplication()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CareersTalentApplyFormInput>({
    resolver: zodResolver(careersTalentApplyFormSchema) as Resolver<CareersTalentApplyFormInput>,
    defaultValues: EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const educationOptions = CAREERS_TALENT_EDUCATION_LEVEL_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
  }))

  const privacyAgreed = watch('privacyAgreed')
  const fieldErrors = mapCareersTalentApplyFormErrors(errors)

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) return
    for (const file of selected) {
      const sizeError = validateUploadFileSize(file)
      if (sizeError) {
        setAlert({ title: '안내', description: sizeError })
        return
      }
    }
    setAttachedFiles(prev => [
      ...prev,
      ...selected.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
      })),
    ])
  }

  const onValid = (values: CareersTalentApplyFormInput) => {
    const parsed = careersTalentApplyFormSchema.parse(values)
    mutation.mutate(
      { values: parsed, attachmentFiles: attachedFiles.map(item => item.file) },
      {
        onSuccess: () => {
          reset(EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES)
          setAttachedFiles([])
          setSuccessOpen(true)
        },
        onError: error =>
          setAlert({
            title: '안내',
            description: messageFromError(error),
          }),
      },
    )
  }

  const onInvalid = (formErrors: FieldErrors<CareersTalentApplyFormInput>) => {
    const mapped = mapCareersTalentApplyFormErrors(formErrors)
    const keys = Object.keys(mapped)
    if (keys.length === 1 && mapped.privacy) {
      setAlert({
        title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
        description: buildRequiredConsentDisagreeAlertMessage([
          CAREERS_TALENT_PRIVACY_CONSENT_LABEL,
        ]),
      })
      return
    }

    setAlert({
      title: '안내',
      description: CAREERS_TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE,
    })
  }

  const jobRows = [
    CAREERS_TALENT_JOB_OPTIONS.slice(0, 2),
    CAREERS_TALENT_JOB_OPTIONS.slice(2, 4),
    CAREERS_TALENT_JOB_OPTIONS.slice(4, 6),
  ]

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        <section className={styles.step} aria-labelledby="careers-talent-step-job">
          <div className={styles.stepHeader}>
            <PFText
              as="h2"
              id="careers-talent-step-job"
              typo="hl-sm"
              color="black"
              className={styles.stepTitle}
            >
              {CAREERS_TALENT_APPLY_STEP_TITLES.job}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel required>관심 직무/분야</FieldLabel>
              <Controller
                name="jobInterest"
                control={control}
                render={({ field }) => (
                  <div
                    className={styles.jobGrid}
                    role="group"
                    aria-label="관심 직무/분야"
                    aria-invalid={fieldErrors.jobInterest || undefined}
                  >
                    {jobRows.map(row => (
                      <div
                        key={row.map(option => option.value).join('-')}
                        className={styles.jobRow}
                      >
                        {row.map(option => {
                          const selected = field.value === option.value
                          return (
                            <div key={option.value} className={styles.jobOption}>
                              <PFButton
                                type="button"
                                size="xlarge"
                                variant="tertiary"
                                selected={selected}
                                className={styles.jobOptionButton}
                                aria-pressed={selected}
                                onClick={() => {
                                  field.onChange(option.value as CareersTalentJobInterest)
                                  clearErrors('jobInterest')
                                }}
                              >
                                {option.label}
                              </PFButton>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              />
              {fieldErrors.jobInterest ? (
                <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fieldErrorText}>
                  관심 직무를 선택해 주세요
                </PFText>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="careers-talent-step-basic">
          <div className={styles.stepHeader}>
            <PFText
              as="h2"
              id="careers-talent-step-basic"
              typo="hl-sm"
              color="black"
              className={styles.stepTitle}
            >
              {CAREERS_TALENT_APPLY_STEP_TITLES.basic}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel htmlFor="careers-talent-name" required>
                이름
              </FieldLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <PFTextInput
                    id="careers-talent-name"
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    placeholder={PH.name}
                    value={field.value}
                    error={Boolean(fieldErrors.name)}
                    onValueChange={value => {
                      field.onChange(value)
                      clearErrors('name')
                    }}
                    autoComplete="name"
                  />
                )}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="careers-talent-phone" required>
                휴대폰 번호
              </FieldLabel>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PFTextInput
                    id="careers-talent-phone"
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={PH.phone}
                    value={field.value}
                    error={Boolean(fieldErrors.phone)}
                    onValueChange={value => {
                      field.onChange(formatKoreanPhoneNumber(value))
                      clearErrors('phone')
                    }}
                  />
                )}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="careers-talent-email" required>
                이메일
              </FieldLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <PFTextInput
                    id="careers-talent-email"
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    type="email"
                    autoComplete="email"
                    placeholder={PH.email}
                    value={field.value}
                    error={Boolean(fieldErrors.email)}
                    onValueChange={value => {
                      field.onChange(value)
                      clearErrors('email')
                    }}
                  />
                )}
              />
            </div>

            <div className={styles.addressBlock}>
              <div className={styles.addressSearchRow}>
                <div className={[styles.field, styles.addressSearchField].join(' ')}>
                  <FieldLabel htmlFor="careers-talent-address-road" required>
                    자택 주소
                  </FieldLabel>
                  <Controller
                    name="addressRoad"
                    control={control}
                    render={({ field }) => (
                      <PFTextInput
                        id="careers-talent-address-road"
                        className={styles.control}
                        size="xlarge"
                        width="100%"
                        readOnly
                        placeholder={PH.addressRoad}
                        value={field.value}
                        error={Boolean(fieldErrors.addressRoad)}
                        onClick={() => setIsAddressModalOpen(true)}
                      />
                    )}
                  />
                </div>
                <div className={styles.addressSearchButton}>
                  <PFButton
                    type="button"
                    size="xlarge"
                    variant="secondary"
                    width="100%"
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    주소 검색
                  </PFButton>
                </div>
              </div>

              <div className={styles.field}>
                <Controller
                  name="addressDetail"
                  control={control}
                  render={({ field }) => (
                    <PFTextInput
                      id="careers-talent-address-detail"
                      className={styles.control}
                      size="xlarge"
                      width="100%"
                      placeholder={PH.addressDetail}
                      value={field.value}
                      error={Boolean(fieldErrors.addressDetail)}
                      onValueChange={value => {
                        field.onChange(value)
                        clearErrors('addressDetail')
                      }}
                      aria-label="상세주소"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="careers-talent-step-education">
          <div className={styles.stepHeader}>
            <PFText
              as="h2"
              id="careers-talent-step-education"
              typo="hl-sm"
              color="black"
              className={styles.stepTitle}
            >
              {CAREERS_TALENT_APPLY_STEP_TITLES.education}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel required>최종학력</FieldLabel>
              <Controller
                name="educationLevel"
                control={control}
                render={({ field }) => (
                  <PFSelect
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    placeholder={PH.educationLevel}
                    options={educationOptions}
                    value={field.value || undefined}
                    error={Boolean(fieldErrors.educationLevel)}
                    onValueChange={value => {
                      field.onChange(value)
                      clearErrors('educationLevel')
                    }}
                  />
                )}
              />
            </div>

            <div className={styles.field}>
              <Controller
                name="schoolName"
                control={control}
                render={({ field }) => (
                  <PFTextInput
                    id="careers-talent-school"
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    placeholder={PH.schoolName}
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-label="학교명"
                  />
                )}
              />
            </div>

            <div className={styles.field}>
              <Controller
                name="major"
                control={control}
                render={({ field }) => (
                  <PFTextInput
                    id="careers-talent-major"
                    className={styles.control}
                    size="xlarge"
                    width="100%"
                    placeholder={PH.major}
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-label="학부/과"
                  />
                )}
              />
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="careers-talent-education-info" required>
                학력정보
              </FieldLabel>
              <Controller
                name="educationInfo"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="careers-talent-education-info"
                    className={[
                      styles.textarea,
                      fieldErrors.educationInfo ? styles.textareaError : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={field.value}
                    onChange={event => {
                      field.onChange(event.target.value)
                      clearErrors('educationInfo')
                    }}
                  />
                )}
              />
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="careers-talent-step-career">
          <div className={styles.stepHeader}>
            <PFText
              as="h2"
              id="careers-talent-step-career"
              typo="hl-sm"
              color="black"
              className={styles.stepTitle}
            >
              {CAREERS_TALENT_APPLY_STEP_TITLES.career}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel required>경력</FieldLabel>
              <Controller
                name="careerType"
                control={control}
                render={({ field }) => (
                  <CareerTypeRadioGroup
                    value={field.value}
                    error={Boolean(fieldErrors.careerType)}
                    onChange={value => {
                      field.onChange(value)
                      clearErrors('careerType')
                    }}
                  />
                )}
              />
              {fieldErrors.careerType ? (
                <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fieldErrorText}>
                  경력을 선택해 주세요
                </PFText>
              ) : null}
            </div>

            <div className={styles.field}>
              <FieldLabel>증빙서류</FieldLabel>
              <div className={styles.fileUpload}>
                <PFButton
                  type="button"
                  size="xlarge"
                  variant="secondary"
                  width="100%"
                  className={styles.filePickButton}
                  onClick={handlePickFile}
                >
                  파일찾기
                </PFButton>
                {attachedFiles.length === 0 ? (
                  <div className={styles.fileGuideBox}>
                    <PFText
                      as="p"
                      typo="bd-md-rg"
                      color="neutral-warm-500"
                      className={styles.fileGuide}
                    >
                      {PH.evidenceFile}
                    </PFText>
                  </div>
                ) : (
                  <PFAttachedFileList
                    files={attachedFiles.map(item => ({ id: item.id, name: item.file.name }))}
                    onRemove={id => setAttachedFiles(prev => prev.filter(item => item.id !== id))}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className={styles.visuallyHiddenFile}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <FieldLabel htmlFor="careers-talent-career-info" required>
                경력/경험/자격정보
              </FieldLabel>
              <Controller
                name="careerInfo"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="careers-talent-career-info"
                    className={[
                      styles.textarea,
                      fieldErrors.careerInfo ? styles.textareaError : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={field.value}
                    onChange={event => {
                      field.onChange(event.target.value)
                      clearErrors('careerInfo')
                    }}
                  />
                )}
              />
            </div>
          </div>
        </section>

        <section className={styles.step} aria-labelledby="careers-talent-step-privacy">
          <div className={styles.stepHeader}>
            <PFText
              as="h2"
              id="careers-talent-step-privacy"
              typo="hl-sm"
              color="black"
              className={styles.stepTitle}
            >
              {CAREERS_TALENT_APPLY_STEP_TITLES.privacy}
            </PFText>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <FieldLabel required>{CAREERS_TALENT_PRIVACY_CONSENT_LABEL}</FieldLabel>
              <div className={styles.privacyContent}>
                <div className={styles.privacyBox}>
                  <PFText
                    as="p"
                    typo="bd-sm-sb"
                    color="neutral-cool-700"
                    className={styles.privacyParagraph}
                  >
                    {CAREERS_TALENT_PRIVACY_CONSENT_INTRO}
                  </PFText>
                  {CAREERS_TALENT_PRIVACY_CONSENT_SECTIONS.map(section => (
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
                    privacyAgreed ? styles.agreementBarChecked : undefined,
                    fieldErrors.privacy ? styles.agreementError : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Controller
                    name="privacyAgreed"
                    control={control}
                    render={({ field }) => (
                      <PFToggle
                        variant="check-large"
                        checked={field.value}
                        onChange={checked => {
                          field.onChange(checked)
                          clearErrors('privacyAgreed')
                        }}
                      >
                        <PFText
                          typo="bd-lg-sb"
                          color={field.value ? 'primary-600' : 'neutral-cool-700'}
                        >
                          동의함
                        </PFText>
                      </PFToggle>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.submit}>
            <PFButton
              type="submit"
              size="xlarge"
              width="100%"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? '접수 중' : CAREERS_TALENT_APPLY_SUBMIT_LABEL}
            </PFButton>
          </div>
        </section>
      </form>

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selection => {
          setValue('addressRoad', selection.address, { shouldDirty: true, shouldValidate: true })
          clearErrors('addressRoad')
          setIsAddressModalOpen(false)
        }}
      />

      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        onConfirm={() => setAlert(null)}
      />

      <PFAlertModal
        open={successOpen}
        title="등록 완료"
        description={CAREERS_TALENT_APPLY_SUBMIT_SUCCESS_MESSAGE}
        onConfirm={() => setSuccessOpen(false)}
      />
    </>
  )
}
