import type { Program } from '@/types/domain'
import { GeneralParticipantApplicationsView } from '../participant-applications-view'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import '../participant-applications.css'

export interface GeneralParticipantApplicationsScreeningViewProps {
  program: Program
  activeTab: string
  listTitle: string
  interviewEnabled: boolean
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
}

/**
 * 참여자/기관 신청 목록 — LNB 면접 2depth(tab)와 본문 라우팅 shell.
 * 면접 단계별 전용 테이블(part_doc_passed 등)은 추후 구현. 현재는 기존 mock 목록 유지.
 */
export function GeneralParticipantApplicationsScreeningView({
  program,
  activeTab: _activeTab,
  listTitle,
  interviewEnabled: _interviewEnabled,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
}: GeneralParticipantApplicationsScreeningViewProps) {
  return (
    <GeneralParticipantApplicationsView
      program={program}
      listTitle={listTitle}
      onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
      onApplicantDetailMetaChange={onApplicantDetailMetaChange}
    />
  )
}
