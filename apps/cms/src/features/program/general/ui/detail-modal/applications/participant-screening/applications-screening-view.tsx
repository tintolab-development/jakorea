import { useCallback, useMemo } from 'react'
import type { Program } from '@/types/domain'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { ApplicantList } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import { GeneralParticipantApplicationsView } from '../participant-applications-view'
import { GeneralVolunteerDocPassedSection } from '../volunteer-screening/doc-passed-section'
import { GeneralVolunteerInterview2Section } from '../volunteer-screening/interview2-section'
import type { GeneralVolunteerApplicantDetailMeta } from '../volunteer-screening/use-detail'
import { NotifyAnnouncementProvider } from '@/shared/components/notify-announcement-context'
import { resolveRecruitmentFinalAnnouncementAt } from '@/features/program/shared/lib/recruitment-final-announcement'
import '../participant-applications.css'

export type GeneralParticipantApplicationsScreenTab =
  | 'main'
  | 'part_doc1'
  | 'part_doc_passed'
  | 'part_interview2'

export interface GeneralParticipantApplicationsScreeningViewProps {
  program: Program
  activeTab: string
  listTitle: string
  interviewEnabled: boolean
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
}

function resolveParticipantScreenTab(
  activeTab: string,
  interviewEnabled: boolean,
  isIndividual: boolean
): GeneralParticipantApplicationsScreenTab {
  if (!interviewEnabled || !isIndividual) return 'main'
  if (activeTab === 'part_doc_passed' || activeTab === 'part_interview2') return activeTab
  return 'part_doc1'
}

/**
 * 참여자 신청 목록 — LNB 면접 2depth(tab)와 본문 라우팅 shell.
 * 개인·면접 있음: part_doc1 / part_doc_passed / part_interview2.
 * 그 외: 기존 참여자 신청 목록(기관·개인 면접 없음).
 */
export function GeneralParticipantApplicationsScreeningView({
  program,
  activeTab,
  listTitle,
  interviewEnabled,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
}: GeneralParticipantApplicationsScreeningViewProps) {
  const isIndividual = isGeneralIndividualProgram(program)
  const screenTab = resolveParticipantScreenTab(activeTab, interviewEnabled, isIndividual)

  const handleVolunteerMetaForParticipant = useCallback(
    (meta: GeneralVolunteerApplicantDetailMeta | null) => {
      if (!meta) {
        onApplicantDetailMetaChange?.(null)
        return
      }
      onApplicantDetailMetaChange?.({
        title: meta.title,
        breadcrumbLabel: meta.breadcrumbLabel,
        kind: 'individual',
      })
    },
    [onApplicantDetailMetaChange]
  )

  /** 서류 합격·2차 면접 화면 알림 「발표일에 맞춰서」 — 개인 참여자 모집 최종 발표일 */
  const notifyAnnouncementAt = useMemo(
    () => resolveRecruitmentFinalAnnouncementAt(program, 'individual'),
    [program]
  )

  const doc1ListTitle = useMemo(
    () => listTitle || '1차 서류 심사 대상자',
    [listTitle]
  )

  if (screenTab === 'main') {
    return (
      <GeneralParticipantApplicationsView
        program={program}
        listTitle={listTitle}
        onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
        onApplicantDetailMetaChange={onApplicantDetailMetaChange}
      />
    )
  }

  if (screenTab === 'part_doc_passed') {
    return (
      <NotifyAnnouncementProvider announcementAt={notifyAnnouncementAt}>
      <div className="participant-applications">
        <GeneralVolunteerDocPassedSection
          program={program}
          subjectKind="participant"
          onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
          onVolunteerApplicantDetailMetaChange={handleVolunteerMetaForParticipant}
        />
      </div>
      </NotifyAnnouncementProvider>
    )
  }

  if (screenTab === 'part_interview2') {
    return (
      <NotifyAnnouncementProvider announcementAt={notifyAnnouncementAt}>
      <div className="participant-applications">
        <GeneralVolunteerInterview2Section
          program={program}
          programId={program.id}
          subjectKind="participant"
          onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
          onVolunteerApplicantDetailMetaChange={handleVolunteerMetaForParticipant}
        />
      </div>
      </NotifyAnnouncementProvider>
    )
  }

  return (
    <div className="participant-applications">
      <ApplicantList
        menu="individual-applications"
        program={program}
        programId={program.id}
        listTitle={doc1ListTitle}
        detailVariant="general"
        individualScreeningStage="doc1"
        onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
        onApplicantDetailMetaChange={onApplicantDetailMetaChange}
      />
    </div>
  )
}
