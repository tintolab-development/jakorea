/**
 * 교육받은 교사 — 참여 기관 상세 신청 정보 (안내사항·합반 비노출, TT 일정 표시)
 */

import type { ReactNode } from 'react'
import { getTrainedTeachersPreferredScheduleBlocks } from '@/data/mock/trained-teachers-institution-detail'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import {
  INSTITUTION_APPLICATION_INFO_COLGROUP,
  InstitutionApplicationTableRowFullWidth,
  InstitutionApplicationTableRowTwoCols,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'
import '@/features/program/general/ui/detail-modal/program-status/participating-institution-application-info.css'
import { TrainedTeachersPreferredScheduleDetailSection } from './preferred-schedule-detail-section'

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
  institutionId,
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
  const preferredScheduleBlocks = getTrainedTeachersPreferredScheduleBlocks(institutionId)

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

      <TrainedTeachersPreferredScheduleDetailSection
        blocks={preferredScheduleBlocks}
        sectionTitle="교육 진행 일정"
      />
    </div>
  )
}
