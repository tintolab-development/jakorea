/**
 * 게시글 등록 모달
 * 수강 프로그램 상세 / 학교 상세 게시글 탭 > "게시글 등록" 버튼 클릭 시 노출
 * antd Modal 사용 (흰색 헤더, 타이틀 + X), 공개 범위·내용·첨부파일·취소/등록
 * 실제 데이터: createProgramPost + fileUploadService 연동
 */

import { useState, useEffect } from 'react'
import { Checkbox, Input, Modal } from 'antd'
import { CmsButton } from '@/shared/ui'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { createProgramPost, addProgramFiles } from '@/data/mock'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import './post-write-modal.css'

const { TextArea } = Input

const AUDIENCE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '담당교사', value: 'teacher' },
  { label: '강사', value: 'instructor' },
  { label: '봉사자', value: 'volunteer' },
  { label: '학생', value: 'student' },
]

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

const ALLOWED_EXTENSIONS: string[] = [
  '.jpg', '.jpeg', '.png',
]

function getAllowedExtensionsDescription(): string {
  return 'JPG, PNG'
}

export interface PostWriteModalProps {
  open: boolean
  onCancel: () => void
  /** 프로그램 ID (필수, 등록 대상 프로그램) */
  programId: string
  /** 참여기관(학교) ID — 있으면 해당 학교 전용 게시글 */
  schoolId?: string
  /** 작성자 표시명 (예: "JA KOREA 알림", "박○○ 담당교사님") */
  authorName: string
  /** 등록 성공 시 콜백 (목록 갱신용) */
  onSuccess?: () => void
}

function resetForm(
  setAudience: (v: string[]) => void,
  setContent: (v: string) => void,
  setFiles: (v: File[]) => void
) {
  setAudience(['all', 'teacher', 'instructor', 'volunteer', 'student'])
  setContent('')
  setFiles([])
}

export function PostWriteModal({
  open,
  onCancel,
  programId,
  schoolId,
  authorName,
  onSuccess,
}: PostWriteModalProps) {
  const [audience, setAudience] = useState<string[]>([
    'all',
    'teacher',
    'instructor',
    'volunteer',
    'student',
  ])
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const fileNames = files.map(f => f.name)

  useEffect(() => {
    if (!open) resetForm(setAudience, setContent, setFiles)
  }, [open])

  const handleFilesChange = (newFiles: File[]) => {
    const valid: File[] = []
    for (const file of newFiles) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        continue
      }
      valid.push(file)
    }
    setFiles(prev => [...prev, ...valid])
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRegister = async () => {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    setLoading(true)
    try {
      const uploadResults =
        files.length > 0
          ? await fileUploadService.uploadMultiple(files, 'document')
          : []
      const newPost = createProgramPost({
        programId,
        schoolId: schoolId as import('@/types').UUID | undefined,
        authorName,
        content: trimmed,
        audience,
        attachmentCount: uploadResults.length,
      })
      if (uploadResults.length > 0) {
        addProgramFiles(programId, newPost.id, uploadResults.map(r => ({
          fileName: r.fileName,
          fileUrl: r.url,
          fileSize: r.fileSize,
        })))
      }
      resetForm(setAudience, setContent, setFiles)
      onSuccess?.()
      onCancel()
    } catch (e) {
      console.error('게시글 등록 실패:', e)
      } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="게시글 등록"
      width={800}
      className="post-write-modal"
      footer={
        <div className="post-write-modal__footer-actions">
          <CmsButton variant="secondary" size="large" onClick={onCancel} disabled={loading}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" onClick={handleRegister} loading={loading}>
            등록
          </CmsButton>
        </div>
      }
      closable
      destroyOnClose
      maskClosable
      centered
    >
      <div className="post-write-modal__body">
        {/* 게시글 공개 범위 */}
        <div className="post-write-modal__field post-write-modal__field--audience">
          <label className="post-write-modal__label">
            게시글 공개 범위 <span className="post-write-modal__required" aria-hidden>*</span>
          </label>
          <Checkbox.Group
            options={AUDIENCE_OPTIONS}
            value={audience}
            onChange={vals => setAudience(vals as string[])}
            className="post-write-modal__checkbox-group"
          />
        </div>

        {/* 게시글 내용 */}
        <div className="post-write-modal__field">
          <TextArea
            placeholder="게시글 내용을 작성하세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="post-write-modal__textarea"
          />
        </div>

        {/* 첨부 파일: 좌측 라벨 | 우측 FileSelectField(파일 목록 + 파일 선택 버튼 + 안내) */}
        <div className="post-write-modal__field">
          <div className="post-write-modal__attachment">
            <div className="post-write-modal__attachment-row">
              <span className="post-write-modal__attachment-label">첨부 파일</span>
              <div className="post-write-modal__attachment-body">
                <FileSelectField
                  accept=".jpg,.jpeg,.png"
                  multiple
                  fileNames={fileNames}
                  onFilesChange={handleFilesChange}
                  onRemoveFile={handleRemoveFile}
                  uploading={loading}
                  buttonLabel="파일 선택"
                  emptyPlaceholder="파일을 업로드 해주세요"
                  guideLines={[
                    `-  파일은 최대 15M까지 ${getAllowedExtensionsDescription()} 형식만 등록 가능합니다.`,
                    '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                  className="post-write-modal__file-select file-select-field--edit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
