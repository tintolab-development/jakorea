import type { DateValue } from '@/types'
import {
  type BasicInfoEditState,
  SponsorBasicInfoSection,
} from '@/features/sponsor/ui/sponsor-detail-basic-info'
import { YearlyBusinessPanel } from '@/features/sponsor/ui/panels/yearly-business-panel'
import type { SponsorProgramHistoryRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { Flex } from 'antd'

export interface SponsorDetailPanelProps {
  sponsorId: string
  basicInfo: BasicInfoEditState
  isEditing: boolean
  onChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  onSponsorshipStatusChange: (next: SponsorSponsorshipStatus) => void
  sponsorshipStartDate?: DateValue
  programHistories: SponsorProgramHistoryRow[]
  canWrite: boolean
}

/**
 * 후원사 상세 LNB의 “후원사 상세 정보” 탭 본문(기본 정보 + 연도별 후원금).
 * 담당자는 별도 LNB(`후원사 담당자 정보`)로 분리됨.
 */
export function SponsorDetailPanel({
  sponsorId,
  basicInfo,
  isEditing,
  onChange,
  onSponsorshipStatusChange,
  sponsorshipStartDate,
  programHistories,
  canWrite,
}: SponsorDetailPanelProps) {
  return (
    <Flex vertical gap="large">
      <SponsorBasicInfoSection
        value={basicInfo}
        isEditing={isEditing}
        onChange={onChange}
        onSponsorshipStatusChange={onSponsorshipStatusChange}
        canWrite={canWrite}
      />
      <YearlyBusinessPanel
        sponsorId={sponsorId}
        sponsorshipStartDate={sponsorshipStartDate}
        programHistories={programHistories}
        canWrite={canWrite}
      />
    </Flex>
  )
}
