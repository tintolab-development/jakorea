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
import pipeDividerStyles from '@/features/mypage/education/applications/ui/pipe-separated-inline-text.module.css'
import styles from './instructor-profile-section.module.css'
import viewStyles from '../view.module.css'

/** 설정 화면 전용 표기 — 도메인 공용 타이틀(`경력사항`)은 강사 신청 화면에서 그대로 사용 */
const SETTINGS_CAREER_SECTION_TITLE = '경력 사항'
/** 시안(조회 11134:9438) — `수상 및 수료 내역` */
const SETTINGS_AWARD_SECTION_TITLE = '수상 및 수료 내역'

/** 시안 — 건수 요약(`N개`), 비어 있으면 표시하지 않음 */
function formatSettingsCountTeaser(count: number): string | undefined {
  return count > 0 ? `${count}개` : undefined
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <PFButton
      size="small"
      variant="primary"
      className={`${viewStyles.editButton} ${styles.headerEdit}`}
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
  onEdit,
}: {
  title: string
  teaser?: string
  rows: InstructorSettingsListRow[]
  sectionId: InstructorSettingsSectionId
  onEdit: () => void
}) {
  return (
    <section className={styles.block}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          {teaser ? (
            <PFText as="p" typo="bd-lg-sb" color="primary-500" className={styles.teaser}>
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
            <li key={`${sectionId}-${row.period}-${row.primary}-${index}`} className={styles.listRow}>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.period}>
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
  onEdit,
}: {
  title: string
  body: string
  onEdit: () => void
}) {
  const display = displayOrDash(body)
  return (
    <section className={styles.block}>
      <div className={`${styles.header} ${styles.headerNoStroke}`}>
        <div className={styles.titleRow}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
        </div>
        <EditButton onClick={onEdit} />
      </div>
      <PFText as="div" typo="bd-sm-md" color="black" className={styles.essayBox}>
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
  const jaRows = mapInstructorJaListRows(values)
  const licenseRows = mapInstructorLicenseOrAwardListRows(values.licenseRows)
  const awardRows = mapInstructorLicenseOrAwardListRows(values.awardRows)

  return (
    <>
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.education}
        teaser={formatInstructorEducationHeaderTeaser(values.eduSchoolType)}
        rows={flattenInstructorEducationListRows(values)}
        sectionId="education"
        onEdit={() => onEditSection('education')}
      />
      <ListSection
        title={SETTINGS_CAREER_SECTION_TITLE}
        teaser={formatInstructorCareerHeaderTeaser(values.instructorCareer)}
        rows={mapInstructorCareerListRows(values)}
        sectionId="career"
        onEdit={() => onEditSection('career')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja}
        teaser={formatSettingsCountTeaser(jaRows.length)}
        rows={jaRows}
        sectionId="ja"
        onEdit={() => onEditSection('ja')}
      />
      <ListSection
        title={INSTRUCTOR_FORM_SECTION_BASE_TITLES.license}
        teaser={formatSettingsCountTeaser(licenseRows.length)}
        rows={licenseRows}
        sectionId="license"
        onEdit={() => onEditSection('license')}
      />
      <ListSection
        title={SETTINGS_AWARD_SECTION_TITLE}
        teaser={formatSettingsCountTeaser(awardRows.length)}
        rows={awardRows}
        sectionId="award"
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
