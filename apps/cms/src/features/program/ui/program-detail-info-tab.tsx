/**
 * 프로그램 상세 정보 탭 (관리자 상세 페이지)
 * 3개 섹션 컴포넌트를 조합하는 컨테이너
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { Card } from 'antd'
import { BasicInfoSection } from './basic-info-section'
import { DetailInfoSection } from './detail-info-section'
import { CurriculumSection } from './curriculum-section'
import './program-detail-info-tab.css'

export interface ProgramDetailInfoTabProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus | null
  onLifecycleStatusChange?: (status: ProgramLifecycleStatus) => void
}

export function ProgramDetailInfoTab({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus: lifecycleStatusProp,
  onLifecycleStatusChange,
}: ProgramDetailInfoTabProps) {
  const lifecycleStatus = lifecycleStatusProp ?? program.lifecycleStatus ?? undefined

  return (
    <div className="program-detail-info-tab">
      <Card className="program-detail-info-tab__card" bordered={false}>
        <BasicInfoSection
          program={program}
          sponsorName={sponsorName}
          createdByName={createdByName}
          updatedByName={updatedByName}
          lifecycleStatus={lifecycleStatus}
          onLifecycleStatusChange={onLifecycleStatusChange}
        />
        <DetailInfoSection program={program} />
        <CurriculumSection program={program} />
      </Card>
    </div>
  )
}
