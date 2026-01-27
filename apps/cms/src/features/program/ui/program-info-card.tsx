/**
 * 프로그램 정보 카드 컴포넌트
 */

import { Card, Descriptions, Tag, Space, Typography } from 'antd'
import type { Program } from '@/types/domain'
import { StatusDisplay } from '@/shared/ui'
import { commonStatusConfig, programLifecycleStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { domainColorsHex } from '@/shared/constants/colors'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography

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

interface ProgramInfoCardProps {
  program: Program
  sponsorName?: string
}

export function ProgramInfoCard({ program, sponsorName }: ProgramInfoCardProps) {
  return (
    <Card title="프로그램 정보">
      <Descriptions column={1} bordered>
        <Descriptions.Item label="프로그램명">
          <Text strong ellipsis={{ tooltip: program.title }}>
            {program.title}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="카테고리">
          <Space>
            <Tag color={domainColorsHex.program.primary}>
              {programTypeLabels[program.type] || program.type}
            </Tag>
            <Tag>{programFormatLabels[program.format] || program.format}</Tag>
          </Space>
        </Descriptions.Item>
        {program.description && (
          <Descriptions.Item label="프로그램 목적 및 내용">
            <Card size="small" style={{ backgroundColor: '#fafafa', marginTop: 8 }}>
              <Paragraph
                style={{ margin: 0, fontSize: 14, lineHeight: 1.8 }}
                ellipsis={{ rows: 5, expandable: true, symbol: '더보기' }}
              >
                {program.description}
              </Paragraph>
            </Card>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="스폰서">
          <Tag color={domainColorsHex.sponsor.primary}>{sponsorName || '-'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          {program.lifecycleStatus ? (
            <StatusBadge
              status={program.lifecycleStatus}
              statusConfig={programLifecycleStatusStatusConfig}
            />
          ) : (
            <StatusDisplay
              status={program.status}
              statusLabels={commonStatusConfig.labels}
              statusColors={commonStatusConfig.colors}
            />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="기간">
          {dayjs(program.startDate).format('YYYY-MM-DD')} ~{' '}
          {dayjs(program.endDate).format('YYYY-MM-DD')}
        </Descriptions.Item>
        {program.oneLineIntroduction && (
          <Descriptions.Item label="한 줄 소개">
            <Text>{program.oneLineIntroduction}</Text>
          </Descriptions.Item>
        )}
        {program.venue && (
          <Descriptions.Item label="진행 장소">
            <Text>{program.venue}</Text>
          </Descriptions.Item>
        )}
        {program.curriculum && (
          <Descriptions.Item label="커리큘럼">
            <Paragraph
              style={{ margin: 0, fontSize: 14, lineHeight: 1.8 }}
              ellipsis={{ rows: 5, expandable: true, symbol: '더보기' }}
            >
              {program.curriculum}
            </Paragraph>
          </Descriptions.Item>
        )}
        {(program.contactEmail || program.contactPhone) && (
          <Descriptions.Item label="문의처">
            <Space direction="vertical" size="small">
              {program.contactEmail && (
                <Text>
                  이메일: <Text copyable>{program.contactEmail}</Text>
                </Text>
              )}
              {program.contactPhone && (
                <Text>
                  연락처: <Text copyable>{program.contactPhone}</Text>
                </Text>
              )}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  )
}
