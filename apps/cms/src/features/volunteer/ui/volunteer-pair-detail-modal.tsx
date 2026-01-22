/**
 * 봉사자 조 상세 정보 모달
 * 좌우로 각 봉사자의 유저 정보를 표시
 */

import { Modal, Descriptions, Tag, Row, Col, Card, Divider, Typography } from 'antd'
import type { User } from '@/types/user'
import type { VolunteerPair } from '@/types/volunteer'
import { RoleBadge } from '@/shared/ui'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import { formatDate } from '@/shared/utils'
import { mockUsers } from '@/data/mock/users'

const { Title } = Typography

type UserWithoutPassword = Omit<User, 'password'>

interface VolunteerPairDetailModalProps {
  open: boolean
  pair: VolunteerPair | null
  onClose: () => void
}

export function VolunteerPairDetailModal({
  open,
  pair,
  onClose,
}: VolunteerPairDetailModalProps) {
  if (!pair) {
    return null
  }

  const volunteer1 = mockUsers.find(u => u.id === pair.volunteer1Id)
  const volunteer2 = mockUsers.find(u => u.id === pair.volunteer2Id)

  // password 제거
  const getUserWithoutPassword = (user: User | undefined): UserWithoutPassword | undefined => {
    if (!user) return undefined
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  const renderUserInfo = (user: UserWithoutPassword | undefined, title: string) => {
    if (!user) {
      return (
        <Card>
          <Title level={4}>{title}</Title>
          <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
            사용자 정보를 찾을 수 없습니다.
          </div>
        </Card>
      )
    }

    return (
      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>
          {title}
        </Title>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="이름">{user.name}</Descriptions.Item>
          <Descriptions.Item label="이메일">{user.email}</Descriptions.Item>
          <Descriptions.Item label="권한">
            <RoleBadge role={user.role} size="small" variant="tag" />
          </Descriptions.Item>
          <Descriptions.Item label="상태">
            <Tag color={user.isActive ? 'green' : 'default'}>
              {user.isActive ? '활성' : '비활성'}
            </Tag>
          </Descriptions.Item>
          {(user.role === 'INSTRUCTOR' ||
            user.role === 'INDIVIDUAL') && (
            <>
              <Descriptions.Item label="면접 상태">
                {user.interviewStatus ? (
                  <InterviewStatusBadge status={user.interviewStatus} />
                ) : (
                  <Tag>-</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="참여이력">
                {user.participationHistory ?? 0}건
              </Descriptions.Item>
              {user.interviewScheduledAt && (
                <Descriptions.Item label="면접 일정">
                  {formatDate(new Date(user.interviewScheduledAt))}
                </Descriptions.Item>
              )}
              {user.interviewCompletedAt && (
                <Descriptions.Item label="면접 완료일">
                  {formatDate(new Date(user.interviewCompletedAt))}
                </Descriptions.Item>
              )}
            </>
          )}
          {user.lastLoginAt && (
            <Descriptions.Item label="마지막 로그인">
              {formatDate(new Date(user.lastLoginAt))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="생성일">
            {formatDate(new Date(user.createdAt))}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {formatDate(new Date(user.updatedAt))}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    )
  }

  return (
    <Modal
      title={
        <div>
          <span>봉사자 조 상세 정보</span>
          <Tag color={pair.isNewPair ? 'green' : 'orange'} style={{ marginLeft: 12 }}>
            {pair.isNewPair ? '새로운 조합' : `과거 ${pair.previousMatchCount}회 매칭`}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Row gutter={[24, 24]}>
        <Col span={12}>
          {renderUserInfo(getUserWithoutPassword(volunteer1), `봉사자 1: ${pair.volunteer1Name}`)}
        </Col>
        <Col span={12}>
          {renderUserInfo(getUserWithoutPassword(volunteer2), `봉사자 2: ${pair.volunteer2Name}`)}
        </Col>
      </Row>
      <Divider />
      <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
        <div>참여 횟수: {pair.volunteer1Name} ({pair.volunteer1ParticipationCount}회) / {pair.volunteer2Name} ({pair.volunteer2ParticipationCount}회)</div>
      </div>
    </Modal>
  )
}
