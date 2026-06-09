/**
 * 일반 프로그램 > 진행 현황 > 참여자 (개인 대분류)
 * 상세 UI는 별도 스펙 확정 후 교체 — LNB·라우팅 연동용 placeholder
 */

import { Typography } from 'antd'
import './program-status-participating-shared.css'

export interface ParticipatingParticipantsSectionProps {
  programId: string
}

export function ParticipatingParticipantsSection({
  programId: _programId,
}: ParticipatingParticipantsSectionProps) {
  return (
    <div className="program-status-participating program-detail-fullpage-modal__progress-section">
      <Typography.Title level={5}>참여자</Typography.Title>
      <Typography.Text className="program-status-participating__placeholder">
        참여자 목록 및 현황이 표시됩니다.
      </Typography.Text>
    </div>
  )
}
