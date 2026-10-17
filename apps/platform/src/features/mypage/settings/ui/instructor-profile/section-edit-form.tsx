import { useCallback, useState } from 'react'
import { INSTRUCTOR_FORM_SECTION_DESCRIPTIONS } from '@jakorea/domain/instructor/form-copy'
import { INSTRUCTOR_FORM_SECTION_BASE_TITLES } from '@jakorea/domain/instructor/form-layout'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import type { InstructorFreeWriteFieldName } from '@jakorea/domain/instructor/free-write'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { mapInstructorFormValuesToPortalEditableProfile } from '@/features/mypage/instructor-apply/api/map-create-request'
import {
  InstructorAwardProfileFields,
  InstructorCareerProfileFields,
  InstructorEducationProfileFields,
  InstructorFreeWriteProfileFields,
  InstructorJaProfileFields,
  InstructorLicenseProfileFields,
} from '@/features/mypage/instructor-apply/instructor-profile-fields'
import {
  getLoginApiErrorMessage,
  usePortalProfileUpdateMutation,
  type PortalProfileResponse,
} from '@/features/auth/sign-in'
import { buildInstructorSettingsFormValues } from '../../lib/map-instructor-settings-form'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFAlertModal, PFButton, PFFormSection, PFText } from '@/shared/ui'
import type { InstructorSettingsSectionId } from '../../lib/format-instructor-settings-display'
import { INSTRUCTOR_SETTINGS_ESSAY_SECTIONS } from '../../lib/format-instructor-settings-display'
import inlineFieldStyles from '@/features/mypage/instructor-apply/instructor-profile-fields/settings-inline-fields.module.css'
import styles from '../edit-form.module.css'

const REQUIRED_INCOMPLETE = '필수 항목을 모두 작성해주세요'

function resolveSectionTitle(section: InstructorSettingsSectionId): string {
  const essay = INSTRUCTOR_SETTINGS_ESSAY_SECTIONS.find(item => item.id === section)
  if (essay) return `${essay.title} 수정`
  switch (section) {
    case 'education':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.education} 수정`
    case 'career':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.career} 수정`
    case 'ja':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja} 수정`
    case 'license':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.license} 수정`
    case 'award':
      return '수상 및 수료 내역 수정'
    default:
      return '프로필 수정'
  }
}

function validateSection(
  section: InstructorSettingsSectionId,
  values: InstructorSharedProfileFormValues,
): string | null {
  const base = collectInstructorRegisterValidation(values, {}, {})
  if (section === 'education') {
    const result = collectInstructorRegisterValidation(values, {}, { requireEducation: true })
    if (result.missingRequired) return REQUIRED_INCOMPLETE
    if (result.formatMessages[0]) return result.formatMessages[0]
    return null
  }
  if (section === 'career') {
    const result = collectInstructorRegisterValidation(values, {}, { requireCareer: true })
    if (result.missingRequired) return REQUIRED_INCOMPLETE
    if (result.formatMessages[0]) return result.formatMessages[0]
    return null
  }
  if (
    section === 'freeWrite1' ||
    section === 'freeWrite2' ||
    section === 'freeWrite3' ||
    section === 'freeWrite4'
  ) {
    const trimmed = values[section as InstructorFreeWriteFieldName]?.trim()
    if (!trimmed) return REQUIRED_INCOMPLETE
    return null
  }
  if (base.formatMessages[0]) return base.formatMessages[0]
  return null
}

export type SettingsInstructorSectionEditFormProps = {
  section: InstructorSettingsSectionId
  fullValues: InstructorSharedProfileFormValues
  onCancel: () => void
  onSaved: (nextFull: InstructorSharedProfileFormValues) => void
  /** 회원정보 설정 목록 화면 내 해당 섹션만 교체 */
  embedded?: boolean
}

