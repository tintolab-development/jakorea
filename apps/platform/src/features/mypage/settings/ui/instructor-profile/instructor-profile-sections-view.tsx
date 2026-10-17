import type { ReactNode } from 'react'
import { INSTRUCTOR_FORM_SECTION_BASE_TITLES } from '@jakorea/domain/instructor/form-layout'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { displayOrDash } from '@/features/mypage/instructor-apply/lib/format-instructor-apply-display'
import { PFButton, PFText } from '@/shared/ui'
import {
  flattenInstructorEducationListRows,
  formatInstructorCareerHeaderTeaser,
  formatInstructorEducationHeaderTeaser,
  INSTRUCTOR_SETTINGS_ESSAY_SECTIONS,
  mapInstructorCareerListRows,
  mapInstructorJaListRows,
  mapInstructorLicenseOrAwardListRows,
  type InstructorSettingsListRow,
  type InstructorSettingsSectionId,
} from '../../lib/format-instructor-settings-display'
import { SettingsInstructorSectionEditForm } from './section-edit-form'
import pipeDividerStyles from '@/features/mypage/education/applications/ui/pipe-separated-inline-text.module.css'
import styles from './instructor-profile-section.module.css'
import viewStyles from '../view.module.css'

function EditButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <PFButton
      size="small"
      variant="primary"
      className={`${viewStyles.editButton} ${styles.headerEdit}`}
      disabled={disabled}
      onClick={onClick}
    >
      수정하기
    </PFButton>
  )
}

function ListSection({
  title,
  teaser,
  rows,
  sectionId,
  isEditing,
  editDisabled,
  onEdit,
  editForm,
}: {
  title: string
  teaser?: string
  rows: InstructorSettingsListRow[]
  sectionId: InstructorSettingsSectionId
  isEditing: boolean
  editDisabled: boolean
  onEdit: () => void
  editForm: ReactNode
}) {
  return (
    <section className={styles.block}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.title}>
            {title}
          </PFText>
          {teaser ? (
            <PFText as="p" typo="bd-md-sb" color="primary-500" className={styles.teaser}>
              {teaser}
            </PFText>
          ) : null}
        </div>
        {isEditing ? null : <EditButton onClick={onEdit} disabled={editDisabled} />}
      </div>
      {isEditing ? (
        editForm
      ) : rows.length === 0 ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.emptyLine}>
          –
        </PFText>
      ) : (
        <ul className={styles.list}>
          {rows.map((row, index) => (
            <li key={`${sectionId}-${row.period}-${row.primary}-${index}`} className={styles.listRow}>
              <PFText as="p" typo="bd-md-md" color="neutral-cool-500" className={styles.period}>
                {row.period || '–'}
              </PFText>
              <div className={styles.contentLine}>
                <PFText as="p" typo="bd-md-sb" color="black" className={styles.content}>
                  {row.primary}
                </PFText>
                {row.secondary ? (
                  <>
                    <span className={pipeDividerStyles.divider} aria-hidden="true" />
                    <PFText as="p" typo="bd-md-rg" color="black" className={styles.content}>
                      {row.secondary}
                    </PFText>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EssaySection({
  title,
  body,
  isEditing,
  editDisabled,
  onEdit,
  editForm,
}: {
  title: string
  body: string
  isEditing: boolean
  editDisabled: boolean
  onEdit: () => void
  editForm: ReactNode
}) {
  const display = displayOrDash(body)
  return (
    <section className={styles.block}>
      <div className={`${styles.header} ${styles.headerNoStroke}`}>
        <div className={styles.titleRow}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.title}>
            {title}
          </PFText>
        </div>
        {isEditing ? null : <EditButton onClick={onEdit} disabled={editDisabled} />}
      </div>
      {isEditing ? (
        editForm
      ) : (
        <PFText as="div" typo="bd-md-rg" color="black" className={styles.essayBox}>
          {display}
        </PFText>
      )}
    </section>
  )
}

export type SettingsInstructorProfileSectionsViewProps = {
  values: InstructorSharedProfileFormValues
  onEditSection: (section: InstructorSettingsSectionId) => void
  editingSection?: InstructorSettingsSectionId | null
  editLocked?: boolean
  onCancelSectionEdit?: () => void
  onSectionSaved?: (next: InstructorSharedProfileFormValues) => void
}

export function SettingsInstructorProfileSectionsView({
  values,
  onEditSection,
  editingSection = null,
  editLocked = false,
  onCancelSectionEdit,
  onSectionSaved,
}: SettingsInstructorProfileSectionsViewProps) {
  const renderEditForm = (section: InstructorSettingsSectionId) => {
    if (!onCancelSectionEdit || !onSectionSaved) return null
    return (
      <SettingsInstructorSectionEditForm
        key={section}
        embedded
        section={section}
        fullValues={values}
        onCancel={onCancelSectionEdit}
        onSaved={onSectionSaved}
      />
    )
  }

  const isSectionEditDisabled = (section: InstructorSettingsSectionId) =>
    editLocked && editingSection !== section

  return (
    <>
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.education}
        teaser={formatInstructorEducationHeaderTeaser(values.eduSchoolType)}
        rows={flattenInstructorEducationListRows(values)}
        sectionId="education"
        isEditing={editingSection === 'education'}
        editDisabled={isSectionEditDisabled('education')}
        onEdit={() => onEditSection('education')}
        editForm={renderEditForm('education')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.career}
        teaser={formatInstructorCareerHeaderTeaser(values.instructorCareer)}
        rows={mapInstructorCareerListRows(values)}
        sectionId="career"
        isEditing={editingSection === 'career'}
        editDisabled={isSectionEditDisabled('career')}
        onEdit={() => onEditSection('career')}
        editForm={renderEditForm('career')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja}
        rows={mapInstructorJaListRows(values)}
        sectionId="ja"
        isEditing={editingSection === 'ja'}
        editDisabled={isSectionEditDisabled('ja')}
        onEdit={() => onEditSection('ja')}
        editForm={renderEditForm('ja')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.license}
        rows={mapInstructorLicenseOrAwardListRows(values.licenseRows)}
        sectionId="license"
        isEditing={editingSection === 'license'}
        editDisabled={isSectionEditDisabled('license')}
        onEdit={() => onEditSection('license')}
        editForm={renderEditForm('license')}
      />
      <ListSection
        title="수상 및 수료 내역"
        rows={mapInstructorLicenseOrAwardListRows(values.awardRows)}
        sectionId="award"
        isEditing={editingSection === 'award'}
        editDisabled={isSectionEditDisabled('award')}
        onEdit={() => onEditSection('award')}
        editForm={renderEditForm('award')}
      />
      {INSTRUCTOR_SETTINGS_ESSAY_SECTIONS.map(section => (
        <EssaySection
          key={section.id}
          title={section.title}
          body={values[section.id]}
          isEditing={editingSection === section.id}
          editDisabled={isSectionEditDisabled(section.id)}
          onEdit={() => onEditSection(section.id)}
          editForm={renderEditForm(section.id)}
        />
      ))}
    </>
  )
}
