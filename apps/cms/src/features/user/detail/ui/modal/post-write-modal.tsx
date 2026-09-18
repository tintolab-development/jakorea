/**
 * 게시글 등록 모달
 * 수강 프로그램 상세 / 학교 상세 게시글 탭 > "게시글 등록" 버튼 클릭 시 노출
 * 공개 범위 UI 라벨은 고정(전체·참여자·강사·봉사자).
 * 「참여자」체크의 API 값만 프로그램 유형에 따라 매핑:
 * - 기관 → TEACHER (담당교사·신청자)
 * - 개인 → STUDENT (학생·개인 참여자)
 */

import { useState, useEffect, useMemo } from 'react'
import { Checkbox } from 'antd'
import { CmsButton, ContentModal } from '@/shared/ui'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  sumFileBytes,
} from '@/shared/ui/file-select-field-limits'
import type { Program, ProgramPost } from '@/types/domain'
import { createProgramPost, addProgramFiles } from '@/data/mock'
import {
  createGeneralProgramPost,
  putGeneralProgramPostAttachments,
  updateGeneralProgramPost,
} from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  ADMIN_FILE_PURPOSE,
  contentUrlForFileObjectId,
  createFileAttachment,
  parseFileObjectId,
  programPostFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  resolveParticipantAudienceApiKey,
  type PostWriteAudienceApiKey,
} from '../../lib/post-write-audience'
import './post-write-modal.css'

const ALLOWED_EXTENSIONS: string[] = ['.jpg', '.jpeg', '.png']

function getAllowedExtensionsDescription(): string {
  return 'JPG, PNG'
}

export interface PostWriteModalProps {
  open: boolean
  onCancel: () => void
  /** 프로그램 ID (필수, 등록 대상 프로그램) */
  programId: string
  /**
   * 프로그램 — `참여자` 체크의 API 값 매핑에 사용.
   * 기관 → teacher(담당교사·신청자) / 개인 → student(학생·개인 참여자)
   */
  program?: Program
  /** 참여기관(학교) ID — 있으면 해당 학교 전용 게시글 */
  schoolId?: string
  /** 작성자 표시명 (예: "JA KOREA 알림", "박○○ 담당교사님") */
  authorName: string
  /** 수정 대상 게시글 — 있으면 수정 모드 */
  editingPost?: ProgramPost | null
  /** 등록·수정 성공 시 콜백. 수정 시 postId·content 전달 */
  onSuccess?: (updated?: { postId: string; content: string }) => void
}

function audienceFromPost(
  post: ProgramPost | null | undefined,
  program?: Program
): PostWriteAudienceApiKey[] {
  if (!post?.audience?.length) return defaultPostWriteAudience(program)
  const participantKey = resolveParticipantAudienceApiKey(program)
  const mapped = post.audience
    .map(key => {
      const lower = key.toLowerCase()
      if (lower === 'all') return 'all' as const
      if (lower === 'participant' || lower === 'teacher' || lower === 'student') {
        return participantKey
      }
      if (lower === 'instructor') return 'instructor' as const
      if (lower === 'volunteer') return 'volunteer' as const
      return null
    })
    .filter((key): key is PostWriteAudienceApiKey => key != null)
  return mapped.length > 0 ? [...new Set(mapped)] : defaultPostWriteAudience(program)
}

