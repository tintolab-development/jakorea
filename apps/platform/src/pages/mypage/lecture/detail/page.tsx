import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInProgressDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  educationApplicationDetailPath,
  EducationApplicationContent,
  EducationApplicationInfoModal,
  resolvePreferredEducationScheduleDisplayLabel,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationInProgressNoticePanel,
  EducationSchedulePanel,
  EducationSettlementPanel,
  EducationSurveySection,
  DocumentPassBanner,
  isInstructorRoleApplication,
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
  lectureApplicationDetailPath,
  MYPAGE_LECTURE_PATH,
  resolveEducationScheduleTabLabel,
  shouldShowDocumentPassBanner,
  useCancelMyProgramApplicationMutation,
  useMyProgramApplicationDetail,
  usePortalMeFormBindingRender,
  useMypageMember,
  EducationApplicationDetailLoading,
  type EducationActivitySection,
  type EducationDisplayStatus,
  type ProgramApplicationType,
} from '@/features/mypage'
import {
  instructorAvailableScheduleHasSubmittedSelection,
  readInstructorScheduleBindingSlotsFromFormDocument,
  resolveInstructorAvailableScheduleLines,
} from '@/features/mypage/education/applications/lib/instructor-available-schedule-from-answers'
import { resolveGeminiOfficialDocumentFromAnswers } from '@/features/mypage/education/applications/lib/official-document-from-answers'
import { LectureReportPanel } from '@/features/mypage/education/schedules/ui/lecture-report-panel'
import { InstructorAssignmentPanel } from '@/features/mypage/education/schedules/ui/instructor-assignment-panel'
import { useLectureReportAssignmentsQuery } from '@/features/mypage/education/schedules/api/use-lecture-report-assignments-query'
import { supportsInstructorInstitutionAssignment } from '@/features/mypage/education/schedules/lib/instructor-assignment-support'
import { programDetailToPreferredScheduleLookup } from '@/features/mypage/education/applications/lib/teacher-preferred-schedules'
import {
  canWriteEducationNotice,
  resolveEducationNoticeAuthorDisplayName,
} from '@/features/mypage/education/notices'
import { resolveLectureListBackPath } from '@/features/mypage/lecture'
import { EducationProgramInfoModal } from '@/features/mypage/education/notices/ui/program-info-modal'
import { isGeminiTrainingProgram } from '@/features/program/lib/is-gemini-training'
import { ProgramInfoBody, useProgramDetail } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { PFButton, PFTabs, PFText } from '@/shared/ui'
import styles from '../../education/detail/page.module.css'

type AppliedSection = 'program' | 'application'
type DetailSection = AppliedSection | EducationActivitySection

const PROGRAM_APPLICATION_STATUSES = new Set<EducationDisplayStatus>([
  'waiting_result',
  'document_passed',
  'rejected',
])

const ACTIVITY_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

const APPLIED_SECTION_TAB_ITEMS = [
  { key: 'program', label: '프로그램 정보' },
  { key: 'application', label: '신청 내용' },
] as const

function isAppliedSection(value: string): value is AppliedSection {
  return value === 'program' || value === 'application'
}

function isActivitySection(value: string): value is EducationActivitySection {
  return (
    value === 'notice' ||
    value === 'schedule' ||
    value === 'lecture-report' ||
    value === 'survey' ||
    value === 'satisfaction' ||
    value === 'settlement'
  )
}

function readActivitySection(
  search: string,
  allowed: readonly EducationActivitySection[],
  fallback: EducationActivitySection,
): EducationActivitySection {
  const value = new URLSearchParams(search).get('section')
  if (value && isActivitySection(value) && allowed.includes(value)) return value
  return fallback
}

function readSection(search = window.location.search): DetailSection {
  const value = new URLSearchParams(search).get('section')
  if (value && isActivitySection(value)) return value
  if (value === 'application') return 'application'
  return 'program'
}

function readLectureApplicationType(value: string | undefined): ProgramApplicationType | null {
  return value === 'INSTRUCTOR' ? 'INSTRUCTOR' : null
}

function buildDetailPath(
  applicationId: string,
  section: DetailSection,
  applicationType?: ProgramApplicationType,
) {
  const base = lectureApplicationDetailPath(applicationId, applicationType)
  if (section === 'program') return base
  return `${base}?section=${section}`
}

