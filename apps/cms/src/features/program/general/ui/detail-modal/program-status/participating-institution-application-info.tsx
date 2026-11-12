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
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  resolveParticipatingInstitutionScheduleRowLabel,
  sumKnownParticipatingSessionCurriculumCount,
  withParticipatingProgressCurriculumShape,
} from '@/features/program/general/lib/participating-school-session-display'
import { generalEducationScheduleShapeFromBridge } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
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
import type { CompanySchoolHopeScheduleBlock } from '@/features/program/1c-1s/lib/progress-schedule-display'

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
  /** 프로그램 승인 현황 + 알림 재발송. 없으면 행을 숨긴다. */
  programApprovalStatusCell?: ReactNode
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
  /** 「교육 진행 일정」 제목 우측 액션 — 일반 기관형 수정 모드 「일정 변경」(시안 01-2) */
  scheduleTitleTrailing?: ReactNode
  /**
   * `general-institution` — 일반 기관형 시안(01-1·01-2) 문구·구성.
   * - 조회: 「프로그램 진행 현황」만, 수정: 「프로그램 승인 현황」만
   * - 수정 라벨 신청 기관명 / 신청 학년 / 희망 교육 형태, 「안내사항」 + 수정 시 보조 설명
   * 기본 `default`(1사1교 등) 기존 그대로.
   */
  copyVariant?: 'default' | 'general-institution'
  /**
   * 1사1교 시안(05-2 01) — 신청 학급 수 행 아래 「결연 금융 회사 | 전년도 진행 여부」.
   * 넘길 때만 행을 그린다(다른 유형 기본 없음).
   */
  companySchoolEconomyRow?: {
    affiliatedFinancialCompany: ReactNode
    previousYearParticipation: ReactNode
  }
  /**
   * 1사1교 — 확정 일정이 없을 때 「교육 진행 일정」에 보여 줄 희망 일정 블록(requested-schedules).
   * 넘기면 `sessions` 대신 이 블록을 시안 형식으로 그린다. 확정 일정이 있으면 넘기지 않는다.
   */
  companySchoolHopeBlocks?: CompanySchoolHopeScheduleBlock[]
}

const GENERAL_INSTITUTION_GUIDANCE_EDIT_DESCRIPTION =
  '강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.'

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
  // round는 회차 번호(sessionNo)라 교시가 아니다. 교시를 모르면 지어내지 않고 시각만 표시한다.
  const classLabel = session.classNum?.trim()
  return classLabel ? `${classLabel} (${timePart})` : timePart
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

/**
 * 1사1교 희망 일정(확정 전) — 「날짜 | N~(N+1)교시 (N차시)」, 교육 시간 「N교시 (시간) | N+1교시 (시간)」.
 * 지망 구분은 시간 칸이 아니라 교육 진행 현황 칸(「진행 대기 | N지망」)에 둔다.
 */
