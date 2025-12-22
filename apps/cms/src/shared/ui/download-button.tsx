/**
 * 파일 다운로드 버튼 공통 컴포넌트
 */

import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useState } from 'react'

interface DownloadButtonProps {
  /** 다운로드 함수 */
  onDownload: () => Promise<void> | void
  /** 버튼 텍스트 */
  text?: string
  /** 버튼 타입 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  /** 버튼 크기 */
  size?: 'small' | 'middle' | 'large'
  /** 비활성화 여부 */
  disabled?: boolean
  /** 성공 메시지 */
  successMessage?: string
  /** 실패 메시지 */
  errorMessage?: string
  /** 아이콘 표시 여부 */
  showIcon?: boolean
}

export function DownloadButton({
  onDownload,
  text = '다운로드',
  type = 'primary',
  size = 'middle',
  disabled = false,
  successMessage = '파일이 다운로드되었습니다',
  errorMessage = '다운로드 중 오류가 발생했습니다',
  showIcon = true,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    try {
      setLoading(true)
      await onDownload()
      message.success(successMessage)
    } catch (error) {
      console.error('Download failed:', error)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type={type}
      size={size}
      icon={showIcon ? <DownloadOutlined /> : undefined}
      onClick={handleClick}
      loading={loading}
      disabled={disabled}
    >
      {text}
    </Button>
  )
}


