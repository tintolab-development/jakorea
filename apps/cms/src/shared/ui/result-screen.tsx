/**
 * 결과 화면 컴포넌트
 * 공통 UI 원칙: 단일 상태 표시, 단일 CTA, 명확한 안내
 */

import { Result, Space, Typography } from 'antd'
import { SingleCTA } from './single-cta'
import { GuideMessage } from './guide-message'

const { Paragraph } = Typography

interface ResultScreenProps {
  status: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'
  title: string
  subTitle?: string
  description?: string
  guideMessages?: string[]
  cta?: {
    label: string
    targetUrl?: string
    onClick?: () => void
    type?: 'primary' | 'default'
  }
  extra?: React.ReactNode
}

export function ResultScreen({
  status,
  title,
  subTitle,
  description,
  guideMessages,
  cta,
  extra,
}: ResultScreenProps) {
  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {description && <Paragraph>{description}</Paragraph>}
          
          {guideMessages && guideMessages.length > 0 && (
            <div>
              {guideMessages.map((message, index) => (
                <GuideMessage key={index} message={message} type="info" />
              ))}
            </div>
          )}
          
          {cta && (
            <SingleCTA
              label={cta.label}
              targetUrl={cta.targetUrl}
              onClick={cta.onClick}
              type={cta.type}
            />
          )}
          
          {extra}
        </Space>
      }
    />
  )
}