export function MypageLectureDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const routeApplicationType = readLectureApplicationType(applicationType)
  const remoteDetailEnabled = isRemoteApiConfigured() && routeApplicationType != null
  const [isAuthReady, setIsAuthReady] = useState(false)
  const section = readSection(location.search)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isProgramInfoOpen, setIsProgramInfoOpen] = useState(false)
  const [isApplicationInfoOpen, setIsApplicationInfoOpen] = useState(false)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const cancelMutation = useCancelMyProgramApplicationMutation()
  const member = useMypageMember()
  const noticeWriteAuthorDisplayName = resolveEducationNoticeAuthorDisplayName(
    member.displayName,
    'instructor',
  )

  const remoteApplicationQuery = useMyProgramApplicationDetail(routeApplicationType, applicationId)
  const application = remoteDetailEnabled ? remoteApplicationQuery.application : undefined
  const formBindingRenderQuery = usePortalMeFormBindingRender(
    application?.programId,
    application?.formBindingId,
  )
  const remoteProgramQuery = useProgramDetail(
    application?.programId ?? null,
    { fresh: true },
  )
  const remoteProgram = remoteProgramQuery.program
  const program = useMemo(() => {
    if (!remoteProgram) return undefined
    const applicationProgram = application?.programConfig
    if (!applicationProgram) return remoteProgram
    return {
      ...remoteProgram,
      surveyConfigured: applicationProgram.surveyConfigured ?? remoteProgram.surveyConfigured,
      satisfactionConfigured:
        applicationProgram.satisfactionConfigured ?? remoteProgram.satisfactionConfigured,
    }
  }, [application?.programConfig, remoteProgram])
  const isApplicationLoading = remoteDetailEnabled && remoteApplicationQuery.isLoading
  const isProgramLoading = remoteDetailEnabled
    ? remoteApplicationQuery.isLoading || remoteProgramQuery.isLoading
    : false
  const isFormBindingLoading =
    Boolean(application?.formBindingId) && formBindingRenderQuery.isLoading
  const isDetailLoading =
    !isAuthReady ||
    isChecking ||
    isRedirecting ||
    isApplicationLoading ||
    isFormBindingLoading ||
    (Boolean(application) && isProgramLoading && !program)

  const isWithdrawnBefore = application ? isWithdrawnBeforeEducation(application) : false
  const isWithdrawnDuring = application ? isWithdrawnDuringEducation(application) : false
  const isProgramApplicationStatus = application
    ? PROGRAM_APPLICATION_STATUSES.has(application.displayStatus) || isWithdrawnBefore
    : false
  const isActivityStatus = application
    ? ACTIVITY_STATUSES.has(application.displayStatus)
    : false
  const isGeminiProgram = isGeminiTrainingProgram(program)
  const institutionAssignmentProgram = supportsInstructorInstitutionAssignment(program?.programType)

  const instructorAssignmentQuery = useLectureReportAssignmentsQuery(
    program?.id,
    routeApplicationType === 'INSTRUCTOR' &&
      (isActivityStatus || isWithdrawnDuring) &&
      (institutionAssignmentProgram || isGeminiProgram),
  )
  const instructorAssignmentVisible =
    isGeminiProgram || (institutionAssignmentProgram && instructorAssignmentQuery.hasAssignment)

  const activityTabOptions = useMemo(
    () =>
      program
        ? {
            detailCase: program.detailCase,
            programType: program.programType,
            surveyConfigured: program.surveyConfigured,
            satisfactionConfigured: program.satisfactionConfigured,
            lectureReportVisible: routeApplicationType === 'INSTRUCTOR' && !isGeminiProgram,
            instructorAssignmentVisible,
            geminiInstructorActivityTabs: isGeminiProgram,
          }
        : null,
    [instructorAssignmentVisible, isGeminiProgram, program, routeApplicationType],
  )

  const inProgressTabItems = useMemo(
    () => (activityTabOptions ? buildInProgressDetailTabItems(activityTabOptions) : []),
    [activityTabOptions],
  )
  const withdrawnDuringTabItems = useMemo(
    () => (activityTabOptions ? buildWithdrawnDuringDetailTabItems(activityTabOptions) : []),
    [activityTabOptions],
  )

  const inProgressKeys = useMemo(
    () => inProgressTabItems.map(item => item.key),
    [inProgressTabItems],
  )
  const withdrawnDuringKeys = useMemo(
    () => withdrawnDuringTabItems.map(item => item.key),
    [withdrawnDuringTabItems],
  )

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(
        resolveLoginRequiredPath(
          `${lectureApplicationDetailPath(applicationId || 'unknown', routeApplicationType ?? undefined)}${location.search}`,
        ),
      )
      return
    }

    setIsAuthReady(true)
  }, [applicationId, location.search, navigate, routeApplicationType])

  useEffect(() => {
    if (application && !isInstructorRoleApplication(application)) {
      navigate(`${educationApplicationDetailPath(application.id, application.applicationType)}${location.search}`, {
        replace: true,
      })
    }
  }, [application, location.search, navigate])

  const handleBack = () => {
    navigate(resolveLectureListBackPath(location.state), { replace: true })
  }

  const handleSectionChange = (next: string) => {
    let nextSection: DetailSection
    if (isWithdrawnDuring) {
      nextSection = readActivitySection(
        `?section=${next}`,
        withdrawnDuringKeys,
        withdrawnDuringKeys[0] ?? 'schedule',
      )
    } else if (isActivityStatus) {
      nextSection = readActivitySection(
        `?section=${next}`,
        inProgressKeys,
        inProgressKeys[0] ?? 'notice',
      )
    } else {
      nextSection = next === 'application' ? 'application' : 'program'
    }
    const nextPath = buildDetailPath(applicationId, nextSection, application?.applicationType)
    const nextUrl = new URL(nextPath, window.location.origin)
    const nextParams = new URLSearchParams(location.search)
    if (nextSection === 'program') nextParams.delete('section')
    else nextParams.set('section', nextSection)
    nextUrl.search = nextParams.toString()
    navigate(`${nextUrl.pathname}${nextUrl.search}`)
  }

  const handleConfirmCancel = () => {
    if (remoteDetailEnabled && application?.applicationType) {
      if (cancelMutation.isPending) return
      cancelMutation.mutate(
        {
          applicationType: application.applicationType,
          applicationId: application.id,
          programId: application.programId,
        },
        {
          onSuccess: () => {
            setIsCancelConfirmOpen(false)
            navigate(MYPAGE_LECTURE_PATH, { replace: true })
          },
        },
      )
      return
    }
    setIsCancelConfirmOpen(false)
    navigate(MYPAGE_LECTURE_PATH, { replace: true })
  }

  const instructorScheduleBindingSlots = useMemo(
    () => readInstructorScheduleBindingSlotsFromFormDocument(formBindingRenderQuery.document),
    [formBindingRenderQuery.document],
  )
  const instructorAvailableScheduleLines = useMemo(
    () =>
      resolveInstructorAvailableScheduleLines({
        answers: application?.applicationAnswers,
        preferredEducationScheduleLabel: application?.preferredEducationScheduleLabel,
        preferredScheduleOptionValues: application?.preferredScheduleOptionValues,
        preferredScheduleBlocks: application?.preferredScheduleBlocks,
        program: programDetailToPreferredScheduleLookup(program),
        bindingSlots: instructorScheduleBindingSlots,
      }),
    [
      application?.applicationAnswers,
      application?.preferredEducationScheduleLabel,
      application?.preferredScheduleOptionValues,
      application?.preferredScheduleBlocks,
      instructorScheduleBindingSlots,
      program,
    ],
  )
  const instructorAvailableScheduleUnresolved =
    instructorAvailableScheduleLines.length === 0 &&
    instructorAvailableScheduleHasSubmittedSelection({
      answers: application?.applicationAnswers,
      preferredEducationScheduleLabel: application?.preferredEducationScheduleLabel,
      preferredScheduleOptionValues: application?.preferredScheduleOptionValues,
    })
  const geminiOfficialDocument = useMemo(
    () =>
      isGeminiProgram
        ? resolveGeminiOfficialDocumentFromAnswers(application?.applicationAnswers)
        : null,
    [application?.applicationAnswers, isGeminiProgram],
  )

  if (isDetailLoading) {
    return (
      <EducationApplicationDetailLoading
        backLabel="강의현황"
        onBack={handleBack}
      />
    )
  }

  if (remoteDetailEnabled && remoteApplicationQuery.isError) {
    return (
      <section className={styles.page}>
        <EducationDetailBack label="강의현황" onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          신청 내용을 불러오지 못했습니다
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_LECTURE_PATH)}>
          강의현황으로
        </PFButton>
      </section>
    )
  }

  if (!application || !isInstructorRoleApplication(application)) {
    return (
      <section className={styles.page}>
        <EducationDetailBack label="강의현황" onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          신청 정보를 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_LECTURE_PATH)}>
          강의현황으로
        </PFButton>
      </section>
    )
  }

  if (!program) {
    return (
      <section className={styles.page}>
        <EducationDetailBack label="강의현황" onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          프로그램을 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_LECTURE_PATH)}>
          강의현황으로
        </PFButton>
      </section>
    )
  }

  const showBanner = shouldShowDocumentPassBanner(application)
  const showCancelCta =
    application.cancellable ?? canCancelEducationApplication(application.displayStatus)
  const appliedSection = isAppliedSection(section) ? section : 'program'
  const activitySection = isActivitySection(section)
    ? isWithdrawnDuring
      ? readActivitySection(
          location.search,
          withdrawnDuringKeys,
          withdrawnDuringKeys[0] ?? 'schedule',
        )
      : isActivityStatus
        ? readActivitySection(location.search, inProgressKeys, inProgressKeys[0] ?? 'notice')
        : section
    : isWithdrawnDuring
      ? (withdrawnDuringKeys[0] ?? 'schedule')
      : (inProgressKeys[0] ?? 'notice')

  const preferredEducationScheduleLabel = resolvePreferredEducationScheduleDisplayLabel({
    preferredEducationScheduleLabel: application.preferredEducationScheduleLabel,
    preferredScheduleOptionValues: application.preferredScheduleOptionValues,
    educationScheduleLines: program.educationScheduleLines,
    schedules: program.eventSchedules,
  })

  const renderApplicationOrPlaceholder = () =>
    canShowEducationApplicationContent(application.displayStatus) ? (
      <EducationApplicationContent
        selfIntroMotivation={application.selfIntroMotivation}
        preferredEducationScheduleLabel={preferredEducationScheduleLabel}
        instructorAvailableScheduleLines={instructorAvailableScheduleLines}
        instructorAvailableScheduleUnresolved={instructorAvailableScheduleUnresolved}
        availableScheduleTitle={isGeminiProgram ? '강의 가능 일정' : undefined}
        officialDocument={geminiOfficialDocument}
      />
    ) : (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        신청 내용 화면은 준비 중입니다.
      </PFText>
    )

  const renderActivityBody = (active: EducationActivitySection) => {
    if (active === 'notice' && isActivityStatus) {
      return (
        <EducationInProgressNoticePanel
          program={program}
          selfIntroMotivation={application.selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
          instructorAvailableScheduleLines={instructorAvailableScheduleLines}
          instructorAvailableScheduleUnresolved={instructorAvailableScheduleUnresolved}
          availableScheduleTitle={isGeminiProgram ? '강의 가능 일정' : undefined}
          officialDocument={geminiOfficialDocument}
          applicationType={routeApplicationType}
          applicationId={application.id}
          noticeWriteEnabled={canWriteEducationNotice(member.profile, application.displayStatus)}
          noticeWriteAuthorDisplayName={noticeWriteAuthorDisplayName}
        />
      )
    }
    if (active === 'schedule') {
      if (instructorAssignmentVisible) {
        return (
          <InstructorAssignmentPanel
            items={instructorAssignmentQuery.items}
            hideWaitingList={isGeminiProgram}
          />
        )
      }
      return (
        <EducationSchedulePanel
          applicationType={routeApplicationType}
          applicationId={application.id}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
          listTitle={resolveEducationScheduleTabLabel(program.detailCase)}
        />
      )
    }
    if (active === 'lecture-report' && routeApplicationType === 'INSTRUCTOR') {
      return <LectureReportPanel key={`lecture-report-${applicationId}-${program.id}`} applicationId={applicationId} programId={Number(program.id)} instructorProgram={program.programAudience === 'organization'} />
    }
    if (active === 'survey') {
      return (
        <EducationSurveySection
          kind="survey"
          displayStatus={application.displayStatus}
          withdrawalPhase={application.withdrawalPhase}
          configured={program.surveyConfigured}
          remoteDetailEnabled={remoteDetailEnabled}
          programTitle={program.title}
          educationScheduleLines={program.educationScheduleLines}
          educationTargetLabel={program.educationTargetDetailLabel}
          applicationType={routeApplicationType}
          applicationId={application.id}
          programId={program.id}
          pendingSurveyCount={application.pendingSurveyCount}
        />
      )
    }
    if (active === 'satisfaction') {
      return (
        <EducationSurveySection
          kind="satisfaction"
          satisfactionAudience="teacher"
          displayStatus={application.displayStatus}
          withdrawalPhase={application.withdrawalPhase}
          configured={program.satisfactionConfigured}
          remoteDetailEnabled={remoteDetailEnabled}
          programTitle={program.title}
          educationScheduleLines={program.educationScheduleLines}
          educationTargetLabel={program.educationTargetDetailLabel}
          applicationType={routeApplicationType}
          applicationId={application.id}
          programId={program.id}
        />
      )
    }
    if (active === 'settlement') {
      return (
        <EducationSettlementPanel
          programId={program.id}
          applicationType={routeApplicationType}
          applicationId={application.id}
          operationEndAt={program.operatingPeriodEnd}
          programType={program.programType}
          detailCase={program.detailCase}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
        />
      )
    }
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        준비 중입니다.
      </PFText>
    )
  }

  return (
    <section className={styles.page}>
      <EducationDetailBack label="강의현황" onClick={handleBack} />

      <EducationDetailHeader
        title={program.title}
        displayStatus={application.displayStatus}
        educationTargetLabel={program.educationTargetLabel}
        educationForm={program.educationForm}
        educationFormLabel={program.educationFormLabel}
      />
      {isGeminiProgram && isActivityStatus ? (
        <div className={styles.headerActions}>
          <PFButton variant="text" onClick={() => setIsProgramInfoOpen(true)}>
            프로그램 정보
          </PFButton>
          <span className={styles.actionDivider} aria-hidden="true" />
          <PFButton variant="text" onClick={() => setIsApplicationInfoOpen(true)}>
            신청 정보
          </PFButton>
        </div>
      ) : null}

      {showBanner ? (
        <DocumentPassBanner interviewAtLabel={application.interviewAtLabel} />
      ) : null}

      {isProgramApplicationStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={[...APPLIED_SECTION_TAB_ITEMS]}
            value={appliedSection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="강의현황 상세 탭"
          />

          {appliedSection === 'program' ? (
            <ProgramInfoBody
              program={program}
              showPeriodSponsor
              showApplyCta={false}
              showCancelCta={showCancelCta}
              onCancel={() => setIsCancelConfirmOpen(true)}
            />
          ) : (
            renderApplicationOrPlaceholder()
          )}
        </>
      ) : isWithdrawnDuring ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={withdrawnDuringTabItems}
            value={activitySection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="활동 포기 강의 상세 탭"
          />
          <div className={styles.tabPanelBody}>{renderActivityBody(activitySection)}</div>
        </>
      ) : isActivityStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={inProgressTabItems}
            value={activitySection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="진행중 강의 상세 탭"
          />
          <div className={styles.tabPanelBody}>{renderActivityBody(activitySection)}</div>
        </>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
          해당 진행 상태의 상세 탭은 준비 중입니다.
        </PFText>
      )}

      <EducationProgramInfoModal
        open={isProgramInfoOpen}
        program={program}
        onClose={() => setIsProgramInfoOpen(false)}
      />
      <EducationApplicationInfoModal
        open={isApplicationInfoOpen}
        selfIntroMotivation={application.selfIntroMotivation}
        preferredEducationScheduleLabel={preferredEducationScheduleLabel}
        instructorAvailableScheduleLines={instructorAvailableScheduleLines}
        instructorAvailableScheduleUnresolved={instructorAvailableScheduleUnresolved}
        availableScheduleTitle={isGeminiProgram ? '강의 가능 일정' : undefined}
        officialDocument={geminiOfficialDocument}
        onClose={() => setIsApplicationInfoOpen(false)}
      />

      <EducationCancelConfirm
        open={isCancelConfirmOpen}
        onCancel={() => {
          if (cancelMutation.isPending) return
          cancelMutation.reset()
          setIsCancelConfirmOpen(false)
        }}
        onConfirm={handleConfirmCancel}
        pending={cancelMutation.isPending}
        error={cancelMutation.error}
      />

    </section>
  )
}
