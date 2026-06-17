/**
 * 참여 기관 상세 — 신청 정보 탭 (기관 신청 상세와 동일 테이블·정렬)
 */

import type { ReactNode } from 'react'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { ParticipatingProgressScheduleRow } from './participating-progress-schedule-row'
import {
  INSTITUTION_APPLICATION_INFO_COLGROUP,
  INSTITUTION_APPLICATION_SCHEDULE_COLGROUP,
  InstitutionApplicationTableRowFullWidth,
  InstitutionApplicationTableRowSingleCol,
  InstitutionApplicationTableRowTwoCols,
  institutionApplicationTableLabelWithParenthesisHint,
  INSTITUTION_OTHER_NOTES_TABLE_LABEL,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'
import './participating-institution-application-info.css'

export interface ParticipatingInstitutionApplicationInfoProps {
  formError?: string
  showAdminComment?: boolean
  adminComment?: string
  /** 정보 수정과 분리 — 코멘트 작성 버튼으로만 편집 */
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
  programProgressCell: ReactNode
  textbookCell: ReactNode
  combinedClassCell: ReactNode
  usesTextbook?: boolean
  textbookEditFullWidth?: boolean
  schoolName: ReactNode
  educationGrade: ReactNode
  region: ReactNode
  addressDetail: ReactNode
  classAndCount: ReactNode
  educationFormat: ReactNode
  teacherInfo: ReactNode
  applicationReason: ReactNode
  otherRequests: ReactNode
  computerInRoom: ReactNode
  waitingPlace: ReactNode
  mealInfo: ReactNode
  otherNotes: ReactNode
  criminalCheck: ReactNode
  program: Program
  sessions: ParticipatingSchoolSession[]
}

export function ParticipatingInstitutionApplicationInfo({
  formError,
  showAdminComment = false,
  adminComment,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
  programProgressCell,
  textbookCell,
  combinedClassCell,
  usesTextbook = true,
  textbookEditFullWidth = false,
  schoolName,
  educationGrade,
  region,
  addressDetail,
  classAndCount,
  educationFormat,
  teacherInfo,
  applicationReason,
  otherRequests,
  computerInRoom,
  waitingPlace,
  mealInfo,
  otherNotes,
  criminalCheck,
  program,
  sessions,
}: ParticipatingInstitutionApplicationInfoProps) {
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
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowFullWidth
                  label="프로그램 진행 현황"
                  value={programProgressCell}
                />
                {usesTextbook && textbookEditFullWidth ? (
                  <>
                    <InstitutionApplicationTableRowFullWidth label="교재명" value={textbookCell} />
                    <InstitutionApplicationTableRowFullWidth
                      label="합반 신청 여부"
                      value={combinedClassCell}
                    />
                  </>
                ) : null}
                {usesTextbook && !textbookEditFullWidth ? (
                  <InstitutionApplicationTableRowTwoCols
                    label1="교재명"
                    value1={textbookCell}
                    label2="합반 신청 여부"
                    value2={combinedClassCell}
                  />
                ) : null}
                {!usesTextbook ? (
                  <InstitutionApplicationTableRowFullWidth
                    label="합반 신청 여부"
                    value={combinedClassCell}
                  />
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
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
        <h3 className="applicant-institution-basic-info__title">안내 사항</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {INSTITUTION_APPLICATION_INFO_COLGROUP}
            <tbody>
              <InstitutionApplicationTableRowSingleCol
                label="강의 공간 내 컴퓨터 여부"
                value={computerInRoom}
              />
              <InstitutionApplicationTableRowSingleCol label="대기 장소 안내" value={waitingPlace} />
              <InstitutionApplicationTableRowSingleCol
                label="식사 가능 여부 및 안내"
                value={mealInfo}
              />
              <InstitutionApplicationTableRowSingleCol
                label={institutionApplicationTableLabelWithParenthesisHint(
                  INSTITUTION_OTHER_NOTES_TABLE_LABEL
                )}
                value={otherNotes}
              />
              <InstitutionApplicationTableRowSingleCol
                label="성범죄 경력 조회서 요청"
                value={criminalCheck}
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">교육 진행 일정</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {INSTITUTION_APPLICATION_SCHEDULE_COLGROUP}
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value participating-institution-application-info__schedule-empty"
                  >
                    등록된 교육 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <ParticipatingProgressScheduleRow
                    key={`${session.round}-${session.date}`}
                    rowLabel={resolveParticipatingInstitutionScheduleRowLabel(program, session)}
                    session={session}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
