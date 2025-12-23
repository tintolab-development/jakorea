/**
 * 증빙 문서 다운로드 유틸리티
 */

import { downloadBlob, generateFilename } from './file-download'
import type { Certificate } from '@/types/domain'
import type { DateValue } from '@/types'
import dayjs from 'dayjs'

/**
 * 증빙 문서 다운로드
 * Mock: 실제로는 서버에서 파일을 가져와야 하지만, 현재는 Mock PDF 생성
 */
export async function downloadCertificate(certificate: Certificate | { id: string; title: string; downloadUrl: string; issuedAt: DateValue }): Promise<void> {
  try {
    // Mock: 실제로는 서버에서 파일을 가져와야 함
    // const response = await fetch(certificate.downloadUrl)
    // const blob = await response.blob()

    // Mock PDF 생성 (실제로는 서버에서 생성된 PDF를 받아야 함)
    const mockPdfContent = generateMockPdfContent(certificate)
    const blob = new Blob([mockPdfContent], {
      type: 'application/pdf',
    })

    const filename = generateFilename(
      certificate.title.replace(/\s+/g, '_'),
      'pdf',
      dayjs(certificate.issuedAt).toDate()
    )

    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Failed to download certificate:', error)
    throw new Error('증빙 문서 다운로드 중 오류가 발생했습니다')
  }
}

/**
 * Mock PDF 콘텐츠 생성
 * 실제로는 서버에서 PDF를 생성해야 함
 */
function generateMockPdfContent(certificate: Certificate | { id: string; title: string; downloadUrl: string; issuedAt: DateValue }): string {
  // Mock PDF 헤더 (실제 PDF는 바이너리 형식이지만, 여기서는 텍스트로 시뮬레이션)
  // 실제 구현 시에는 서버에서 PDF를 생성하거나, 클라이언트에서 jsPDF 같은 라이브러리를 사용해야 함
  const content = `
증빙 문서

제목: ${certificate.title}
발급일: ${dayjs(certificate.issuedAt).format('YYYY년 MM월 DD일')}
문서 ID: ${certificate.id}

이 문서는 Mock 데이터입니다.
실제 구현 시에는 서버에서 생성된 PDF 파일을 다운로드해야 합니다.
  `.trim()

  // 실제로는 PDF 바이너리 데이터를 반환해야 하지만, 여기서는 텍스트로 시뮬레이션
  // 실제 구현 시: jsPDF 또는 서버 API 사용
  return content
}

