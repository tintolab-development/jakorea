/**
 * 수료증 PDF 생성 유틸리티
 * 배경 이미지와 텍스트 오버레이를 결합하여 PDF 생성
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { CertificateTextField } from '@/types/template'

/**
 * 이미지 로드 헬퍼
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // blob URL이나 data URL의 경우 crossOrigin 설정 불필요
    // 외부 URL의 경우에만 crossOrigin 설정
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous' // CORS 이슈 해결
    }
    img.onload = () => resolve(img)
    img.onerror = (error) => {
      console.error('이미지 로드 실패:', url, error)
      reject(new Error(`이미지를 로드할 수 없습니다: ${url}`))
    }
    img.src = url
  })
}

/**
 * Canvas에 텍스트 렌더링 (고해상도)
 */
function renderTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  textFields: CertificateTextField[],
  fieldValues: Record<string, string>
): void {
  // 텍스트 렌더링 품질 향상 설정
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  textFields.forEach(field => {
    // fieldValues에 값이 있으면 사용, 없으면 label 사용 (빈 문자열이 아닌 경우)
    const value = fieldValues[field.key] !== undefined && fieldValues[field.key] !== '' 
      ? fieldValues[field.key] 
      : field.label || ''
    
    if (!value || value.trim() === '') return

    ctx.save()
    
    // 고품질 텍스트 렌더링
    ctx.font = `${field.fontSize}px ${field.fontFamily || 'Arial'}`
    ctx.fillStyle = field.color || '#000000'
    ctx.textAlign = field.align || 'left'
    ctx.textBaseline = 'top'
    
    // 텍스트 스트로크를 사용하여 선명도 향상 (선택적)
    // ctx.strokeStyle = field.color || '#000000'
    // ctx.lineWidth = 0.5

    // 정렬에 따른 X 좌표 조정
    let x = field.x
    if (field.align === 'center') {
      const metrics = ctx.measureText(value)
      x = field.x - metrics.width / 2
    } else if (field.align === 'right') {
      const metrics = ctx.measureText(value)
      x = field.x - metrics.width
    }

    // 텍스트 렌더링
    ctx.fillText(value, x, field.y)
    // ctx.strokeText(value, x, field.y) // 스트로크 사용 시 주석 해제
    
    ctx.restore()
  })
}

/**
 * 수료증 PDF 생성
 * @param backgroundImageUrl 배경 이미지 URL
 * @param textFields 텍스트 필드 정의
 * @param fieldValues 텍스트 필드 값
 * @param options PDF 옵션
 * @returns PDF Blob
 */
export async function generateCertificatePdf(
  backgroundImageUrl: string,
  textFields: CertificateTextField[],
  fieldValues: Record<string, string>
): Promise<Blob> {

  try {
    // 배경 이미지 로드
    const backgroundImage = await loadImage(backgroundImageUrl)

    // 배경 이미지의 실제 크기 (픽셀)
    const imgWidth = backgroundImage.width
    const imgHeight = backgroundImage.height

    // 고해상도 출력을 위한 스케일 팩터 (2배 또는 3배)
    // 더 높은 해상도로 렌더링하여 PDF 화질 향상
    const scaleFactor = 2 // 2배 해상도로 렌더링 (필요시 3으로 증가 가능)
    const canvasWidth = imgWidth * scaleFactor
    const canvasHeight = imgHeight * scaleFactor

    // Canvas 생성 (고해상도) - 원본 크기의 2배로 생성
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d', {
      alpha: false, // 투명도 불필요 시 성능 향상
      willReadFrequently: false, // 읽기 최적화
    })

    if (!ctx) {
      throw new Error('Canvas context를 생성할 수 없습니다')
    }

    // 고해상도 렌더링을 위한 이미지 스무딩 설정
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 배경 이미지를 캔버스에 그리기 (고해상도로 스케일링)
    ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight)

    // 텍스트 오버레이 렌더링
    // 텍스트 필드의 좌표를 고해상도 캔버스에 맞게 스케일링
    if (textFields && textFields.length > 0) {
      const scaledTextFields = textFields.map(field => ({
        ...field,
        x: field.x * scaleFactor,
        y: field.y * scaleFactor,
        fontSize: field.fontSize * scaleFactor,
      }))
      renderTextOnCanvas(ctx, scaledTextFields, fieldValues)
    }

    // Canvas를 이미지로 변환 (최고 품질)
    const imageData = canvas.toDataURL('image/png', 1.0)

    // PDF 생성
    // 미리보기와 동일한 배율을 유지하기 위해 원본 이미지 크기 기준으로 계산
    // jsPDF는 내부적으로 72 DPI를 사용하므로, 픽셀을 포인트로 변환
    // 웹 표준: 1 inch = 96 pixels, PDF 표준: 1 inch = 72 points
    // 따라서 1 pixel = 72/96 = 0.75 points
    const pixelToPoint = 0.75 // 1 pixel = 0.75 points (72 DPI 기준)
    // PDF 크기는 원본 이미지 크기 기준 (고해상도 캔버스는 내부 렌더링용)
    const pdfWidthPt = imgWidth * pixelToPoint
    const pdfHeightPt = imgHeight * pixelToPoint

    // PDF 생성 (포인트 단위, 압축 최소화로 화질 유지)
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pdfWidthPt, pdfHeightPt],
      compress: false, // 압축 비활성화로 화질 최대화
    })

    // 이미지를 PDF에 추가 (최고 품질 옵션)
    // 고해상도 이미지를 원본 크기로 압축하여 선명도 향상
    // 'FAST' 옵션 제거 - 기본값이 더 높은 품질
    pdf.addImage(imageData, 'PNG', 0, 0, pdfWidthPt, pdfHeightPt, undefined, 'SLOW')

    // PDF를 Blob으로 변환
    const blob = pdf.output('blob')
    
    // Blob이 제대로 생성되었는지 확인
    if (!blob || blob.size === 0) {
      throw new Error('PDF Blob 생성에 실패했습니다')
    }

    return blob
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    throw new Error(`수료증 PDF 생성 중 오류가 발생했습니다: ${errorMessage}`)
  }
}

/**
 * HTML 요소를 Canvas로 변환하여 PDF 생성 (대안 방법)
 * @param elementId HTML 요소 ID
 * @param filename 파일명
 * @returns PDF Blob
 */
export async function generatePdfFromElement(
  elementId: string
): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`요소를 찾을 수 없습니다: ${elementId}`)
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    return pdf.output('blob')
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    throw new Error('PDF 생성 중 오류가 발생했습니다')
  }
}
