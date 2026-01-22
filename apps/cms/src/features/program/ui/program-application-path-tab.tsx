/**
 * 프로그램 신청 경로 탭
 */

import { Space, Card, Descriptions, Tag, Button, Alert, Typography } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { ApplicationPath } from '@/types/domain'
import dayjs from 'dayjs'

const { Paragraph } = Typography

interface ProgramApplicationPathTabProps {
  applicationPath?: ApplicationPath | null
  isAdmin: boolean
  onEdit: () => void
  onCreate: () => void
}

const pathTypeLabels: Record<string, string> = {
  google_form: '구글폼',
  internal: '자동화 프로그램',
}

export function ProgramApplicationPathTab({
  applicationPath,
  isAdmin,
  onEdit,
  onCreate,
}: ProgramApplicationPathTabProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="신청 경로 설정"
        extra={
          isAdmin ? (
            <Space>
              {applicationPath ? (
                <Button icon={<EditOutlined />} onClick={onEdit}>
                  수정
                </Button>
              ) : (
                <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
                  신청 경로 등록
                </Button>
              )}
            </Space>
          ) : null
        }
      >
        {applicationPath ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="신청 경로 유형">
              <Tag color={applicationPath.pathType === 'google_form' ? 'orange' : 'blue'}>
                {pathTypeLabels[applicationPath.pathType]}
              </Tag>
            </Descriptions.Item>
            {applicationPath.pathType === 'google_form' && applicationPath.googleFormUrl && (
              <Descriptions.Item label="구글폼 링크">
                <Paragraph
                  ellipsis={{ tooltip: applicationPath.googleFormUrl }}
                  style={{ margin: 0 }}
                >
                  <a
                    href={applicationPath.googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {applicationPath.googleFormUrl}
                  </a>
                </Paragraph>
              </Descriptions.Item>
            )}
            {applicationPath.guideMessage && (
              <Descriptions.Item label="안내 문구">
                <Paragraph
                  style={{ margin: 0 }}
                  ellipsis={{ rows: 2, expandable: true, symbol: '더보기' }}
                >
                  {applicationPath.guideMessage}
                </Paragraph>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="상태">
              <Tag color={applicationPath.isActive ? 'green' : 'default'}>
                {applicationPath.isActive ? '활성' : '비활성'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="등록일">
              {dayjs(applicationPath.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {dayjs(applicationPath.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert
            message="신청 경로가 설정되지 않았습니다"
            description="신청 경로를 등록하여 프로그램 신청 방식을 설정할 수 있습니다."
            type="info"
            showIcon
          />
        )}
      </Card>
    </Space>
  )
}
