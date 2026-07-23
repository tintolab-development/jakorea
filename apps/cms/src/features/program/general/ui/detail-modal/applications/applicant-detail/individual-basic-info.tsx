/**
 * 일반 프로그램 — 개인 유형 참여자 신청 상세
 */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { CmsInput, CmsNumericInput, CmsSelect } from '@/shared/ui'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import type {
  GeneralIndividualApplicantDetail,
  GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import type { ApplicantIndividualEditDraft } from '@/features/program/general/lib/applicant-individual-detail-edit'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import {
  TEXTBOOK_NOT_USED_OPTION_VALUE,
  individualApplicantUsesTextbook,
  resolveIndividualApplicantTextbookDisplay,
} from '@/features/program/general/lib/individual-applicant-textbook'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import {
  shouldShowIndividualApplicantPreferredScheduleSection,
  shouldShowIndividualApplicantTeamSection,
  shouldShowIndividualInterviewAvailabilitySection,
  shouldShowIndividualInterviewEvaluationSection,
  shouldShowIndividualManagerEvaluationSection,
  type IndividualApplicantScreeningStage,
} from '@/features/program/general/lib/individual-application-visibility'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'
import { ParticipatingProgressScheduleRow } from '@/features/program/general/ui/detail-modal/program-status/participating-progress-schedule-row'
import '@/features/program/general/ui/detail-modal/program-status/participating-institution-application-info.css'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { formatInstitutionApplicationScheduleRowLabel } from '@/features/program/general/lib/institution-application-session-display'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { GeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { IndividualApplicantInterviewAvailabilitySection } from './individual-applicant-interview-availability'
import { IndividualApplicantInterviewEvaluationSection } from './individual-interview-evaluation-section'
import {
  IndividualApplicantId1365Cell,
  IndividualApplicantManagerEvaluationSection,
} from './individual-screening-sections'
import { GeneralIndividualTeamRoleDropdown } from './individual-team-role-dropdown'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-resume.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

export interface ApplicantGeneralIndividualBasicInfoProps {
  applicant: GeneralIndividualApplicantRow
  program?: Program | null
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  /** application: 신청 상세, progress: 프로그램 진행 현황 > 참여자 상세 */
  detailContext?: 'application' | 'progress'
  draft?: ApplicantIndividualEditDraft
  onDraftChange?: (partial: Partial<ApplicantIndividualEditDraft>) => void
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
  screeningStage?: IndividualApplicantScreeningStage
  textbookOptions?: TextbookSelectOption[]
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  openManagerDropdown?: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown?: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange?: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange?: (id: string, evaluation: GeneralManagerEvaluation) => void
}

function formatBirthDateAndAge(birthDate?: string, age?: number): string {
  if (!birthDate && age == null) return '-'
  const formatted = birthDate ? birthDate.replace(/\./g, '. ') : ''
  if (formatted && age != null) return `${formatted} (만 ${age}세)`
  if (formatted) return formatted
  if (age != null) return `만 ${age}세`
  return '-'
}

function IndividualApplicantScreeningBasicInfo({
  applicant,
  maskSensitive,
  onResendNotificationClick,
}: {
  applicant: GeneralIndividualApplicantRow
  maskSensitive: boolean
  onResendNotificationClick?: () => void
}) {
  const detail = applicant.detail
  const shouldMask = maskSensitive && applicant.approvalStatus !== 'approved'

  const scheduleChangeCount = detail?.scheduleChangeCancelCount ?? 0
  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {applicant.applicantName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.applicantName
    )

  const genderBirthDisplay = withProgramDetailTdDivider([
    detail?.gender ?? '-',
    formatBirthDateAndAge(detail?.birthDate, detail?.age),
  ])

  const affiliationDisplay = (() => {
    const school = detail?.affiliationSchool?.trim() || applicant.affiliation?.trim()
    const grade = detail?.affiliationGrade?.trim() || applicant.educationGrade?.trim()
    if (!school && !grade) return '해당 없음'
    if (school && grade) {
      return (
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([school, grade])}
        </ProgramDetailTdSegmentWrap>
      )
    }
    return school || grade || '해당 없음'
  })()

  const contactDisplay = detail?.contact
    ? shouldMask
      ? MASKING_POLICY.phone(detail.contact.replace(/\s/g, '')) || detail.contact
      : detail.contact
    : '-'

  const emailDisplay = detail?.email
    ? shouldMask
      ? MASKING_POLICY.email(detail.email)
      : detail.email
    : '-'

  const id1365Raw = detail?.id1365?.trim()
  const id1365Display = id1365Raw ? (shouldMask ? maskId1365(id1365Raw) : id1365Raw) : '-'

  return (
    <section className="general-volunteer-applicant-basic-info">
      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="프로그램 승인 현황"
            fullRow
            readOnlyDisplay
            view={
              <ProgramApprovalStatusValue
                applicant={applicant}
                onResendNotificationClick={onResendNotificationClick}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="성명" readOnlyDisplay view={nameCell} />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="학교 재학 여부"
            readOnlyDisplay
            view={detail?.schoolEnrollmentStatus ?? '-'}
          />
          <DetailInfoForm.Field label="소속" readOnlyDisplay view={affiliationDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" readOnlyDisplay view={contactDisplay} />
          <DetailInfoForm.Field label="이메일" readOnlyDisplay view={emailDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="자택 주소지"
            readOnlyDisplay
            view={
              <HomeAddressDisplay
                address={detail?.homeAddressFull ?? applicant.homeAddress}
                mask={shouldMask}
              />
            }
          />
          <DetailInfoForm.Field label="1365 ID" readOnlyDisplay view={id1365Display} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}

function IndividualApplicantScreeningSelfIntroSection({
  selfIntroduction,
}: {
  selfIntroduction?: string
}) {
  const text = selfIntroduction?.trim() || '-'

  return (
    <DetailInfoForm
      title="자기소개 및 지원동기"
      mode="view"
      className="general-volunteer-applicant-essay-sections__item"
    >
      <DetailInfoForm.Row type="custom">
        <div className="instructor-resume-free-writing-card">
          <p className="instructor-resume-free-writing-text">{text}</p>
        </div>
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function IndividualApplicantScreeningTeamSection({
  applicant,
  detail,
}: {
  applicant: GeneralIndividualApplicantRow
  detail?: GeneralIndividualApplicantDetail
}) {
  return (
    <DetailInfoForm title="팀 정보" mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="팀 명 및 인원"
          fullRow
          readOnlyDisplay
          view={
            <ProgramDetailTdSegmentWrap>
              {withProgramDetailTdDivider([
                detail?.teamName?.trim() || '-',
                formatTeamMemberCountDisplay(detail),
              ])}
            </ProgramDetailTdSegmentWrap>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="역할"
          fullRow
          readOnlyDisplay
          view={
            detail?.teamRole ? (
              <GeneralIndividualTeamRoleDropdown
                applicantId={applicant.id}
                teamRole={detail.teamRole}
              />
            ) : (
              '-'
            )
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function maskId1365(id: string): string {
  if (id.length <= 4) return '*'.repeat(id.length)
  return `${id.slice(0, 4)}***`
}

function splitAddressAfterDong(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressAfterGu(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{1,12}구)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const gu = m[1]
  const i = address.indexOf(gu)
  if (i === -1) return null
  const end = i + gu.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressForPrivacyBlur(address: string): { head: string; tail: string } | null {
  return splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
}

function HomeAddressDisplay({ address, mask }: { address: string | undefined; mask: boolean }) {
  if (!address?.trim()) return <>-</>
  if (!mask) return <>{address}</>

  const split = splitAddressForPrivacyBlur(address)
  if (!split) {
    return (
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {address}
      </span>
    )
  }

  const { head, tail } = split
  if (!tail.trim()) {
    return <>{head}</>
  }

  return (
    <>
      {head}
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {tail}
      </span>
    </>
  )
}

function formatTeamMemberCountDisplay(
  detail?: GeneralIndividualApplicantDetail,
  draft?: ApplicantIndividualEditDraft
): string {
  if (draft) {
    if (draft.teamMemberCountSelect === 'custom') {
      return `${draft.teamMemberCount}명 (직접 입력)`
    }
    return `${draft.teamMemberCount}명`
  }
  if (detail?.teamMemberCount == null) return '-'
  if (detail.teamMemberCountSelect === 'custom') {
    return `${detail.teamMemberCount}명 (직접 입력)`
  }
  return `${detail.teamMemberCount}명`
}

const TEAM_MEMBER_COUNT_OPTIONS = [
  { label: '1명', value: '1' },
  { label: '2명', value: '2' },
  { label: '3명', value: '3' },
  { label: '4명', value: '4' },
  { label: '5명', value: '5' },
  { label: '직접 입력', value: 'custom' },
] as const

function TableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: ReactNode
  label2: string
  value2: ReactNode
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label2}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value2}
      </td>
    </tr>
  )
}

function TableRowFullWidth({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
      >
        {value}
      </td>
    </tr>
  )
}

function PreferredScheduleRow({
  rank,
  session,
  bridge,
}: {
  rank: number
  session: ParticipatingSchoolSession
  bridge?: ReturnType<typeof resolveInstitutionApplicationProgramBridge> | null
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {formatInstitutionApplicationScheduleRowLabel(rank, bridge)}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        <GeneralDetailSessionLine session={session} bridge={bridge} />
      </td>
    </tr>
  )
}

function ProgramApprovalStatusValue({
  applicant,
  onResendNotificationClick,
}: {
  applicant: GeneralIndividualApplicantRow
  onResendNotificationClick?: () => void
}) {
  return (
    <ProgramApprovalStatusDetailValue
      status={applicant.approvalStatus}
      participationRejectionReason={applicant.participationRejectionReason}
      approvalNotificationSentAt={applicant.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
    />
  )
}

export function ApplicantGeneralIndividualBasicInfo({
  applicant,
  program = null,
  maskSensitive = true,
  mode = 'view',
  detailContext = 'application',
  draft,
  onDraftChange,
  validationErrors,
  onResendNotificationClick,
  screeningStage = 'main',
  textbookOptions = [],
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  openManagerDropdown = null,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: ApplicantGeneralIndividualBasicInfoProps) {
  const detail = applicant.detail
  const isProgressContext = detailContext === 'progress'
  const shouldMask = maskSensitive && applicant.approvalStatus !== 'approved'
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const showAdminComment = isProgressContext || applicant.approvalStatus === 'approved'
  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program)
  const showTextbookField =
    screeningStage === 'main' &&
    applicant.approvalStatus === 'approved' &&
    (isTextbookCatalogLoading || individualApplicantUsesTextbook(program, textbookCatalog))

  const showTeamSection = shouldShowIndividualApplicantTeamSection(program, detail)
  const showManagerEvaluation = shouldShowIndividualManagerEvaluationSection(
    program,
    screeningStage
  )
  const showInterviewAvailability = shouldShowIndividualInterviewAvailabilitySection(
    program,
    screeningStage
  )
  const showInterviewEvaluation = shouldShowIndividualInterviewEvaluationSection(
    program,
    screeningStage
  )
  const showPreferredScheduleSection =
    !isProgressContext &&
    screeningStage === 'main' &&
    shouldShowIndividualApplicantPreferredScheduleSection(program)
  const showProgressScheduleSection = isProgressContext && program != null
  const institutionApplicationBridge = program
    ? resolveInstitutionApplicationProgramBridge(program)
    : null
  const sessions = applicant.sessions ?? []

  const scheduleChangeCount = detail?.scheduleChangeCancelCount ?? 0

  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {applicant.applicantName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.applicantName
    )

  const genderBirthDisplay = withProgramDetailTdDivider([
    detail?.gender ?? '-',
    formatBirthDateAndAge(detail?.birthDate, detail?.age),
  ])

  const affiliationDisplay = (() => {
    const school = detail?.affiliationSchool?.trim() || applicant.affiliation?.trim()
    const grade = detail?.affiliationGrade?.trim() || applicant.educationGrade?.trim()
    if (!school && !grade) return '해당 없음'
    if (school && grade) {
      return (
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([school, grade])}
        </ProgramDetailTdSegmentWrap>
      )
    }
    return school || grade || '해당 없음'
  })()

  const contactDisplay = detail?.contact
    ? shouldMask
      ? MASKING_POLICY.phone(detail.contact.replace(/\s/g, '')) || detail.contact
      : detail.contact
    : '-'

  const emailDisplay = detail?.email
    ? shouldMask
      ? MASKING_POLICY.email(detail.email)
      : detail.email
    : '-'

  const homeAddressDisplay = (
    <HomeAddressDisplay
      address={detail?.homeAddressFull ?? applicant.homeAddress}
      mask={shouldMask}
    />
  )

  const id1365Raw = detail?.id1365?.trim()
  const id1365Display = id1365Raw ? (shouldMask ? maskId1365(id1365Raw) : id1365Raw) : '-'
  const id1365Cell =
    !shouldMask && id1365Raw ? <IndividualApplicantId1365Cell id1365={id1365Raw} /> : id1365Display

  const textbookDisplay = resolveIndividualApplicantTextbookDisplay(program, applicant)
  const textbookViewValue =
    textbookDisplay.isUndecided ||
    textbookDisplay.name === '해당 없음' ||
    !textbookDisplay.name ? (
      textbookDisplay.name
    ) : (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          textbookDisplay.name,
          textbookDisplay.kitsLabel,
          textbookDisplay.status ? <TextbookStatusBadge status={textbookDisplay.status} /> : '-',
        ])}
      </ProgramDetailTdSegmentWrap>
    )

  const textbookEditValue =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder="교재명 선택"
          value={draft.textbookId || undefined}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            const isNotUsed = value === TEXTBOOK_NOT_USED_OPTION_VALUE
            onDraftChange({
              textbookId: String(value ?? ''),
              textbookName: isNotUsed ? '해당 없음' : (selected?.textbookName ?? ''),
              textbookStatus: isNotUsed ? 'not_applicable' : 'preparing',
            })
          }}
        />
        {validationErrors?.textbookId ? (
          <span className="institution-basic-info__field-error">{validationErrors.textbookId}</span>
        ) : null}
      </div>
    ) : (
      textbookViewValue
    )

  const teamNameAndMemberEditCell =
    isEditMode && draft && onDraftChange ? (
      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
        <CmsInput
          inputSize="large"
          width="100%"
          style={{ flex: '1 1 0', minWidth: 0 }}
          value={draft.teamName}
          onChange={event => onDraftChange({ teamName: event.target.value })}
        />
        <DetailInfoForm.InputsSeparator />
        <CmsSelect
          inputSize="large"
          width={140}
          value={draft.teamMemberCountSelect}
          options={TEAM_MEMBER_COUNT_OPTIONS.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const select = String(
              value ?? '1'
            ) as ApplicantIndividualEditDraft['teamMemberCountSelect']
            const parsed = select === 'custom' ? draft.teamMemberCount : Number(select)
            onDraftChange({
              teamMemberCountSelect: select,
              teamMemberCount: Number.isFinite(parsed) ? parsed : 1,
            })
          }}
        />
        {draft.teamMemberCountSelect === 'custom' ? (
          <>
            <DetailInfoForm.InputsSeparator />
            <CmsNumericInput
              inputSize="large"
              mode="integer"
              min={1}
              width="100%"
              style={{ flex: '1 1 160px', minWidth: 140 }}
              value={draft.teamMemberCount > 0 ? String(draft.teamMemberCount) : ''}
              onValueChange={raw => {
                onDraftChange({
                  teamMemberCount: raw === '' ? 0 : Number.parseInt(raw, 10),
                })
              }}
            />
          </>
        ) : null}
      </div>
    ) : null

  const colgroup = (
    <colgroup>
      <col style={{ width: '200px' }} />
      <col />
      <col style={{ width: '200px' }} />
      <col />
    </colgroup>
  )

  const scheduleColgroup = (
    <colgroup>
      <col style={{ width: '200px' }} />
      <col />
    </colgroup>
  )

  const selfIntroSection = (
    <section className="instructor-resume-section instructor-resume-section--free-writing">
      <h3 className="instructor-resume-section-title instructor-resume-section-title--free-writing">
        자기소개 및 지원동기
      </h3>
      <div className="instructor-resume-free-writing-card">
        <p className="instructor-resume-free-writing-text">
          {detail?.selfIntroduction?.trim() || '-'}
        </p>
      </div>
    </section>
  )

  const teamSection = showTeamSection ? (
    <section className="applicant-institution-basic-info__section">
      <h3 className="applicant-institution-basic-info__title">팀 정보</h3>
      <div className="applicant-institution-basic-info__table-wrap">
        <table className="applicant-institution-basic-info__table">
          {colgroup}
          <tbody>
            <TableRowFullWidth
              label="팀 명 및 인원"
              value={
                isEditMode ? (
                  teamNameAndMemberEditCell
                ) : (
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider([
                      detail?.teamName?.trim() || '-',
                      formatTeamMemberCountDisplay(detail),
                    ])}
                  </ProgramDetailTdSegmentWrap>
                )
              }
            />
            <TableRowFullWidth
              label="역할"
              value={
                detail?.teamRole ? (
                  <GeneralIndividualTeamRoleDropdown
                    applicantId={applicant.id}
                    teamRole={detail.teamRole}
                  />
                ) : (
                  '-'
                )
              }
            />
          </tbody>
        </table>
      </div>
    </section>
  ) : null

  const preferredScheduleSection = showPreferredScheduleSection ? (
    <section className="applicant-institution-basic-info__section">
      <h3 className="applicant-institution-basic-info__title">진행 희망 교육 일정</h3>
      <div className="applicant-institution-basic-info__table-wrap">
        <table className="applicant-institution-basic-info__table">
          {scheduleColgroup}
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  등록된 교육 일정이 없습니다.
                </td>
              </tr>
            ) : (
              sessions.map((session, index) => (
                <PreferredScheduleRow
                  key={session.round}
                  rank={index + 1}
                  session={session}
                  bridge={institutionApplicationBridge}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  ) : null

  const progressScheduleSection =
    showProgressScheduleSection && program ? (
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">교육 진행 일정</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {scheduleColgroup}
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                  >
                    등록된 교육 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map((session, index) => (
                  <ParticipatingProgressScheduleRow
                    key={`${session.round}-${session.date}-${index}`}
                    rowLabel={resolveParticipatingInstitutionScheduleRowLabel(program, session)}
                    session={session}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    ) : null

  const programProgressStatusCell =
    program != null ? (
      <ProgramEnrollmentStatusText status={getProgramProgressDisplayStatus(program)} />
    ) : (
      '-'
    )

  const isScreeningStage = screeningStage !== 'main'

  if (isScreeningStage) {
    return (
      <div className="general-volunteer-applicant-detail__body applicant-info-section">
        <IndividualApplicantScreeningBasicInfo
          applicant={applicant}
          maskSensitive={maskSensitive}
          onResendNotificationClick={onResendNotificationClick}
        />

        {showManagerEvaluation &&
        setOpenManagerDropdown &&
        onManagerAEvaluationChange &&
        onManagerBEvaluationChange ? (
          <IndividualApplicantManagerEvaluationSection
            applicant={applicant}
            openManagerDropdown={openManagerDropdown}
            setOpenManagerDropdown={setOpenManagerDropdown}
            onManagerAEvaluationChange={onManagerAEvaluationChange}
            onManagerBEvaluationChange={onManagerBEvaluationChange}
          />
        ) : null}

        {showInterviewAvailability ? (
          <IndividualApplicantInterviewAvailabilitySection
            interviewAvailability={detail?.interviewAvailability ?? []}
          />
        ) : null}

        {showInterviewEvaluation ? (
          <IndividualApplicantInterviewEvaluationSection applicant={applicant} />
        ) : null}

        <IndividualApplicantScreeningSelfIntroSection selfIntroduction={detail?.selfIntroduction} />

        {showTeamSection ? (
          <IndividualApplicantScreeningTeamSection applicant={applicant} detail={detail} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="general-volunteer-applicant-detail__body applicant-institution-basic-info">
      {validationErrors?.form ? (
        <div className="institution-basic-info__field-error">{validationErrors.form}</div>
      ) : null}
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={
            isAdminCommentEditing
              ? adminCommentDraft
              : isEditMode && draft
                ? draft.adminComment
                : applicant.adminComment
          }
          mode={isAdminCommentEditing || isEditMode ? 'edit' : 'view'}
          draftValue={isAdminCommentEditing ? adminCommentDraft : (draft?.adminComment ?? '')}
          onDraftChange={
            isAdminCommentEditing && onAdminCommentDraftChange
              ? onAdminCommentDraftChange
              : isEditMode && onDraftChange
                ? value => onDraftChange({ adminComment: value })
                : undefined
          }
          validationError={validationErrors?.adminComment}
        />
      ) : null}

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
                <TableRowFullWidth
                  label={isProgressContext ? '프로그램 진행 현황' : '프로그램 승인 현황'}
                  value={
                    isProgressContext ? (
                      programProgressStatusCell
                    ) : (
                      <ProgramApprovalStatusValue
                        applicant={applicant}
                        onResendNotificationClick={onResendNotificationClick}
                      />
                    )
                  }
                />
                {showTextbookField ? (
                  <TableRowFullWidth label="교재명" value={textbookEditValue} />
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
                <TableRowTwoCols
                  label1="성명"
                  value1={nameCell}
                  label2="성별 및 생년월일"
                  value2={
                    <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>
                  }
                />
                <TableRowTwoCols
                  label1="학교 재학 여부"
                  value1={detail?.schoolEnrollmentStatus ?? '-'}
                  label2="소속"
                  value2={affiliationDisplay}
                />
                <TableRowTwoCols
                  label1="연락처"
                  value1={contactDisplay}
                  label2="이메일"
                  value2={emailDisplay}
                />
                <TableRowTwoCols
                  label1="자택 주소지"
                  value1={homeAddressDisplay}
                  label2="1365 ID"
                  value2={id1365Cell}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selfIntroSection}
      {teamSection}
      {preferredScheduleSection}
      {progressScheduleSection}
    </div>
  )
}
