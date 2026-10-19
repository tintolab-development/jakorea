/**
 * 참여 기관 상세 — 신청 정보 탭 (기관 신청 상세와 동일 테이블·정렬)
 */

import { Fragment, type ReactNode } from 'react'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationGuidanceParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import {
  institutionApplicationTableLabelWithParenthesisHint,
  INSTITUTION_OTHER_NOTES_TABLE_LABEL,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import { ParticipatingProgressScheduleValue } from './participating-progress-schedule-row'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'
import './participating-institution-application-info.css'

export interface ParticipatingInstitutionApplicationInfoProps {
  /** 정보 수정 모드 — 기본 정보 타이틀 `*` 표시 */
  isBasicInfoEditing?: boolean
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
  hideCombinedClass?: boolean
  schoolName: ReactNode
  educationGrade: ReactNode
  region: ReactNode
  addressDetail: ReactNode
  classAndCount: ReactNode
  educationFormat: ReactNode
  showEducationFormatField?: boolean
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
  /** 배정 일정 없음·로딩 등 — 기본: 등록된 교육 일정이 없습니다. */
  scheduleSessionsEmptyMessage?: string
  useCompanySchoolScheduleFormat?: boolean
  onScheduleChangeClick?: () => void
}

function padScheduleTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function formatCompanySchoolDateWithDay(session: ParticipatingSchoolSession): string {
  const datePart = session.date.replace(/\./g, '. ').replace(/\s+/g, ' ').trim()
  return formatCmsScheduleDisplayLabel(`${datePart}(${session.dayOfWeek})`)
}

function formatCompanySchoolClassTime(session: ParticipatingSchoolSession): string {
  const [startRaw, endRaw] = session.timeRange.split('~')
  const timePart = `${padScheduleTimePart(startRaw)} ~ ${padScheduleTimePart(endRaw ?? startRaw)}`
  const classLabel = session.classNum?.trim() || `${session.round}교시`
  return `${classLabel} (${timePart})`
}

function groupCompanySchoolSessions(
  sessions: ParticipatingSchoolSession[]
): ParticipatingSchoolSession[][] {
  const groups = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of sessions.filter(s => s.status !== 'not_planned')) {
    const key = `${session.date}|${session.dayOfWeek}`
    const prev = groups.get(key)
    if (prev) prev.push(session)
    else groups.set(key, [session])
  }

  return Array.from(groups.values()).map(group => [...group].sort((a, b) => a.round - b.round))
}

