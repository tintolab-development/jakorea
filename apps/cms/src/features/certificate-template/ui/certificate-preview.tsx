/**
 * 수료증 미리보기 컴포넌트
 */

import { useEffect, useRef, useState } from 'react'
import { Card, Button, Space, Input, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { CertificateTextField } from '@/types/template'
import { generateCertificatePdf } from '@/shared/utils/certificate-pdf-generator'
import { downloadBlob } from '@/shared/utils/file-download'

export interface CertificatePreviewProps {
  backgroundImageUrl?: string
  textFields?: CertificateTextField[]
  fieldValues?: Record<string, string>
  onFieldValueChange?: (key: string, value: string) => void
  onDownload?: () => void
  disabled?: boolean
}

export function CertificatePreview({
  backgroundImageUrl,
  textFields = [],
  fieldValues = {},
  onFieldValueChange,
  onDownload,
  disabled = false,
}: CertificatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewImage, setPreviewImage] = useState<string | undefined>()
  const [generating, setGenerating] = useState(false)

  // 미리보기 이미지 생성 (텍스트 필드가 있을 때만 Canvas로 렌더링)
  useEffect(() => {
    // 텍스트 필드가 없으면 Canvas 렌더링 불필요 (배경 이미지만 표시)
    if (!backgroundImageUrl || !canvasRef.current || !textFields || textFields.length === 0) {
      setPreviewImage(undefined)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Canvas context를 가져올 수 없습니다')
      return
    }

    const img = new Image()
    // blob URL의 경우 crossOrigin 설정 불필요
    if (!backgroundImageUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    
    img.onload = () => {
      try {
        // Canvas 크기를 이미지 크기에 맞춤
        canvas.width = img.width
        canvas.height = img.height

        // 배경 이미지 그리기
        ctx.drawImage(img, 0, 0)

        // 텍스트 오버레이 렌더링
        textFields.forEach(field => {
          const value = fieldValues[field.key] || field.label
          if (!value) return

          ctx.save()
          ctx.font = `${field.fontSize}px ${field.fontFamily || 'Arial'}`
          ctx.fillStyle = field.color
          ctx.textAlign = field.align
          ctx.textBaseline = 'top'

          // 정렬에 따른 X 좌표 조정
          let x = field.x
          if (field.align === 'center') {
            const metrics = ctx.measureText(value)
            x = field.x - metrics.width / 2
          } else if (field.align === 'right') {
            const metrics = ctx.measureText(value)
            x = field.x - metrics.width
          }

          ctx.fillText(value, x, field.y)
          ctx.restore()
        })

        // Canvas를 이미지로 변환
        const imageData = canvas.toDataURL('image/png')
        setPreviewImage(imageData)
      } catch (error) {
        console.error('Canvas 렌더링 오류:', error)
        message.error('미리보기 생성 중 오류가 발생했습니다')
        setPreviewImage(undefined)
      }
    }
    
    img.onerror = (error) => {
      console.error('이미지 로드 실패:', error, 'URL:', backgroundImageUrl)
      message.error('이미지를 로드할 수 없습니다')
      setPreviewImage(undefined)
    }
    
    // 이미지 로드 시작
    img.src = backgroundImageUrl
  }, [backgroundImageUrl, textFields, fieldValues])

  const handleDownload = async () => {
    if (!backgroundImageUrl) {
      message.warning('배경 이미지를 먼저 업로드해주세요')
      return
    }

    try {
      setGenerating(true)

      // 디버깅: 전달되는 값 확인
      console.log('PDF 생성 시작:', {
        backgroundImageUrl,
        textFieldsCount: textFields?.length || 0,
        fieldValues,
        textFields,
      })

      // PDF 생성 (배경 이미지 크기에 맞춰 자동 생성)
      const pdfBlob = await generateCertificatePdf(
        backgroundImageUrl,
        textFields || [],
        fieldValues || {}
      )

      // Blob 검증
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('생성된 PDF가 비어있습니다')
      }

      console.log('PDF 생성 완료:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type,
      })

      // 다운로드
      const filename = `certificate_${new Date().toISOString().split('T')[0]}.pdf`
      downloadBlob(pdfBlob, filename)
      message.success('PDF 다운로드가 완료되었습니다')

      onDownload?.()
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      message.error(`PDF 생성 중 오류가 발생했습니다: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card title="미리보기" size="small">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {previewImage ? (
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewImage}
              alt="수료증 미리보기"
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}
            />
          </div>
        ) : backgroundImageUrl ? (
          // 배경 이미지만 있고 텍스트 필드가 없거나 미리보기가 아직 생성되지 않은 경우
          <div style={{ textAlign: 'center' }}>
            <img
              src={backgroundImageUrl}
              alt="배경 이미지 미리보기"
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                objectFit: 'contain',
              }}
              onError={() => {
                console.error('이미지 로드 실패:', backgroundImageUrl)
                message.error('이미지를 표시할 수 없습니다')
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: 300,
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8c8c8c',
              backgroundColor: '#fafafa',
            }}
          >
            배경 이미지를 업로드하면 미리보기가 표시됩니다
          </div>
        )}

        {/* 텍스트 필드 값 입력 (미리보기용) */}
        {textFields.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>테스트 값 입력:</div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {textFields.map(field => (
                <Input
                  key={field.id}
                  placeholder={field.label}
                  value={fieldValues[field.key] || ''}
                  onChange={e => onFieldValueChange?.(field.key, e.target.value)}
                  disabled={disabled}
                />
              ))}
            </Space>
          </div>
        )}

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={generating}
          disabled={disabled || !backgroundImageUrl}
          block
        >
          PDF 다운로드
        </Button>
      </Space>

      {/* 숨겨진 Canvas (렌더링용) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  )
}
