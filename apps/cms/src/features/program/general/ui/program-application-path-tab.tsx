/**
 * 프로그램 신청 경로 탭
 */

import { Space, Card, Tag, Alert, Typography } from 'antd'
import { CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
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
  internal: '자동화 프로그램' }

export function ProgramApplicationPathTab({
  applicationPath,
  isAdmin,
  onEdit,
  onCreate }: ProgramApplicationPathTabProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="신청 경로 설정"
        extra={
          isAdmin ? (
            <Space>
              {applicationPath ? (
                <CmsButton variant="default" icon={<EditOutlined />} onClick={onEdit}>
                  수정
                </CmsButton>
              ) : (
                <CmsButton icon={<PlusOutlined />} onClick={onCreate}>
                  신청 경로 등록
                </CmsButton>
              )}
            </Space>
          ) : null
        }
      >
        {applicationPath ? (
          <DetailInfoForm title="신청 경로 설정" hideHeader mode="view">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="신청 경로 유형"
                view={
                  <Tag color={applicationPath.pathType === 'google_form' ? 'orange' : 'blue'}>
                    {pathTypeLabels[applicationPath.pathType]}
                  </Tag>
                }
              />
            </DetailInfoForm.Row>
            {applicationPath.pathType === 'google_form' && applicationPath.googleFormUrl && (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="구글폼 링크"
                  view={
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
                  }
                />
              </DetailInfoForm.Row>
            )}
            {applicationPath.guideText && (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="안내 문구"
                  view={
                    <Paragraph
                      style={{ margin: 0 }}
                      ellipsis={{ rows: 2, expandable: true, symbol: '더보기' }}
                    >
                      {applicationPath.guideText}
                    </Paragraph>
                  }
                />
              </DetailInfoForm.Row>
            )}
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="상태"
                view={
                  <Tag color={applicationPath.isActive ? 'green' : 'default'}>
                    {applicationPath.isActive ? '활성' : '비활성'}
                  </Tag>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="등록일" view={dayjs(applicationPath.createdAt).format('YYYY-MM-DD HH:mm')} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="수정일" view={dayjs(applicationPath.updatedAt).format('YYYY-MM-DD HH:mm')} />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        ) : (
          <Alert
            description="신청 경로를 등록하여 프로그램 신청 방식을 설정할 수 있습니다."
            type="info"
            showIcon
          />
        )}
      </Card>
    </Space>
  )
}
