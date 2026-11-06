/**
 * 교육받은 교사 — 참여 기관 상세 신청 정보 (안내사항·합반 비노출, TT 일정 표시)
 */

import type { ReactNode } from 'react'
import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import {
  InstitutionApplicationTableRowFullWidth,
  InstitutionApplicationTableRowSingleCol,
  InstitutionApplicationTableRowTwoCols,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  buildTrainedTeacherEducationProgressRows,
  formatTrainedTeacherEducationProgressDateTime,
  resolveTrainedTeacherEducationProgressBadge,
} from '@/features/program/trained-teachers/lib/education-progress-schedule'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'
import '@/features/program/general/ui/detail-modal/program-status/participating-institution-application-info.css'

/** Figma 14931:806953 — 라벨 열 180px, 2·4열 수직 표 */
const TT_APPLICATION_INFO_COLGROUP = (
  <colgroup>
    <col style={{ width: '180px' }} />
    <col />
    <col style={{ width: '180px' }} />
    <col />
  </colgroup>
)

const TT_APPLICATION_SCHEDULE_COLGROUP = (
  <colgroup>
    <col style={{ width: '180px' }} />
    <col />
  </colgroup>
)

function TrainedTeacherEducationProgressValue({
  session,
  statusBadge,
}: {
  session: ParticipatingSchoolSession
  statusBadge: ReturnType<typeof resolveTrainedTeacherEducationProgressBadge>
}) {
  const datetime = formatTrainedTeacherEducationProgressDateTime(session)
  const duration = session.duration?.trim() ?? ''
  const status = statusBadge ? (
    <span
      className={`participating-institution-application-info__session-status ${statusBadge.statusClass}`}
    >
      {statusBadge.label}
    </span>
  ) : null
  const parts = [datetime, duration].filter(Boolean)
  return (
    <ProgramDetailTdSegmentWrap className="participating-institution-application-info__schedule-value">
      {withProgramDetailTdDivider(status ? [...parts, status] : parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

export interface TrainedTeachersParticipatingInstitutionApplicationInfoProps {
  formError?: string
  showAdminComment?: boolean
  adminComment?: string
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
  programProgressCell: ReactNode
  textbookCell: ReactNode
  usesTextbook?: boolean
  textbookEditFullWidth?: boolean
  institutionId: string
  /** 상세 GET `educationSchedules` — 승인 확정 운영 일정 행 SSOT. preferred로 채우지 않는다. */
  educationScheduleSessions?: ParticipatingSchoolSession[]
  /** 상세 GET `preferredScheduleBlocks` — MATCHED scheduleId → 지망 라벨 룩업만 */
  preferredScheduleBlocks?: ApplicantPreferredScheduleBlock[]
  schoolName: ReactNode
  educationGrade: ReactNode
  region: ReactNode
  addressDetail: ReactNode
  classAndCount: ReactNode
  educationFormat: ReactNode
  teacherInfo: ReactNode
  applicationReason: ReactNode
  otherRequests: ReactNode
}

export function TrainedTeachersParticipatingInstitutionApplicationInfo({
  formError,
  showAdminComment = false,
  adminComment,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
  programProgressCell,
  textbookCell,
  usesTextbook = true,
  textbookEditFullWidth = false,
  institutionId: _institutionId,
  educationScheduleSessions = [],
  preferredScheduleBlocks = [],
  schoolName,
  educationGrade,
  region,
  addressDetail,
  classAndCount,
  educationFormat,
  teacherInfo,
  applicationReason,
  otherRequests,
}: TrainedTeachersParticipatingInstitutionApplicationInfoProps) {
  void _institutionId
  const progressRows = buildTrainedTeacherEducationProgressRows(
    educationScheduleSessions,
    preferredScheduleBlocks
  )

  return (
    <div className="institution-basic-info applicant-institution-basic-info participating-institution-application-info">
      {formError ? <div className="institution-basic-info__form-error">{formError}</div> : null}

      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
          validationError={adminCommentError}
        />
      ) : null}

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap participating-institution-application-info__table-wrap--overview">
            <table className="applicant-institution-basic-info__table">
              {TT_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowFullWidth
                  label="프로그램 진행 현황"
                  value={programProgressCell}
                />
                {usesTextbook && textbookEditFullWidth ? (
                  <InstitutionApplicationTableRowFullWidth label="교재명" value={textbookCell} />
                ) : null}
                {usesTextbook && !textbookEditFullWidth ? (
                  <InstitutionApplicationTableRowFullWidth label="교재명" value={textbookCell} />
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {TT_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowTwoCols
                  label1="참여 기관명"
                  value1={schoolName}
                  label2="교육 학년"
                  value2={educationGrade}
                />
                <InstitutionApplicationTableRowTwoCols
                  label1="기관 소재지"
                  value1={region}
                  label2="상세 주소"
                  value2={addressDetail}
                />
                <InstitutionApplicationTableRowTwoCols
                  label1="신청 학급 수 및 총 인원"
                  value1={classAndCount}
                  label2="교육 형태"
                  value2={educationFormat}
                />
                <InstitutionApplicationTableRowFullWidth label="담당 교사 정보" value={teacherInfo} />
                <InstitutionApplicationTableRowFullWidth
                  label="신청 사유"
                  value={applicationReason}
                  multiline
                />
                <InstitutionApplicationTableRowFullWidth
                  label="기타 요청사항"
                  value={otherRequests}
                  multiline
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">교육 진행 일정</h3>
        {progressRows.length === 0 ? (
          <DetailInfoForm title="교육 진행 일정" hideHeader mode="view">
            <DetailInfoForm.Row type="custom">
              <p className="detail-info-form__field-content participating-institution-application-info__schedule-empty">
                등록된 교육 일정이 없습니다.
              </p>
            </DetailInfoForm.Row>
          </DetailInfoForm>
        ) : (
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table participating-institution-application-info__schedule-table">
              {TT_APPLICATION_SCHEDULE_COLGROUP}
              <tbody>
                {progressRows.map((row, index) => (
                  <InstitutionApplicationTableRowSingleCol
                    key={`${row.attendanceScheduleIds.join('-') || 'none'}-${index}`}
                    label={row.rowLabel}
                    valueColSpan={1}
                    value={
                      <TrainedTeacherEducationProgressValue
                        session={row.session}
                        statusBadge={resolveTrainedTeacherEducationProgressBadge(
                          row.session.deliveryScheduleStatus
                        )}
                      />
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