export function SettingsInstructorSectionEditForm({
  section,
  fullValues,
  onCancel,
  onSaved,
  embedded = false,
}: SettingsInstructorSectionEditFormProps) {
  const [values, setValues] = useState(fullValues)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = usePortalProfileUpdateMutation()

  const handleSave = useCallback(async () => {
    setFormError(null)
    const validationError = validateSection(section, values)
    if (validationError) {
      setAlertMessage(validationError)
      return
    }

    if (!isRemoteApiConfigured()) {
      onSaved(values)
      return
    }

    try {
      const profile = mapInstructorFormValuesToPortalEditableProfile(values)
      const updated = await mutation.mutateAsync({ instructorProfile: { profile } })
      onSaved(buildInstructorSettingsFormValues(updated as PortalProfileResponse))
    } catch (error) {
      setFormError(
        getLoginApiErrorMessage(error, '저장에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      )
    }
  }, [mutation, onSaved, section, values])

  const sectionTitle = resolveSectionTitle(section)
  const fieldSurface = embedded ? 'settings' : 'apply'
  const embeddedSectionClass = embedded ? inlineFieldStyles.embeddedSection : undefined

  const fields = (() => {
    switch (section) {
      case 'education':
        return (
          <PFFormSection
            id="settings-instructor-education"
            className={embeddedSectionClass}
            title={embedded ? undefined : INSTRUCTOR_FORM_SECTION_BASE_TITLES.education}
            description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.education}
            required={!embedded}
          >
            <InstructorEducationProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
            />
          </PFFormSection>
        )
      case 'career':
        return (
          <PFFormSection
            id="settings-instructor-career"
            className={embeddedSectionClass}
            title={embedded ? undefined : INSTRUCTOR_FORM_SECTION_BASE_TITLES.career}
            required={!embedded}
          >
            <InstructorCareerProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
            />
          </PFFormSection>
        )
      case 'ja':
        return (
          <PFFormSection
            id="settings-instructor-ja"
            className={embeddedSectionClass}
            title={embedded ? undefined : INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja}
          >
            <InstructorJaProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
            />
          </PFFormSection>
        )
      case 'license':
        return (
          <PFFormSection
            id="settings-instructor-license"
            className={embeddedSectionClass}
            title={embedded ? undefined : INSTRUCTOR_FORM_SECTION_BASE_TITLES.license}
          >
            <InstructorLicenseProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
            />
          </PFFormSection>
        )
      case 'award':
        return (
          <PFFormSection
            id="settings-instructor-award"
            className={embeddedSectionClass}
            title={embedded ? undefined : '수상 및 수료 내역'}
          >
            <InstructorAwardProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
            />
          </PFFormSection>
        )
      default:
        return (
          <PFFormSection
            id={`settings-instructor-${section}`}
            className={embeddedSectionClass}
            title={embedded ? undefined : sectionTitle.replace(' 수정', '')}
          >
            <InstructorFreeWriteProfileFields
              surface={fieldSurface}
              values={values}
              onValuesChange={setValues}
              onlyField={section as InstructorFreeWriteFieldName}
            />
          </PFFormSection>
        )
    }
  })()

  return (
    <div className={embedded ? styles.inlineEdit : styles.page}>
      {embedded ? null : (
        <PFText as="p" typo="bd-md-rg" color="black">
          {sectionTitle}
        </PFText>
      )}
      {fields}
      {formError ? (
        <PFText as="p" typo="bd-sm-rg" color="error" role="alert">
          {formError}
        </PFText>
      ) : null}
      <div className={styles.actions}>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={onCancel} disabled={mutation.isPending}>
          취소
        </PFButton>
        <PFButton
          size="xlarge"
          width="100%"
          disabled={mutation.isPending}
          onClick={() => {
            void handleSave()
          }}
        >
          {mutation.isPending ? '저장 중…' : '저장하기'}
        </PFButton>
      </div>
      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => setAlertMessage(null)}
      />
    </div>
  )
}
