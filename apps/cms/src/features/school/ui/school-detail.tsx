/**
 * 학교 상세 컴포넌트
 * Phase 1.4: 상세 정보 표시
 */

import { Card, Descriptions, Tag, Space, Button } from 'antd'
import type { School } from '@/types/domain'

interface SchoolDetailProps {
  school: School
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function SchoolDetail({ school, onEdit, onDelete, loading }: SchoolDetailProps) {
  return (
    <Card
      title={
        <Space>
          <Tag color="cyan" style={{ fontSize: 16, padding: '4px 12px' }}>
            {school.name}
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
        <Descriptions.Item label="지역">{school.region}</Descriptions.Item>
        {school.address && <Descriptions.Item label="주소">{school.address}</Descriptions.Item>}
        <Descriptions.Item label="담당자">{school.contactPerson}</Descriptions.Item>
        {school.contactPhone && <Descriptions.Item label="연락처">{school.contactPhone}</Descriptions.Item>}
        {school.contactEmail && <Descriptions.Item label="이메일">{school.contactEmail}</Descriptions.Item>}
        <Descriptions.Item label="등록일">
          {new Date(school.createdAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(school.updatedAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}




