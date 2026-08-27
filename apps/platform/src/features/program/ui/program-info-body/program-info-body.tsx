import type { ReactNode } from 'react'
import type { ProgramDetail } from '../../model/types'
import { PFText } from '@/shared/ui'
import { ProgramInfoAside } from './program-info-aside'
import styles from './program-info-body.module.css'

type ProgramInfoBodyProps = {
  program: ProgramDetail
  /** 참여하기 상세 header 등 — article 상단에 슬롯 */
  header?: ReactNode
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  onCancel?: () => void
  showTopFab?: boolean
  className?: string
}

function resolveBasicInfoFields(program: ProgramDetail) {
  const fields =
    program.basicInfoFields.length > 0
      ? program.basicInfoFields
      : [
          { label: '사업 분야', value: program.businessFieldLabel },
          { label: '교육 형태', value: program.educationFormLabel },
          { label: '교육 대상', value: program.educationTargetGroupLabel },
          { label: '교육 대상 상세', value: program.educationTargetDetailLabel },
          { label: '교육 장소', value: program.educationVenueLabel },
        ]

  return fields.filter(field => field.value.trim().length > 0)
}

export function ProgramInfoBody({
  program,
  header,
  showApplyCta = false,
  showCancelCta = false,
  onApply,
  onCancel,
  showTopFab = true,
  className,
}: ProgramInfoBodyProps) {
  const basicInfoFields = resolveBasicInfoFields(program)
  const hasCurriculumBlock = program.sessions.length > 0 || program.eventSchedules.length > 0
  const hasBasicInfoSection = basicInfoFields.length > 0 || hasCurriculumBlock
  const applicationMethodValue = program.applicationMethodValue.trim()
  const hasDetailContent =
    program.recruitmentPhases.length > 0 ||
    program.educationSchedules.length > 0 ||
    program.extraSections.length > 0 ||
    Boolean(program.contactValue.trim())

  const rootClassName = [styles.body, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <article className={styles.detail}>
        {header}

        {program.summary.trim() ? (
          <div className={styles.summary}>
            <PFText as="p" typo="bd-lg-rg" color="black" className={styles.summaryText}>
              {program.summary}
            </PFText>
          </div>
        ) : null}

        {hasBasicInfoSection ? (
          <section className={styles.basicInfo}>
            <PFText as="h2" typo="hl-sm" color="black">
              기본정보
            </PFText>
            {basicInfoFields.length > 0 ? (
              <div className={styles.infoFields}>
                {basicInfoFields.map(field => (
                  <div key={field.label} className={styles.infoItem}>
                    <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                      {field.label}
                    </PFText>
                    <PFText as="span" typo="bd-md-md" color="black">
                      {field.value}
                    </PFText>
                  </div>
                ))}
              </div>
            ) : null}

            {program.sessions.length > 0 ? (
              <div className={styles.curriculumBlock}>
                <PFText as="h3" typo="bd-sm-rg" color="neutral-cool-600">
                  교육 커리큘럼
                </PFText>
                <ul className={styles.sessions}>
                  {program.sessions.map(session => (
                    <li key={`${session.sessionLabel}-${session.title}`} className={styles.session}>
                      <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                        <span className={styles.sessionLabel}>{session.sessionLabel}</span>{' '}
                        {session.title}
                      </PFText>
                      {session.dateLabel ? (
                        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                          {session.dateLabel}
                        </PFText>
                      ) : null}
                      {session.description.trim() ? (
                        <PFText as="p" typo="bd-md-rg" color="black">
                          {session.description}
                        </PFText>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {program.eventSchedules.length > 0 ? (
              <div className={styles.curriculumBlock}>
                <PFText as="h3" typo="bd-sm-rg" color="neutral-cool-600">
                  교육 커리큘럼
                </PFText>
                <ul className={styles.sessions} aria-label="행사·세부 일정">
                  {program.eventSchedules.map(event => (
                    <li
                      key={`${event.scheduleLabel}-${event.name}-${event.dateLabel}`}
                      className={styles.session}
                    >
                      <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                        <span className={styles.sessionLabel}>{event.scheduleLabel}</span>
                        {event.name ? ` ${event.name}` : ''}
                      </PFText>
                      {event.dateLabel && event.dateLabel !== '-' ? (
                        <PFText as="p" typo="bd-md-rg" color="black">
                          {event.dateLabel}
                        </PFText>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {hasDetailContent ? (
          <section className={styles.detailContent}>
            <PFText as="h2" typo="hl-sm" color="black">
              세부내용
            </PFText>

            <div className={styles.detailContentBody}>
              {program.recruitmentPhases.length > 0 ? (
                <div className={styles.recruitmentCard}>
                  <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                    {program.recruitmentPhaseGroupLabel}
                  </PFText>
                  <div className={styles.recruitmentList}>
                    {program.recruitmentPhases.map(phase => (
                      <div key={phase.label} className={styles.infoBlock}>
                        <PFText as="span" typo="bd-md-sb" color="black">
                          {phase.label}
                        </PFText>
                        <PFText as="span" typo="bd-md-md" color="black">
                          {phase.value}
                        </PFText>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {program.educationSchedules.length > 0 ? (
                <div className={styles.schedules}>
                  {program.educationSchedules.map(schedule => (
                    <div key={schedule.label} className={styles.scheduleCard}>
                      <PFText as="span" typo="bd-md-sb" color="black">
                        {schedule.label}
                      </PFText>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {schedule.value}
                      </PFText>
                    </div>
                  ))}
                </div>
              ) : null}

              {program.extraSections.length > 0 ? (
                <div className={styles.extraSections}>
                  {program.extraSections.map(section => (
                    <section key={section.title} className={styles.extraSection}>
                      <PFText as="h3" typo="bd-sm-rg" color="neutral-cool-600">
                        {section.title}
                      </PFText>
                      <PFText
                        as="p"
                        typo="bd-md-md"
                        color="black"
                        className={styles.extraSectionBody}
                      >
                        {section.body}
                      </PFText>
                    </section>
                  ))}
                </div>
              ) : null}

              {program.contactValue.trim() ? (
                <div className={styles.contact}>
                  <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                    문의처
                  </PFText>
                  <PFText as="span" typo="bd-md-md" color="black">
                    {program.contactValue}
                  </PFText>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {applicationMethodValue ? (
          <div className={styles.applicationMethod}>
            <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
              {program.applicationMethodLabel}
            </PFText>
            <PFText as="span" typo="bd-lg-sb" color="black">
              {applicationMethodValue}
            </PFText>
          </div>
        ) : null}
      </article>

      <ProgramInfoAside
        detailImageUrl={program.detailImageUrl}
        thumbnailUrl={program.thumbnailUrl}
        attachments={program.attachments}
        isRecruiting={program.isRecruiting}
        applicationPeriodLabel={program.applicationPeriodLabel}
        showApplyCta={showApplyCta}
        showCancelCta={showCancelCta}
        onApply={onApply}
        onCancel={onCancel}
        showTopFab={showTopFab}
      />
    </div>
  )
}
