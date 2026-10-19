/**
 * 일반 프로그램 — 개인 유형 참여자 신청 상세
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsInput, CmsNumericInput, CmsSelect } from '@/shared/ui'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import type {
  GeneralIndividualApplicantDetail,
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import type { ApplicantIndividualEditDraft } from '@/features/program/general/lib/applicant-individual-detail-edit'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import {
  TEXTBOOK_NOT_USED_OPTION_VALUE,
  resolveIndividualApplicantTextbookDisplay,
} from '@/features/program/general/lib/individual-applicant-textbook'
import { useIndividualApplicantTextbookOptions } from '@/features/textbook/hooks/use-individual-applicant-textbook-options'
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
import { ParticipatingProgressScheduleValue } from '@/features/program/general/ui/detail-modal/program-status/participating-progress-schedule-row'
import '@/features/program/general/ui/detail-modal/program-status/participating-institution-application-info.css'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { renderIndividualApplicantNameWithHistoryBadges } from '@/features/program/general/lib/individual-application-name-change-count'
import { ApplicantPreferredScheduleDetailSection } from './applicant-preferred-schedule-detail-section'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  displayServerPiiAsIs,
  HomeAddressDisplay,
} from '@/features/program/shared/lib/program-pii-display'
import { IndividualApplicantInterviewAvailabilitySection } from './individual-applicant-interview-availability'
import { IndividualApplicantInterviewEvaluationSection } from './individual-interview-evaluation-section'
import {
  IndividualApplicantId1365Cell,
  IndividualApplicantManagerEvaluationSection,
} from './individual-screening-sections'
import {
  GeneralIndividualTeamRoleDropdown,
  GeneralIndividualTeamRoleView,
} from './individual-team-role-dropdown'
import { openPortal1365Main } from '@/shared/constants/external-urls'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/user/detail/ui/instructor-resume/resume.css'
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
  openManagerDropdown?: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown?: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange?: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange?: (id: string, evaluation: GeneralManagerEvaluation) => void
  onTeamRoleChange?: (
    teamRole: NonNullable<GeneralIndividualApplicantDetail['teamRole']>
  ) => void | Promise<void>
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
  const shouldMask = maskSensitive && applicant.privacyMaskingLevel == null

  const nameCell = renderIndividualApplicantNameWithHistoryBadges({
    applicantName: applicant.applicantName,
    detail,
    badgeClassName: 'applicant-instructor-basic-info__name-badge',
  })

  const genderBirthDisplay = withProgramDetailTdDivider([
    toDisplayGender(detail?.gender),
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

  const contactDisplay = displayServerPiiAsIs(detail?.contact)

  const emailDisplay = displayServerPiiAsIs(detail?.email)

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
      </DetailInfoForm>
      <DetailInfoForm title="기본 정보" hideHeader mode="view">
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
  onTeamRoleChange,
}: {
  applicant: GeneralIndividualApplicantRow
  detail?: GeneralIndividualApplicantDetail
  onTeamRoleChange?: (
    teamRole: NonNullable<GeneralIndividualApplicantDetail['teamRole']>
  ) => void | Promise<void>
}) {
  return (
    <DetailInfoForm title="팀 정보" mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="팀 명 및 팀원"
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
            detail?.teamRole
              ? onTeamRoleChange != null
                ? (
                    <GeneralIndividualTeamRoleDropdown
                      applicantId={applicant.id}
                      teamRole={detail.teamRole}
                      canEdit
                      onChange={onTeamRoleChange}
                    />
                  )
                : <GeneralIndividualTeamRoleView teamRole={detail.teamRole} />
              : '-'
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

function IndividualApplicantProgressScheduleSection({
  program,
  sessions,
}: {
  program: Program
  sessions: readonly ParticipatingSchoolSession[]
}) {
  return (
    <DetailInfoForm title="교육 진행 일정" mode="view">
      {sessions.length === 0 ? (
        <DetailInfoForm.Row type="custom">
          <p className="general-volunteer-applicant-detail__empty-schedule">
            등록된 교육 일정이 없습니다.
          </p>
        </DetailInfoForm.Row>
      ) : (
        sessions.map((session, index) => (
          <DetailInfoForm.Row type="single" key={`${session.round}-${session.date}-${index}`}>
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
  openManagerDropdown = null,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
  onTeamRoleChange,
}: ApplicantGeneralIndividualBasicInfoProps) {
  const detail = applicant.detail
  const isProgressContext = detailContext === 'progress'
  const shouldMask = maskSensitive && applicant.privacyMaskingLevel == null
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const showAdminComment = isProgressContext || applicant.approvalStatus === 'approved'
  const applicantEducationGrade =
    applicant.educationGrade?.trim() || detail?.affiliationGrade?.trim() || ''
  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useIndividualApplicantTextbookOptions(program, applicantEducationGrade || undefined)
  /** 승인 완료 후에만 교재명 노출. 미지정은 「해당 없음」 */
  const showTextbookField =
    screeningStage === 'main' && applicant.approvalStatus === 'approved'

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

  const nameCell = renderIndividualApplicantNameWithHistoryBadges({
    applicantName: applicant.applicantName,
    detail,
    badgeClassName: 'applicant-instructor-basic-info__name-badge',
  })

  const genderBirthDisplay = withProgramDetailTdDivider([
    toDisplayGender(detail?.gender),
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

  const contactDisplay = displayServerPiiAsIs(detail?.contact)

  const emailDisplay = displayServerPiiAsIs(detail?.email)

  const homeAddressDisplay = (
    <HomeAddressDisplay
      address={detail?.homeAddressFull ?? applicant.homeAddress}
      mask={shouldMask}
    />
  )

  const id1365Raw = detail?.id1365?.trim()
  const id1365Cell = !id1365Raw
    ? '-'
    : shouldMask
      ? (
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([
              maskId1365(id1365Raw),
              <CmsButton key="1365-link" type="button" size="medium" onClick={openPortal1365Main}>
                1365 바로가기
              </CmsButton>,
            ])}
          </ProgramDetailTdSegmentWrap>
        )
      : <IndividualApplicantId1365Cell id1365={id1365Raw} />

  const textbookDisplay = resolveIndividualApplicantTextbookDisplay(
    program,
    applicant,
    textbookCatalog
  )
  const textbookNotUsedView = <TextbookStatusBadge status="not_applicable" />
  const textbookViewValue = textbookDisplay.isUnspecified ? (
    textbookNotUsedView
  ) : (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider([
        textbookDisplay.name,
        textbookDisplay.kitsLabel,
        textbookDisplay.status ? <TextbookStatusBadge status={textbookDisplay.status} /> : '-',
      ])}
    </ProgramDetailTdSegmentWrap>
  )

  const textbookEditCell =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="small"
          placeholder={isTextbookCatalogLoading ? '교재 목록 불러오는 중…' : '교재명 선택'}
          loading={isTextbookCatalogLoading}
          value={draft.textbookId || TEXTBOOK_NOT_USED_OPTION_VALUE}
          options={(textbookOptions.length > 0
            ? textbookOptions
            : [
                {
                  value: TEXTBOOK_NOT_USED_OPTION_VALUE,
                  label: '해당 없음',
                  textbookName: '해당 없음',
                },
              ]
          ).map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const options =
              textbookOptions.length > 0
                ? textbookOptions
                : [
                    {
                      value: TEXTBOOK_NOT_USED_OPTION_VALUE,
                      label: '해당 없음',
                      textbookName: '해당 없음',
                    },
                  ]
            const selected = options.find(option => option.value === value)
            const isNotUsed = value === TEXTBOOK_NOT_USED_OPTION_VALUE
            onDraftChange({
              textbookId: isNotUsed ? TEXTBOOK_NOT_USED_OPTION_VALUE : String(value ?? ''),
              textbookName: isNotUsed ? '해당 없음' : (selected?.textbookName ?? ''),
              textbookStatus: isNotUsed ? 'not_applicable' : 'preparing',
            })
          }}
        />
        {validationErrors?.textbookId ? (
          <span className="institution-basic-info__field-error">{validationErrors.textbookId}</span>
        ) : null}
      </div>
    ) : undefined

  const teamNameAndMemberEditCell =
    isEditMode && draft && onDraftChange ? (
      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
        <CmsInput
          inputSize="small"
          width="100%"
          style={{ flex: '1 1 0', minWidth: 0 }}
          value={draft.teamName}
          onChange={event => onDraftChange({ teamName: event.target.value })}
        />
        <DetailInfoForm.InputsSeparator />
        <CmsSelect
          inputSize="small"
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
              inputSize="small"
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

  const teamSection = showTeamSection ? (
    <DetailInfoForm title="팀 정보" mode={isEditMode ? 'edit' : 'view'}>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="팀 명 및 팀원"
          fullRow
          readOnlyDisplay={!isEditMode}
          view={
            <ProgramDetailTdSegmentWrap>
              {withProgramDetailTdDivider([
                detail?.teamName?.trim() || '-',
                formatTeamMemberCountDisplay(detail, isEditMode ? draft : undefined),
              ])}
            </ProgramDetailTdSegmentWrap>
          }
          edit={isEditMode ? teamNameAndMemberEditCell : undefined}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="역할"
          fullRow
          readOnlyDisplay
          view={
            detail?.teamRole
              ? onTeamRoleChange != null
                ? (
                    <GeneralIndividualTeamRoleDropdown
                      applicantId={applicant.id}
                      teamRole={detail.teamRole}
                      canEdit
                      onChange={onTeamRoleChange}
                    />
                  )
                : <GeneralIndividualTeamRoleView teamRole={detail.teamRole} />
              : '-'
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  ) : null

  const preferredScheduleSection = showPreferredScheduleSection ? (
    <ApplicantPreferredScheduleDetailSection
      sessions={sessions}
      bridge={institutionApplicationBridge}
    />
  ) : null

  const progressScheduleSection =
    showProgressScheduleSection && program ? (
      <IndividualApplicantProgressScheduleSection program={program} sessions={sessions} />
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
            canEditManagerAEvaluation={applicant.canEditManagerAEvaluation}
            canEditManagerBEvaluation={applicant.canEditManagerBEvaluation}
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
          <IndividualApplicantScreeningTeamSection
            applicant={applicant}
            detail={detail}
            onTeamRoleChange={onTeamRoleChange}
          />
        ) : null}
      </div>
    )
  }

  const basicInfoFormMode = isEditMode ? 'edit' : 'view'

  return (
    <div className="general-volunteer-applicant-detail__body">
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={applicant.adminComment}
          mode="view"
        />
      ) : null}

      <section className="general-volunteer-applicant-basic-info">
        <DetailInfoForm title="기본 정보" mode={basicInfoFormMode}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={isProgressContext ? '프로그램 진행 현황' : '프로그램 승인 현황'}
              fullRow
              readOnlyDisplay
              view={
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
          </DetailInfoForm.Row>
          {!isProgressContext && showTextbookField ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교재명"
                fullRow
                readOnlyDisplay={!isEditMode}
                view={textbookViewValue}
                edit={textbookEditCell}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
        <DetailInfoForm title="기본 정보" hideHeader mode={basicInfoFormMode}>
          {isProgressContext && showTextbookField ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교재명"
                fullRow
                readOnlyDisplay={!isEditMode}
                view={textbookViewValue}
                edit={textbookEditCell}
              />
            </DetailInfoForm.Row>
          ) : null}
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
            <DetailInfoForm.Field label="자택 주소지" readOnlyDisplay view={homeAddressDisplay} />
            <DetailInfoForm.Field label="1365 ID" readOnlyDisplay view={id1365Cell} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </section>

      <IndividualApplicantScreeningSelfIntroSection selfIntroduction={detail?.selfIntroduction} />
      {teamSection}
      {preferredScheduleSection}
      {progressScheduleSection}
    </div>
  )
}
