/**
 * 수료증 배경 이미지 업로드 컴포넌트
 */

import { useEffect } from 'react'
import { Upload, Button, Space, Typography } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useImageUpload } from '../hooks/use-image-upload'

const { Text } = Typography

export interface CertificateBackgroundUploadProps {
  value?: string // 배경 이미지 URL
  onChange?: (url: string | undefined) => void
  disabled?: boolean
}

export function CertificateBackgroundUpload({
  value,
  onChange,
  disabled = false,
}: CertificateBackgroundUploadProps) {
  const { uploading, previewUrl, fileName, handleUpload, handleRemove, setPreviewUrl } = useImageUpload({
    onSuccess: (url) => {
      // 부모 컴포넌트에 URL 전달
      onChange?.(url)
      console.log('배경 이미지 URL 변경:', url)
    },
    onError: (error) => {
      console.error('배경 이미지 업로드 오류:', error)
    },
  })

  // value prop 변경 시 previewUrl 동기화
  useEffect(() => {
    setPreviewUrl(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // setPreviewUrl은 useState의 setter이므로 안정적인 참조를 유지합니다
  }, [value])

  const onRemove = () => {
    handleRemove()
    onChange?.(undefined)
  }

  const uploadProps: UploadProps = {
    customRequest: handleUpload,
    showUploadList: false,
    accept: 'image/jpeg,image/jpg,image/png',
    disabled: disabled || uploading,
    maxCount: 1, // 한 번에 파일 하나만 업로드
    multiple: false, // 다중 업로드 비활성화
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {previewUrl && fileName ? (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" ellipsis style={{ flex: 1 }}>
            {fileName}
          </Text>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={onRemove}
            disabled={disabled}
          >
            제거
          </Button>
        </Space>
      ) : (
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
            배경 이미지 업로드
          </Button>
        </Upload>
      )}
      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
        JPG, PNG 파일만 업로드 가능 (최대 10MB)
      </div>
    </Space>
  )
}
