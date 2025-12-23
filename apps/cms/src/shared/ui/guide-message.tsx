/**
 * 안내 문구 컴포넌트
 * 공통 UI 원칙: 고정 문구 준수, 순서 변경 불가, 안정적인 어조
 */

import { Alert, Typography } from 'antd'

const { Paragraph } = Typography

interface GuideMessageProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  showIcon?: boolean
}

export function GuideMessage({ 
  message, 
  type = 'info',
  showIcon = true 
}: GuideMessageProps) {
  return (
    <Alert
      message={message}
      type={type}
      showIcon={showIcon}
      style={{ marginBottom: 16 }}
    />
  )
}

interface GuideParagraphProps {
  messages: string[]
  type?: 'secondary' | 'success' | 'warning' | 'danger'
}

export function GuideParagraph({ messages, type = 'secondary' }: GuideParagraphProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {messages.map((message, index) => (
        <Paragraph key={index} type={type}>
          {message}
        </Paragraph>
      ))}
    </div>
  )
}