function CompanySchoolHopeScheduleFields({ blocks }: { blocks: CompanySchoolHopeScheduleBlock[] }) {
  return (
    <>
      {blocks.map(block => (
        <Fragment key={block.key}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 진행 현황"
              fullRow
              readOnlyDisplay
              view={
                <ProgramDetailTdSegmentWrap>
                  {withProgramDetailTdDivider([
                    <span
                      key="status"
                      className="participating-institution-application-info__session-status participating-institution-application-info__session-status--pending"
                    >
                      진행 대기
                    </span>,
                    ...(block.preferenceOrder != null ? [`${block.preferenceOrder}지망`] : []),
                  ])}
                </ProgramDetailTdSegmentWrap>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육일 및 차시"
              readOnlyDisplay
              view={
                <ProgramDetailTdSegmentWrap>
                  {withProgramDetailTdDivider(block.dateUnitSegments)}
                </ProgramDetailTdSegmentWrap>
              }
            />
            <DetailInfoForm.Field
              label="교육 시간"
              readOnlyDisplay
              view={
                block.periodTimeLabels.length > 0 ? (
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider(block.periodTimeLabels)}
                  </ProgramDetailTdSegmentWrap>
                ) : (
                  '-'
                )
              }
            />
          </DetailInfoForm.Row>
        </Fragment>
      ))}
    </>
  )
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
        // 일정 건수는 차시 수가 아니다 — 신청·연결 차시 수를 알 때만 「N차시」
        const sessionCount = sumKnownParticipatingSessionCurriculumCount(group)
        const scheduleLabel = (
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([
              formatCompanySchoolDateWithDay(first),
              ...(sessionCount != null ? [`${sessionCount}차시`] : []),
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
  programApprovalStatusCell,
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
  scheduleTitleTrailing,
  copyVariant = 'default',
  companySchoolEconomyRow,
  companySchoolHopeBlocks,
}: ParticipatingInstitutionApplicationInfoProps) {
  const isGeneralInstitutionCopy = copyVariant === 'general-institution'
  const showProgramProgressRow = !isGeneralInstitutionCopy || !isBasicInfoEditing
  const showProgramApprovalRow =
    programApprovalStatusCell != null && (!isGeneralInstitutionCopy || isBasicInfoEditing)
  const editLabel = (generalEditLabel: string, defaultLabel: string) =>
    isGeneralInstitutionCopy && isBasicInfoEditing ? generalEditLabel : defaultLabel
  const institutionApplicationBridge = resolveInstitutionApplicationProgramBridge(program)
  const scheduleShape = withParticipatingProgressCurriculumShape(
    generalEducationScheduleShapeFromBridge(institutionApplicationBridge),
    program
  )
  const displaySessions = sessions
  const showGuidanceSection = shouldShowInstitutionApplicationGuidanceParagraph(
    institutionApplicationBridge
  )
  const basicInfoFormMode = isBasicInfoEditing ? 'edit' : 'view'

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
          {showProgramProgressRow ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="프로그램 진행 현황"
                fullRow
                readOnlyDisplay={!isBasicInfoEditing}
                view={programProgressCell}
                edit={programProgressCell}
              />
            </DetailInfoForm.Row>
          ) : null}
          {showProgramApprovalRow ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="프로그램 승인 현황"
                fullRow
                readOnlyDisplay
                view={programApprovalStatusCell}
              />
            </DetailInfoForm.Row>
          ) : null}
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
              label={editLabel('신청 기관명', '참여 기관명')}
              readOnlyDisplay={!isBasicInfoEditing}
              view={schoolName}
              edit={schoolName}
            />
            <DetailInfoForm.Field
              label={editLabel('신청 학년', '교육 학년')}
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
                label={editLabel('희망 교육 형태', '교육 형태')}
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
          {companySchoolEconomyRow ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="결연 금융 회사"
                readOnlyDisplay
                view={companySchoolEconomyRow.affiliatedFinancialCompany}
              />
              <DetailInfoForm.Field
                label="전년도 진행 여부"
                readOnlyDisplay
                view={companySchoolEconomyRow.previousYearParticipation}
              />
            </DetailInfoForm.Row>
          ) : null}
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
        <DetailInfoForm
          title="안내사항"
          mode="view"
          {...(isGeneralInstitutionCopy && isBasicInfoEditing
            ? {
                description: GENERAL_INSTITUTION_GUIDANCE_EDIT_DESCRIPTION,
                descriptionPlacement: 'below' as const,
              }
            : {})}
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="강의 공간 내 컴퓨터 여부"
              fullRow
              readOnlyDisplay
              view={computerInRoom}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="대기 장소 안내"
              fullRow
              readOnlyDisplay
              view={waitingPlace}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="식사 가능 여부 및 안내"
              fullRow
              readOnlyDisplay
              view={mealInfo}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={institutionApplicationTableLabelWithParenthesisHint(
                INSTITUTION_OTHER_NOTES_TABLE_LABEL
              )}
              fullRow
              readOnlyDisplay
              view={otherNotes}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄경력 조회서 요청"
              fullRow
              readOnlyDisplay
              view={criminalCheck}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}

      <DetailInfoForm title="교육 진행 일정" mode="view" titleTrailing={scheduleTitleTrailing}>
        {useCompanySchoolScheduleFormat && companySchoolHopeBlocks?.length ? (
          <CompanySchoolHopeScheduleFields blocks={companySchoolHopeBlocks} />
        ) : displaySessions.length === 0 ? (
          <DetailInfoForm.Row type="custom">
            <p className="participating-institution-application-info__schedule-empty">
              {scheduleSessionsEmptyMessage}
            </p>
          </DetailInfoForm.Row>
        ) : useCompanySchoolScheduleFormat ? (
          <CompanySchoolProgressScheduleFields sessions={sessions} />
        ) : (
          displaySessions.map((session, index) => (
            <DetailInfoForm.Row
              type="single"
              key={`${session.osaAssignmentId ?? 's'}-${session.resolvedScheduleId ?? 'r'}-${session.round}-${index}`}
            >
              <DetailInfoForm.Field
                label={resolveParticipatingInstitutionScheduleRowLabel(program, session)}
                fullRow
                readOnlyDisplay
                view={
                  <ParticipatingProgressScheduleValue
                    session={session}
                    shape={scheduleShape}
                  />
                }
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>
    </div>
  )
}
