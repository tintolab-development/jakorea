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
import styles from './instructor-profile-section.module.css'
import viewStyles from '../view.module.css'

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <PFButton
      size="small"
      variant="primary"
      className={viewStyles.editButton}
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
  onEdit,
}: {
  title: string
  teaser?: string
  rows: InstructorSettingsListRow[]
  onEdit: () => void
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
        <EditButton onClick={onEdit} />
      </div>
      {rows.length === 0 ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.emptyLine}>
          –
        </PFText>
      ) : (
        <ul className={styles.list}>
          {rows.map((row, index) => (
            <li key={`${row.period}-${row.primary}-${index}`} className={styles.listRow}>
              <PFText as="p" typo="bd-md-rg" className={styles.period}>
                {row.period || '–'}
              </PFText>
              <div className={styles.contentLine}>
                <PFText as="p" typo="bd-md-sb" color="black" className={styles.content}>
                  {row.primary}
                </PFText>
                {row.secondary ? (
                  <>
                    <PFText as="span" typo="bd-md-rg" color="neutral-cool-500">|</PFText>
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
  onEdit,
}: {
  title: string
  body: string
  onEdit: () => void
}) {
  const display = displayOrDash(body)
  return (
    <section className={styles.block}>
      <div className={styles.header}>
        <PFText as="h2" typo="form-section-title" color="black" className={styles.title}>
          {title}
        </PFText>
        <EditButton onClick={onEdit} />
      </div>
      <PFText as="div" typo="bd-md-rg" color="black" className={styles.essayBox}>
        {display}
      </PFText>
    </section>
  )
}

export type SettingsInstructorProfileSectionsViewProps = {
  values: InstructorSharedProfileFormValues
  onEditSection: (section: InstructorSettingsSectionId) => void
}

export function SettingsInstructorProfileSectionsView({
  values,
  onEditSection,
}: SettingsInstructorProfileSectionsViewProps) {
  return (
    <>
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.education}
        teaser={formatInstructorEducationHeaderTeaser(values.eduSchoolType)}
        rows={flattenInstructorEducationListRows(values)}
        onEdit={() => onEditSection('education')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.career}
        teaser={formatInstructorCareerHeaderTeaser(values.instructorCareer)}
        rows={mapInstructorCareerListRows(values)}
        onEdit={() => onEditSection('career')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja}
        rows={mapInstructorJaListRows(values)}
        onEdit={() => onEditSection('ja')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.license}
        rows={mapInstructorLicenseOrAwardListRows(values.licenseRows)}
        onEdit={() => onEditSection('license')}
      />
      <ListSection
        title="수상 및 수료 내역"
        rows={mapInstructorLicenseOrAwardListRows(values.awardRows)}
        onEdit={() => onEditSection('award')}
      />
      {INSTRUCTOR_SETTINGS_ESSAY_SECTIONS.map(section => (
        <EssaySection
          key={section.id}
          title={section.title}
          body={values[section.id]}
          onEdit={() => onEditSection(section.id)}
        />
      ))}
    </>
  )
}
