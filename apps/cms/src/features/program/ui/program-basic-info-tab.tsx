/**
 * 프로그램 기본 정보 탭
 * 프로그램 상세 Drawer의 기본 정보 탭 컴포넌트
 */

import { Space, Card, Descriptions, Typography, Divider, Image } from 'antd'
import type { Program } from '@/types/domain'
import { GuideMessage } from '@/shared/ui'
import dayjs from 'dayjs'
import { ProgramLifecycleWorkflow } from './program-lifecycle-workflow'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { ProgramInfoCard } from './program-info-card'
import { ProgramApplicationCard } from './program-application-card'
import { ProgramScheduleSummaryCard } from './program-schedule-summary-card'

const { Paragraph, Text } = Typography

interface ProgramBasicInfoTabProps {
  program: Program
  sponsorName?: string
  confirmedRounds: Array<{
    id: string
    roundNumber: number
    startDate: string
    endDate: string
    capacity?: number
  }>
  applicationInfo: {
    applicationAvailable: boolean
    unavailableReason: string | null
    applicationUrl?: string
  }
  applicationPath?: {
    id: string
    pathType: 'google_form' | 'internal'
    googleFormUrl?: string
    guideMessage?: string
    isActive: boolean
  }
  remainingCapacity?: number
  capacityFull: boolean
  capacityAlmostFull: boolean
  applicationCount: number
  userHasApplied: boolean
  userRole?: string
  canWrite?: boolean // Phase 0.5.2: 쓰기 권한이 있는 관리자인지 여부
  onApplicationClick: () => void
  onDuplicateAlertOpen: () => void
  statusChangeLoading: boolean
  onStatusChange: (status: ProgramLifecycleStatus) => void
  onRollback: () => void
}

export function ProgramBasicInfoTab({
  program,
  sponsorName,
  confirmedRounds,
  applicationInfo,
  applicationPath,
  remainingCapacity,
  capacityFull,
  capacityAlmostFull,
  applicationCount,
  userHasApplied,
  userRole,
  canWrite = false,
  onApplicationClick,
  onDuplicateAlertOpen,
  statusChangeLoading,
  onStatusChange,
  onRollback,
}: ProgramBasicInfoTabProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* FR-C02: 포스터/키비주얼 이미지 상단 배치 */}
      {program.posterImage ? (
        <Card size="small" style={{ overflow: 'hidden', padding: 0 }}>
          <Image
            src={program.posterImage}
            alt={`${program.title} 포스터`}
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
            preview={{ mask: '확대 보기' }}
          />
        </Card>
      ) : (
        <Card size="small">
          <div
            style={{
              width: '100%',
              height: 160,
              background: '#f5f5f5',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
            }}
          >
            포스터 이미지 없음
          </div>
        </Card>
      )}

      {/* 프로그램 핵심 정보 영역 */}
      <ProgramInfoCard program={program} sponsorName={sponsorName} />

      {/* 대상 및 참여 방식 안내 영역 */}
      <Card title="대상 및 참여 방식">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph style={{ margin: 0 }}>
            <Text strong>대상 사용자:</Text> 학교, 학생, 강사
          </Paragraph>
          <Paragraph style={{ margin: 0 }}>
            <Text strong>참여 방식:</Text> 프로그램 유형에 따라 온라인/오프라인/하이브리드로
            진행됩니다.
          </Paragraph>
          {program.format === 'workshop' || program.format === 'seminar' ? (
            <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
              이 프로그램은 강사 및 봉사자 참여가 필요할 수 있습니다.
            </Paragraph>
          ) : null}
        </Space>
      </Card>

      {/* 일정 요약 영역 (조건부) */}
      <ProgramScheduleSummaryCard
        confirmedRounds={confirmedRounds}
        lifecycleStatus={program.lifecycleStatus}
      />

      {/* 신청 안내 및 상태 영역 (핵심) */}
      <ProgramApplicationCard
        applicationAvailable={applicationInfo.applicationAvailable}
        unavailableReason={applicationInfo.unavailableReason}
        applicationUrl={applicationInfo.applicationUrl}
        applicationPath={applicationPath}
        remainingCapacity={remainingCapacity}
        capacityFull={capacityFull}
        capacityAlmostFull={capacityAlmostFull}
        applicationCount={applicationCount}
        userHasApplied={userHasApplied}
        userRole={userRole}
        isAdmin={userRole === 'ADMIN'} // Phase 0.5.2: 관리자는 신청하기 버튼 숨김
        onApplicationClick={onApplicationClick}
        onDuplicateAlertOpen={onDuplicateAlertOpen}
        applyRedirectPath={
          applicationPath?.pathType === 'internal' ? `/programs/${program.id}/apply` : undefined
        }
      />

      {/* 보조 안내 영역 */}
      <Card>
        <GuideMessage
          message="신청 전 프로그램 내용을 다시 한 번 확인해주세요. 승인 결과는 마이페이지에서 확인하실 수 있습니다."
          type="info"
        />
      </Card>

      <Divider />

      {/* 관리자용: 프로그램 상태 워크플로우 (쓰기 권한이 있는 관리자만) */}
      {/* Phase 0.5.2: GENERAL 관리자는 상태 워크플로우 조정 불가 */}
      {userRole === 'ADMIN' && canWrite && (
        <>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginBottom: 8, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
              <small>
                [디버깅] 권한 체크: userRole={userRole}, canWrite={String(canWrite)},
                hasOnStatusChange={String(!!onStatusChange)}, hasOnRollback={String(!!onRollback)}
              </small>
            </div>
          )}
          <ProgramLifecycleWorkflow
            program={program}
            onStatusChange={onStatusChange}
            onRollback={onRollback}
            loading={statusChangeLoading}
            canWrite={canWrite}
          />
          <Divider />
        </>
      )}

      {/* 관리자용 상세 정보 */}
      <Card title="관리자 정보" size="small">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="등록일">
            {dayjs(program.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {dayjs(program.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {program.settlementRuleId && (
            <Descriptions.Item label="정산 규칙 ID">{program.settlementRuleId}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Space>
  )
}