function CompanySchoolProgressScheduleFields({
  sessions,
}: {
  sessions: ParticipatingSchoolSession[]
}) {
  return (
    <>
      {groupCompanySchoolSessions(sessions).map(group => {
        const first = group[0]!
        const isCompleted = group.every(session => session.status === 'completed')
        const statusLabel = isCompleted ? '진행 완료' : '진행 대기'
        const statusClass = isCompleted
          ? 'participating-institution-application-info__session-status--completed'
          : 'participating-institution-application-info__session-status--pending'
        const scheduleLabel = (
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([
              formatCompanySchoolDateWithDay(first),
              `${group.length}차시`,
            ])}
          </ProgramDetailTdSegmentWrap>
        )
        const timeLabel = (
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider(group.map(formatCompanySchoolClassTime))}
          </ProgramDetailTdSegmentWrap>
        )

        return (
          <Fragment key={`${first.date}-${first.dayOfWeek}`}>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 진행 현황"
                fullRow
                readOnlyDisplay
                view={
                  <span
                    className={`participating-institution-application-info__session-status ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field label="교육일 및 차시" readOnlyDisplay view={scheduleLabel} />
              <DetailInfoForm.Field label="교육 시간" readOnlyDisplay view={timeLabel} />
            </DetailInfoForm.Row>
          </Fragment>
        )
      })}
    </>
  )
}

export function ParticipatingInstitutionApplicationInfo({
  isBasicInfoEditing = false,
  showAdminComment = false,
  adminComment,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
  programProgressCell,
  textbookCell,
  combinedClassCell,
  hideCombinedClass = false,
  schoolName,
  educationGrade,
  region,
  addressDetail,
  classAndCount,
  educationFormat,
  showEducationFormatField = true,
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
  scheduleSessionsEmptyMessage = '등록된 교육 일정이 없습니다.',
  useCompanySchoolScheduleFormat = false,
  onScheduleChangeClick,
}: ParticipatingInstitutionApplicationInfoProps) {
  const showGuidanceSection = shouldShowInstitutionApplicationGuidanceParagraph(
    resolveInstitutionApplicationProgramBridge(program)
  )
  const basicInfoFormMode = isBasicInfoEditing ? 'edit' : 'view'

  const scheduleChangeButton =
    isBasicInfoEditing && onScheduleChangeClick ? (
      <CmsButton variant="secondary" size="medium" type="button" onClick={onScheduleChangeClick}>
        일정 변경
      </CmsButton>
    ) : null

  return (
    <div className="institution-basic-info applicant-institution-basic-info participating-institution-application-info">
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
          validationError={adminCommentError}
        />
      ) : null}

      <section className="applicant-institution-basic-info__section applicant-instructor-basic-info">
        <DetailInfoForm
          title="기본 정보"
          mode={basicInfoFormMode}
          className="participating-institution-application-info__table-wrap--overview"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="프로그램 진행 현황"
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={programProgressCell}
              edit={programProgressCell}
            />
          </DetailInfoForm.Row>
          {hideCombinedClass ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교재명"
                fullRow
                readOnlyDisplay={!isBasicInfoEditing}
                view={textbookCell}
                edit={textbookCell}
              />
            </DetailInfoForm.Row>
          ) : (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교재명"
                readOnlyDisplay={!isBasicInfoEditing}
                view={textbookCell}
                edit={textbookCell}
              />
              <DetailInfoForm.Field
                label="합반 신청 여부"
                readOnlyDisplay={!isBasicInfoEditing}
                view={combinedClassCell}
                edit={combinedClassCell}
              />
            </DetailInfoForm.Row>
          )}
        </DetailInfoForm>
        <DetailInfoForm title="기본 정보" hideHeader mode={basicInfoFormMode}>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="참여 기관명"
              readOnlyDisplay={!isBasicInfoEditing}
              view={schoolName}
              edit={schoolName}
            />
            <DetailInfoForm.Field
              label="교육 학년"
              readOnlyDisplay={!isBasicInfoEditing}
              view={educationGrade}
              edit={educationGrade}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="기관 소재지"
              readOnlyDisplay={!isBasicInfoEditing}
              view={region}
              edit={region}
            />
            <DetailInfoForm.Field
              label="상세 주소"
              readOnlyDisplay={!isBasicInfoEditing}
              view={addressDetail}
              edit={addressDetail}
            />
          </DetailInfoForm.Row>
          {showEducationFormatField ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="신청 학급 수 및 총 인원"
                readOnlyDisplay={!isBasicInfoEditing}
                view={classAndCount}
                edit={classAndCount}
              />
              <DetailInfoForm.Field
                label="교육 형태"
                readOnlyDisplay={!isBasicInfoEditing}
                view={educationFormat}
                edit={educationFormat}
              />
            </DetailInfoForm.Row>
          ) : (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="신청 학급 수 및 총 인원"
                fullRow
                readOnlyDisplay={!isBasicInfoEditing}
                view={classAndCount}
                edit={classAndCount}
              />
            </DetailInfoForm.Row>
          )}
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="담당 교사 정보"
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={teacherInfo}
              edit={teacherInfo}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="신청 사유"
              fullRow
              readOnlyDisplay
              view={applicationReason}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="기타 요청사항"
              fullRow
              readOnlyDisplay
              view={otherRequests}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </section>

      {showGuidanceSection ? (
        <DetailInfoForm title="안내 사항" mode={basicInfoFormMode}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="강의 공간 내 컴퓨터 여부"
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={computerInRoom}
              edit={computerInRoom}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="대기 장소 안내"
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={waitingPlace}
              edit={waitingPlace}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="식사 가능 여부 및 안내"
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={mealInfo}
              edit={mealInfo}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={institutionApplicationTableLabelWithParenthesisHint(
                INSTITUTION_OTHER_NOTES_TABLE_LABEL
              )}
              fullRow
              readOnlyDisplay={!isBasicInfoEditing}
              view={otherNotes}
              edit={otherNotes}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄 경력 조회서 요청"
              fullRow
              readOnlyDisplay
              view={criminalCheck}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}

      <DetailInfoForm
        title="교육 진행 일정"
        mode={basicInfoFormMode}
        titleTrailing={scheduleChangeButton}
      >
        {sessions.length === 0 ? (
          <DetailInfoForm.Row type="custom">
            <p className="participating-institution-application-info__schedule-empty">
              {scheduleSessionsEmptyMessage}
            </p>
          </DetailInfoForm.Row>
        ) : useCompanySchoolScheduleFormat ? (
          <CompanySchoolProgressScheduleFields sessions={sessions} />
        ) : (
          sessions.map((session, index) => (
            <DetailInfoForm.Row
              type="single"
              key={`${session.osaAssignmentId ?? 's'}-${session.resolvedScheduleId ?? 'r'}-${session.round}-${index}`}
            >
              <DetailInfoForm.Field
                label={resolveParticipatingInstitutionScheduleRowLabel(program, session)}
                fullRow
                readOnlyDisplay
                view={<ParticipatingProgressScheduleValue session={session} />}
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>
    </div>
  )
}
