/**
 * 파일 업로드 Mock 서비스
 * Phase 0.2.2: 학교 신청서 엑셀 업로드 (FR-C03)
 */

/**
 * 파일 업로드 결과
 */
export interface FileUploadResult {
  url: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

/**
 * 파일 업로드 Mock 서비스
 * 실제 환경에서는 서버로 파일을 전송하고 URL을 받아옴
 */
export const fileUploadService = {
  /**
   * 파일 업로드 (Mock)
   * 실제로는 서버로 파일을 전송하고 저장된 URL을 반환
   */
  upload: async (file: File, type: 'studentList' | 'document'): Promise<FileUploadResult> => {
    // Mock: 비동기 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock URL 생성 (실제로는 서버에서 반환)
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const extension = file.name.substring(file.name.lastIndexOf('.'))
    const url = `/uploads/${type}/${fileId}${extension}`

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }
  },

  /**
   * 여러 파일 업로드
   */
  uploadMultiple: async (
    files: File[],
    type: 'studentList' | 'document'
  ): Promise<FileUploadResult[]> => {
    return Promise.all(files.map(file => fileUploadService.upload(file, type)))
  },
}
