/**
 * 일반 프로그램 참여자 모집 — 사용자 본 화면 전체화면 뷰 (개발·검수용)
 *
 * 예: /preview/programs/general/general-prog-type-org-curriculum-single/participant-recruitment
 */

import { Spin } from 'antd'
import { Navigate, useParams } from 'react-router-dom'
import { useGeneralProgramDetail } from '@/features/program/general/hooks/use-general-program-detail'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'
import { ParticipantRecruitmentUserPage } from '@/features/program/general/ui/user-preview'
import './participant-recruitment-user-full-page.css'

export default function ParticipantRecruitmentUserFullPage() {
  const { programId } = useParams<{ programId: string }>()
  const resolvedProgramId = programId?.trim()

  const { program, loading, sponsorName } = useGeneralProgramDetail(resolvedProgramId ?? '', {
    enabled: Boolean(resolvedProgramId),
  })

  if (!resolvedProgramId) {
    return (
      <Navigate
        to={`/preview/programs/general/${GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID}/participant-recruitment`}
        replace
      />
    )
  }

  if (loading && !program) {
    return (
      <div className="participant-recruitment-user-full-page participant-recruitment-user-full-page--loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="participant-recruitment-user-full-page participant-recruitment-user-full-page--error">
        <p>프로그램을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="participant-recruitment-user-full-page">
      <div className="participant-recruitment-user-full-page__canvas">
        <ParticipantRecruitmentUserPage
          program={program}
          sponsorName={sponsorName}
          layoutMode="fullscreen"
        />
      </div>
    </div>
  )
}
