/**
 * 스폰서 상세 컴포넌트
 * Phase 1.3: 상세 정보 표시
 */

import { Card, Descriptions, Tag, Space, Button } from 'antd'
import type { Sponsor } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'

interface SponsorDetailProps {
  sponsor: Sponsor
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function SponsorDetail({ sponsor, onEdit, onDelete, loading }: SponsorDetailProps) {
  return (
    <Card
      title={
        <Space>
          <Tag color={domainColorsHex.sponsor.primary} style={{ fontSize: 16, padding: '4px 12px' }}>
            {sponsor.name}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button onClick={onEdit}>수정</Button>
          <Button danger onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="설명">{sponsor.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="연락처">{sponsor.contactInfo || '-'}</Descriptions.Item>
        {sponsor.securityMemo && (
          <Descriptions.Item label="보안 메모">
            <div style={{ backgroundColor: '#fff7e6', padding: 12, borderRadius: 4 }}>
              {sponsor.securityMemo}
            </div>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="등록일">
          {new Date(sponsor.createdAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(sponsor.updatedAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}




