/**
 * 강사 상세 컴포넌트
 * Phase 1.2: 상세 정보 표시
 */

import { Card, Descriptions, Tag, Space, Button } from 'antd'
import type { Instructor } from '@/types/domain'

interface InstructorDetailProps {
  instructor: Instructor
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function InstructorDetail({ instructor, onEdit, onDelete, loading }: InstructorDetailProps) {
  return (
    <Card
      title={instructor.name}
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
        <Descriptions.Item label="연락처">{instructor.contactPhone}</Descriptions.Item>
        <Descriptions.Item label="이메일">{instructor.contactEmail || '-'}</Descriptions.Item>
        <Descriptions.Item label="지역">{instructor.region}</Descriptions.Item>
        <Descriptions.Item label="전문분야">
          <Space wrap>
            {instructor.specialty.map(s => (
              <Tag key={s}>{s}</Tag>
            ))}
          </Space>
        </Descriptions.Item>
        {instructor.availableTime && (
          <Descriptions.Item label="가능 시간">{instructor.availableTime}</Descriptions.Item>
        )}
        {instructor.experience && <Descriptions.Item label="이력">{instructor.experience}</Descriptions.Item>}
        {instructor.rating && (
          <Descriptions.Item label="평점">{instructor.rating.toFixed(1)}/5.0</Descriptions.Item>
        )}
        {instructor.bankAccount && (
          <Descriptions.Item label="계좌번호">
            {instructor.bankAccount.replace(/(\d{4})(\d{4})(\d+)/, '$1-****-****')}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="등록일">
          {new Date(instructor.createdAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(instructor.updatedAt).toLocaleDateString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

