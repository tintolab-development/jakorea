/**
 * E2E 로깅 상세 — 텍스트 영역 + 복사 버튼
 */

import { useEffect, useRef, useState } from 'react'
import { Button, Typography } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'

type Props = {
  label: string
  text: string
}

export function CopyablePre({ label, text }: Props) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const canCopy = text.trim().length > 0 && text !== '—'

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    if (!canCopy) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setCopyFailed(false)
      if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false)
        resetTimerRef.current = null
      }, 1500)
    } catch {
      setCopied(false)
      setCopyFailed(true)
    }
  }

  return (
    <div className="e2e-error-log-page__detail-field">
      <div className="e2e-error-log-page__detail-field-header">
        <Typography.Text type="secondary">{label}</Typography.Text>
        <Button
          type="text"
          size="small"
          className="e2e-error-log-page__copy-btn"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={() => void handleCopy()}
          disabled={!canCopy}
          aria-label={`${label} 복사`}
        >
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>
      {copyFailed ? (
        <Typography.Text type="danger" className="e2e-error-log-page__copy-error">
          복사에 실패했습니다.
        </Typography.Text>
      ) : null}
      <pre>{text}</pre>
    </div>
  )
}
