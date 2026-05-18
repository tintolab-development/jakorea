/**
 * 안내 문구 (Alert description)
 */

import { Alert, Typography } from 'antd'

const { Paragraph } = Typography

interface GuideAlertProps {
  text: string
  type?: 'info' | 'success' | 'warning' | 'error'
  showIcon?: boolean
}

export function GuideAlert({ text, type = 'info', showIcon = true }: GuideAlertProps) {
  return (
    <Alert
      description={text}
      type={type}
      showIcon={showIcon}
      style={{ marginBottom: 16 }}
    />
  )
}

interface GuideParagraphProps {
  lines: string[]
  type?: 'secondary' | 'success' | 'warning' | 'danger'
}

export function GuideParagraph({ lines, type = 'secondary' }: GuideParagraphProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {lines.map((line, index) => (
        <Paragraph key={index} type={type}>
          {line}
        </Paragraph>
      ))}
    </div>
  )
}
