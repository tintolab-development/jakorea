/**
 * 게시글 등록 모달
 * 수강 프로그램 상세 / 학교 상세 게시글 탭 > "게시글 등록" 버튼 클릭 시 노출
 * antd Modal 사용 (흰색 헤더, 타이틀 + X), 공개 범위·내용·첨부파일·취소/등록
 * 실제 데이터: createProgramPost + fileUploadService 연동
 */

import { useState, useEffect, useMemo } from 'react'
import { Checkbox, Input, Modal } from 'antd'
import { CmsButton } from '@/shared/ui'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import type { Program } from '@/types/domain'
import { createProgramPost, addProgramFiles } from '@/data/mock'
import { createGeneralProgramPost } from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import './post-write-modal.css'

const { TextArea } = Input

/** 게시글 등록 모달 전용 공개 범위 UI 키 */
const POST_WRITE_AUDIENCE_KEYS = ['all', 'participant', 'instructor', 'volunteer'] as const
type PostWriteAudienceKey = (typeof POST_WRITE_AUDIENCE_KEYS)[number]

const DEFAULT_POST_WRITE_AUDIENCE: PostWriteAudienceKey[] = [...POST_WRITE_AUDIENCE_KEYS]

function buildPostWriteAudienceOptions(program?: Program) {
  const isIndividual = program ? isGeneralIndividualProgram(program) : false
  const participantHint = isIndividual
    ? '학생(개인 참여자)에게 공개'
    : '담당교사(신청자)에게 공개'

  return [
    { label: '전체', value: 'all' as const },
    { label: '참여자', value: 'participant' as const, title: participantHint },
    { label: '강사', value: 'instructor' as const },
    { label: '봉사자', value: 'volunteer' as const },
  ]
}

/** 저장 시 participant → 기관: teacher / 개인: student */
function resolvePostWriteAudienceForSave(
  audience: PostWriteAudienceKey[],
  program?: Program
): string[] {
  const isIndividual = program ? isGeneralIndividualProgram(program) : false
  return audience.map(key => {
    if (key === 'participant') return isIndividual ? 'student' : 'teacher'
    return key
  })
}

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
  /** 참여자(참여자 체크) 매핑 — 기관/개인 구분용 */
  program?: Program
  /** 참여기관(학교) ID — 있으면 해당 학교 전용 게시글 */
  schoolId?: string
  /** 작성자 표시명 (예: "JA KOREA 알림", "박○○ 담당교사님") */
  authorName: string
  /** 등록 성공 시 콜백 (목록 갱신용) */
  onSuccess?: () => void
}

function resetForm(
  setAudience: (v: PostWriteAudienceKey[]) => void,
  setContent: (v: string) => void,
  setFiles: (v: File[]) => void
) {
  setAudience([...DEFAULT_POST_WRITE_AUDIENCE])
  setContent('')
  setFiles([])
}

export function PostWriteModal({
  open,
  onCancel,
  programId,
  program,
  schoolId,
  authorName,
  onSuccess,
}: PostWriteModalProps) {
  const [audience, setAudience] = useState<PostWriteAudienceKey[]>([...DEFAULT_POST_WRITE_AUDIENCE])
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const fileNames = files.map(f => f.name)
  const audienceOptions = useMemo(() => buildPostWriteAudienceOptions(program), [program])

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
      const audienceForSave = resolvePostWriteAudienceForSave(audience, program)
      const visibilityType = audienceForSave.includes('all')
        ? 'ALL'
        : audienceForSave.join(',').toUpperCase()

      if (shouldUseGeneralProgramsRemoteApi()) {
        await createGeneralProgramPost(programId, {
          title: trimmed.slice(0, 40),
          content: trimmed,
          visibilityType,
        })
      } else {
        const newPost = createProgramPost({
          programId,
          schoolId: schoolId as import('@/types').UUID | undefined,
          authorName,
          content: trimmed,
          audience: audienceForSave,
          attachmentCount: uploadResults.length,
        })
        if (uploadResults.length > 0) {
          addProgramFiles(
            programId,
            newPost.id,
            uploadResults.map(r => ({
              fileName: r.fileName,
              fileUrl: r.url,
              fileSize: r.fileSize,
            }))
          )
        }
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
      destroyOnHidden
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
            options={audienceOptions}
            value={audience}
            onChange={vals => setAudience(vals as PostWriteAudienceKey[])}
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
