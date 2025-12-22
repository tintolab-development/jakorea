/**
 * 프로그램 상세 Drawer 컴포넌트
 * Phase 2.1: 사이드 패널로 상세 정보 표시 (기획자 요청)
 * Phase 5.1: 사용자 화면 기반 UI 개선 (공통 UI 원칙 적용)
 */

import { Drawer, Descriptions, Tag, Tabs, Table, Space, Button, Badge, Card, Alert, Typography, Divider } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import {
  getApplicationCountByProgram,
  getConfirmedRounds,
  isApplicationAvailable,
  getApplicationUrl,
} from '../lib/program-helpers'
import { StatusDisplay, SingleCTA, GuideMessage } from '@/shared/ui'
import {
  commonStatusConfig,
  getCommonStatusLabel,
  getCommonStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography


interface ProgramDetailDrawerProps {
  open: boolean
  program: Program | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

const programTypeLabels: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

const programFormatLabels: Record<string, string> = {
  workshop: '워크샵',
  seminar: '세미나',
  course: '과정',
  lecture: '강의',
  other: '기타',
}

export function ProgramDetailDrawer({
  open,
  program,
  onClose,
  onEdit,
  onDelete,
  loading,
}: ProgramDetailDrawerProps) {
  if (!program) return null

        const sponsor = sponsorService.getByIdSync(program.sponsorId)

        // 프로그램별 신청 수 계산
        const applicationCount = getApplicationCountByProgram(program.id)

        // 확정된 일정만 필터링
        const confirmedRounds = getConfirmedRounds(program.rounds)

        // 신청 경로 정보 조회 (V3 Phase 7)
        const applicationPath = program.applicationPathId
          ? applicationPathService.getByIdSync(program.applicationPathId)
          : applicationPathService.getByProgramIdSync(program.id)

        // 신청 가능 여부 및 URL
        const applicationAvailable = isApplicationAvailable(program)
        let applicationUrl: string | undefined
        if (applicationAvailable && applicationPath && applicationPath.isActive) {
          if (applicationPath.pathType === 'google_form' && applicationPath.googleFormUrl) {
            applicationUrl = applicationPath.googleFormUrl
          } else if (applicationPath.pathType === 'internal') {
            applicationUrl = getApplicationUrl(program.id)
          }
        }

  const roundColumns = [
    {
      title: '회차',
      dataIndex: 'roundNumber',
      key: 'roundNumber',
    },
    {
      title: '시작일',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '종료일',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '정원',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity?: number) => capacity || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
      ),
    },
  ]

  return (
    <Drawer
      title={
        <Space>
          <Tag color={domainColorsHex.program.primary} style={{ fontSize: 16, padding: '4px 12px' }}>
            {program.title}
          </Tag>
          <Badge status={program.status === 'active' ? 'success' : 'default'} />
        </Space>
      }
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={onEdit}>
            수정
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '기본 정보',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 프로그램 핵심 정보 영역 */}
                <Card title="프로그램 정보">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="프로그램명">
                      <Text strong>{program.title}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="카테고리">
                      <Space>
                        <Tag color={domainColorsHex.program.primary}>{programTypeLabels[program.type] || program.type}</Tag>
                        <Tag>{programFormatLabels[program.format] || program.format}</Tag>
                      </Space>
                    </Descriptions.Item>
                    {program.description && (
                      <Descriptions.Item label="프로그램 목적/설명">
                        <Paragraph style={{ margin: 0 }}>{program.description}</Paragraph>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="스폰서">
                      <Tag color={domainColorsHex.sponsor.primary}>{sponsor?.name || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="상태">
                      <StatusDisplay
                        status={program.status}
                        statusLabels={commonStatusConfig.labels}
                        statusColors={commonStatusConfig.colors}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="기간">
                      {dayjs(program.startDate).format('YYYY-MM-DD')} ~ {dayjs(program.endDate).format('YYYY-MM-DD')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 대상 및 참여 방식 안내 영역 */}
                <Card title="대상 및 참여 방식">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Paragraph style={{ margin: 0 }}>
                      <Text strong>대상 사용자:</Text> 학교, 학생, 강사
                    </Paragraph>
                    <Paragraph style={{ margin: 0 }}>
                      <Text strong>참여 방식:</Text> 프로그램 유형에 따라 온라인/오프라인/하이브리드로 진행됩니다.
                    </Paragraph>
                    {program.format === 'workshop' || program.format === 'seminar' ? (
                      <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                        이 프로그램은 강사 및 봉사자 참여가 필요할 수 있습니다.
                      </Paragraph>
                    ) : null}
                  </Space>
                </Card>

                {/* 일정 요약 영역 (조건부) */}
                {confirmedRounds.length > 0 && (
                  <Card title="일정 요약">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {confirmedRounds.slice(0, 3).map((round) => (
                        <div key={round.id}>
                          <Text strong>{round.roundNumber}회차</Text>
                          {' - '}
                          <Text type="secondary">
                            {dayjs(round.startDate).format('YYYY-MM-DD')} ~ {dayjs(round.endDate).format('YYYY-MM-DD')}
                          </Text>
                          {round.capacity && (
                            <>
                              {' - '}
                              <Text type="secondary">정원: {round.capacity}명</Text>
                            </>
                          )}
                        </div>
                      ))}
                      {confirmedRounds.length > 3 && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          외 {confirmedRounds.length - 3}개 회차
                        </Text>
                      )}
                    </Space>
                  </Card>
                )}

                {/* 신청 안내 및 상태 영역 (핵심) */}
                <Card title="신청 안내">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Alert
                      message="이 프로그램은 승인제로 운영됩니다."
                      description="신청 후 관리자 승인을 거쳐 참여가 확정됩니다."
                      type="info"
                      showIcon
                    />
                    {applicationAvailable ? (
                      <div>
                        <Paragraph style={{ margin: 0, marginBottom: 8 }}>
                          <Text strong>신청 가능합니다.</Text>
                        </Paragraph>
                        {applicationPath && applicationPath.guideMessage && (
                          <Paragraph style={{ margin: 0, marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                            {applicationPath.guideMessage}
                          </Paragraph>
                        )}
                        {applicationUrl && (
                          <SingleCTA
                            label={applicationPath?.pathType === 'google_form' ? '구글폼으로 신청하기' : '신청하기'}
                            targetUrl={applicationUrl}
                            type="primary"
                          />
                        )}
                      </div>
                    ) : (
                      <Paragraph style={{ margin: 0 }}>
                        <Text type="secondary">현재 신청이 불가능한 상태입니다.</Text>
                      </Paragraph>
                    )}
                    {applicationCount > 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        현재 {applicationCount}개의 신청이 접수되었습니다.
                      </Text>
                    )}
                  </Space>
                </Card>

                {/* 보조 안내 영역 */}
                <Card>
                  <GuideMessage
                    message="신청 전 프로그램 내용을 다시 한 번 확인해주세요. 승인 결과는 마이페이지에서 확인하실 수 있습니다."
                    type="info"
                  />
                </Card>

                <Divider />

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
                      <Descriptions.Item label="정산 규칙 ID">
                        {program.settlementRuleId}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Space>
            ),
          },
          {
            key: 'rounds',
            label: `회차 정보 (${program.rounds.length})`,
            children: (
              <Table
                dataSource={program.rounds}
                columns={roundColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
          },
        ]}
      />
    </Drawer>
  )
}

