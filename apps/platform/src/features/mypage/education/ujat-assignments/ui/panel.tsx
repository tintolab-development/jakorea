import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import { DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE } from '@/features/program/lib/application-api-error'
import { PFButton, PFText } from '@/shared/ui'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  useDownloadUjatClassAssignmentConsentDocuments,
  useUjatClassAssignmentsQuery,
} from '../api/use-class-assignments-query'
import type { UjatClassAssignmentScheduleSection } from '../model/types'
import infoCircleUrl from '../assets/icon/info-circle.svg'
import styles from './panel.module.css'

const NOTICE_COPY = '교육 일정이나 신청 학년 변경을 희망하실 경우, 담당자에게 별도 문의 부탁드립니다.'
const DOWNLOAD_LABEL = '성범죄경력 조회 동의서 일괄 다운로드'
const EMPTY_MESSAGE = '배정된 학급이 없습니다.'

type UjatVolunteerAssignmentPanelProps = {
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

function AssignmentScheduleSection({
  section,
  onDownload,
  downloading,
}: {
  section: UjatClassAssignmentScheduleSection
  onDownload: (path: string) => void
  downloading: boolean
}) {
  const canDownload = section.consentDocumentsDownloadPath.length > 0

  return (
    <section className={styles.section} aria-labelledby={`ujat-assignment-${section.id}`}>
      <div className={styles.toolbar}>
        <div className={styles.meta}>
          <PFText
            as="h3"
            id={`ujat-assignment-${section.id}`}
            typo="hl-sm"
            color="black"
            className={styles.date}
          >
            {section.dateLabel || '-'}
          </PFText>
          <div className={styles.metaGroup}>
            <span className={styles.manager}>
              <PFText as="span" typo="bd-md-rg" color="black" className={styles.managerLabel}>
                출결 담당자
              </PFText>
              <PFText as="span" typo="bd-md-sb" color="black" className={styles.managerName}>
                {section.attendanceManagerName}
              </PFText>
            </span>
            <PFText as="span" typo="bd-md-rg" color="neutral-cool-500" className={styles.classCount}>
              총 {section.totalClassCount}학급
            </PFText>
          </div>
        </div>
        {canDownload ? (
          <PFButton
            size="medium"
            variant="tertiary"
            disabled={downloading}
            onClick={() => onDownload(section.consentDocumentsDownloadPath)}
          >
            {DOWNLOAD_LABEL}
          </PFButton>
        ) : null}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label={`${section.dateLabel} 봉사자 배정 현황`}>
          <thead>
            <tr>
              <th className={styles.gradeCol} scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  교육 학년
                </PFText>
              </th>
              <th className={styles.classCol} scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  교육 학급
                </PFText>
              </th>
              <th scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  봉사자 A
                </PFText>
              </th>
              <th scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  봉사자 B
                </PFText>
              </th>
              <th scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  사용 교재명
                </PFText>
              </th>
              <th scope="col">
                <PFText as="span" typo="bd-md-bd" color="black">
                  교재 준비수량
                </PFText>
              </th>
            </tr>
          </thead>
          <tbody>
            {section.rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                    {EMPTY_MESSAGE}
                  </PFText>
                </td>
              </tr>
            ) : (
              section.rows.map(row => (
                <tr key={row.id}>
                  {row.gradeRowSpan > 0 ? (
                    <td rowSpan={row.gradeRowSpan} className={styles.gradeCell}>
                      <PFText as="span" typo="bd-md-bd" color="black" className={styles.cellText}>
                        {row.gradeLabel}
                      </PFText>
                    </td>
                  ) : null}
                  <td>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.cellText}>
                      {row.classLabel}
                    </PFText>
                  </td>
                  <td>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.cellText}>
                      {row.volunteerA}
                    </PFText>
                  </td>
                  <td>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.cellText}>
                      {row.volunteerB}
                    </PFText>
                  </td>
                  <td>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.cellText}>
                      {row.textbookName}
                    </PFText>
                  </td>
                  <td>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.cellText}>
                      {row.textbookQuantityLabel}
                    </PFText>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function UjatVolunteerAssignmentPanel({
  applicationType,
  applicationId,
}: UjatVolunteerAssignmentPanelProps) {
  const query = useUjatClassAssignmentsQuery(applicationType, applicationId)
  const downloadMutation = useDownloadUjatClassAssignmentConsentDocuments()

  if (query.isLoading) {
    return <VolunteerAssignmentPanelSkeleton statusMessage="봉사자 배정 현황을 불러오는 중입니다." />
  }

  return (
    <div className={styles.root}>
      <div className={styles.notice} role="note">
        <img className={styles.noticeIcon} src={infoCircleUrl} alt="" width={24} height={24} />
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.noticeText}>
          {NOTICE_COPY}
        </PFText>
      </div>

      {query.isError ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.status}>
          {DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE}
        </PFText>
      ) : query.sections.length === 0 ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
          {EMPTY_MESSAGE}
        </PFText>
      ) : (
        <div className={styles.sections}>
          {query.sections.map(section => (
            <AssignmentScheduleSection
              key={section.id}
              section={section}
              downloading={downloadMutation.isPending}
              onDownload={path => {
                downloadMutation.reset()
                downloadMutation.mutate(path)
              }}
            />
          ))}
        </div>
      )}

      {downloadMutation.isError ? (
        <PFText as="p" typo="bd-md-rg" color="error" className={styles.status}>
          동의서 다운로드에 실패했습니다.
        </PFText>
      ) : null}
    </div>
  )
}