export function PostWriteModal({
  open,
  onCancel,
  programId,
  program,
  schoolId,
  authorName,
  editingPost = null,
  onSuccess,
}: PostWriteModalProps) {
  const isEditMode = editingPost != null
  const [audience, setAudience] = useState<PostWriteAudienceApiKey[]>(() =>
    defaultPostWriteAudience(program)
  )
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const fileNames = files.map(f => f.name)
  const audienceOptions = useMemo(() => buildPostWriteAudienceOptions(program), [program])

  const editorResetKey = useMemo(
    () =>
      open
        ? `post-write-${programId}-${editingPost?.id ?? 'new'}-${editingPost?.updatedAt ?? ''}`
        : 'closed',
    [open, programId, editingPost?.id, editingPost?.updatedAt]
  )
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    open,
    editingPost?.content ?? '',
    editorResetKey,
    {
      height: '280px',
      placeholder: '게시글 내용을 작성하세요',
    }
  )

  useEffect(() => {
    if (!open) {
      setAudience(defaultPostWriteAudience(program))
      setFiles([])
      return
    }
    setAudience(audienceFromPost(editingPost, program))
    setFiles([])
  }, [open, program, editingPost])

  const handleFilesChange = (newFiles: File[]) => {
    const valid: File[] = []
    for (const file of newFiles) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
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
    const trimmed = getMarkdown().trim()
    if (!trimmed) {
      return
    }

    setLoading(true)
    try {
      const ownerId = parseFileObjectId(programId) ?? 1
      const owner = programPostFileOwner(ownerId, ADMIN_FILE_PURPOSE.PROGRAM_POST_ATTACHMENT)
      const uploadResults: Array<{
        fileName: string
        fileUrl: string
        fileSize: number
        fileObjectId: number
      }> = []
      for (const file of files) {
        const uploaded = await uploadAdminFileMaybeMock({ file, owner })
        await createFileAttachment({
          fileObjectId: uploaded.fileObjectId,
          owner,
          attachmentType: ADMIN_FILE_PURPOSE.PROGRAM_POST_ATTACHMENT,
          displayOrder: uploadResults.length + 1,
        }).catch(() => undefined)
        uploadResults.push({
          fileName: file.name,
          fileUrl: contentUrlForFileObjectId(uploaded.fileObjectId),
          fileSize: file.size,
          fileObjectId: uploaded.fileObjectId,
        })
      }
      const visibilityType = buildPostWriteVisibilityType(audience)
      const audienceForSave = audience.includes('all')
        ? (['all'] as string[])
        : audience.filter(key => key !== 'all')
      const title =
        trimmed.replace(/[#*_`>\-[\]()]/g, '').slice(0, 40) || '게시글'

      if (isEditMode && editingPost) {
        if (shouldUseGeneralProgramsRemoteApi() && !editingPost.id.startsWith('temp-')) {
          await updateGeneralProgramPost(programId, editingPost.id, {
            title,
            content: trimmed,
            visibilityType,
          })
          if (uploadResults.length > 0) {
            await putGeneralProgramPostAttachments(
              programId,
              editingPost.id,
              uploadResults.map(r => r.fileObjectId)
            )
          }
        }
        setAudience(defaultPostWriteAudience(program))
        setFiles([])
        onSuccess?.({ postId: editingPost.id, content: trimmed })
        onCancel()
        return
      }

      if (shouldUseGeneralProgramsRemoteApi()) {
        const created = await createGeneralProgramPost(programId, {
          title,
          content: trimmed,
          visibilityType,
        })
        const createdPostId = created?.postId
        if (createdPostId != null && uploadResults.length > 0) {
          await putGeneralProgramPostAttachments(
            programId,
            String(createdPostId),
            uploadResults.map(r => r.fileObjectId)
          )
        }
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
              fileUrl: r.fileUrl,
              fileSize: r.fileSize,
            }))
          )
        }
      }
      setAudience(defaultPostWriteAudience(program))
      setFiles([])
      onSuccess?.()
      onCancel()
    } catch (e) {
      console.error(isEditMode ? '게시글 수정 실패:' : '게시글 등록 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={isEditMode ? '게시글 수정' : '게시글 등록'}
      width={800}
      className="post-write-modal"
      footer={
        <div className="post-write-modal__footer-actions">
          <CmsButton variant="secondary" size="medium" onClick={onCancel} disabled={loading}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" onClick={handleRegister} loading={loading}>
            {isEditMode ? '수정' : '등록'}
          </CmsButton>
        </div>
      }
    >
      <div className="post-write-modal__body">
        <div className="post-write-modal__field post-write-modal__field--audience">
          <label className="post-write-modal__label">
            게시글 공개 범위 <span className="post-write-modal__required" aria-hidden>*</span>
          </label>
          <Checkbox.Group
            options={audienceOptions}
            value={audience}
            onChange={vals => setAudience(vals as PostWriteAudienceApiKey[])}
            className="post-write-modal__checkbox-group"
          />
        </div>

        <div className="post-write-modal__field post-write-modal__field--editor">
          <div className="post-write-modal__editor-host">
            <RichTextEditor editor={editor} minHeight={editorMinHeight} />
          </div>
        </div>

        <div className="post-write-modal__field">
          <div className="post-write-modal__attachment">
            <div className="post-write-modal__attachment-row">
              <span className="post-write-modal__attachment-label">첨부 파일</span>
              <div className="post-write-modal__attachment-body">
                <FileSelectField
                  accept=".jpg,.jpeg,.png"
                  fileNames={fileNames}
                  currentTotalBytes={sumFileBytes(files)}
                  maxTotalBytes={FILE_SELECT_MAX_TOTAL_BYTES}
                  onFilesChange={handleFilesChange}
                  onRemoveFile={handleRemoveFile}
                  uploading={loading}
                  buttonLabel="파일 선택"
                  guideLines={[
                    `- 파일은 총 최대 15MB까지 ${getAllowedExtensionsDescription()} 형식만 등록 가능합니다.`,
                    '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                  className="post-write-modal__file-select file-select-field--edit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentModal>
  )
}
