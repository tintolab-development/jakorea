/**
 * 게시글 등록 모달
 * 수강 프로그램 상세 / 학교 상세 게시글 탭 > "게시글 등록" 버튼 클릭 시 노출
 * 공개 범위 UI 라벨은 고정(전체·참여자·강사·봉사자).
 * 「참여자」체크의 API 값만 프로그램 유형에 따라 매핑:
 * - 기관 → TEACHER (담당교사·신청자)
 * - 개인 → STUDENT (학생·개인 참여자)
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsButton, ContentModal, useCmsAlert } from '@/shared/ui'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { FILE_SELECT_MAX_FILE_BYTES } from '@/shared/ui/file-select-field-limits'
import type { Program, ProgramPost } from '@/types/domain'
import {
  addProgramFiles,
  createProgramPost,
} from '@/features/user/detail/lib/program-post-interaction-stubs'
import {
  createGeneralProgramPost,
  fetchGeneralProgramPostAttachments,
  putGeneralProgramPostAttachments,
  putGeneralProgramPostInlineImages,
  updateGeneralProgramPost,
} from '@/features/program/general/api/admin-general-programs-service'
import { collectFileObjectIdsFromHtml } from '@/features/program/shared/api/program-inline-images'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  contentUrlForFileObjectId,
  parseFileObjectId,
  programPostFileOwner,
  programPostInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { extractApiErrorMessage, getApiErrorField } from '@/shared/lib/extract-api-error-message'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  postWriteAudienceFromStored,
  reconcilePostWriteAudienceSelection,
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
  const [existingAttachments, setExistingAttachments] = useState<
    { fileObjectId: number; name: string; fileSize: number }[]
  >([])
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const { showAlert } = useCmsAlert()
  const loadedAttachmentIdsRef = useRef<number[] | null>(null)

  const fileNames = [...existingAttachments.map(item => item.name), ...files.map(f => f.name)]
  const audienceOptions = useMemo(() => buildPostWriteAudienceOptions(program), [program])

  const editorResetKey = useMemo(
    () =>
      open
        ? `post-write-${programId}-${editingPost?.id ?? 'new'}-${editingPost?.updatedAt ?? ''}`
        : 'closed',
    [open, programId, editingPost?.id, editingPost?.updatedAt]
  )
  const inlineImageOwner = useMemo(
    () => programPostInlineImageOwner(parseFileObjectId(programId)),
    [programId]
  )
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    open,
    editingPost?.content ?? '',
    editorResetKey,
    {
      height: '280px',
      placeholder: '게시글 내용을 작성하세요',
      fileUploadOwner: inlineImageOwner,
    }
  )

  useEffect(() => {
    if (!open) {
      setAudience(defaultPostWriteAudience(program))
      setFiles([])
      setExistingAttachments([])
      loadedAttachmentIdsRef.current = null
      setFieldError(null)
      return
    }
    setAudience(postWriteAudienceFromStored(editingPost?.audience, program))
    setFiles([])
    if (!editingPost || editingPost.id.startsWith('temp-')) {
      setExistingAttachments([])
      loadedAttachmentIdsRef.current = null
      return
    }
    let cancelled = false
    void fetchGeneralProgramPostAttachments(programId, editingPost.id)
      .then(items => {
        if (cancelled) return
        const loaded = items.flatMap(item =>
          typeof item.fileObjectId === 'number'
            ? [
                {
                  fileObjectId: item.fileObjectId,
                  name: item.originalFileName?.trim() || `file-${item.fileObjectId}`,
                  fileSize: item.fileSize ?? 0,
                },
              ]
            : []
        )
        loadedAttachmentIdsRef.current = loaded.map(item => item.fileObjectId)
        setExistingAttachments(loaded)
      })
      .catch(() => {
        if (!cancelled) {
          loadedAttachmentIdsRef.current = null
          setExistingAttachments([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, program, programId, editingPost])

  const handleRemoveFile = (index: number) => {
    if (index < existingAttachments.length) {
      setExistingAttachments(prev => prev.filter((_, i) => i !== index))
      return
    }
    setFiles(prev => prev.filter((_, i) => i !== index - existingAttachments.length))
  }

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

  const handleRegister = async () => {
    const trimmed = getMarkdown().trim()
    if (!trimmed) {
      return
    }

    setLoading(true)
    try {
      const editingPostId =
        isEditMode && editingPost && !editingPost.id.startsWith('temp-')
          ? parseFileObjectId(editingPost.id)
          : null
      if (
        editingPostId != null &&
        files.length > 0 &&
        shouldUseGeneralProgramsRemoteApi() &&
        loadedAttachmentIdsRef.current == null
      ) {
        // PUT attachments 는 전체 교체라 기존 목록 없이 보내면 기존 첨부가 해제된다.
        showAlert({
          title: '안내',
          content: '기존 첨부파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      const owner = programPostFileOwner({
        programId: parseFileObjectId(programId) ?? 1,
        postId: editingPostId,
      })
      const uploadResults: Array<{
        fileName: string
        fileUrl: string
        fileSize: number
        fileObjectId: number
      }> = []
      for (const file of files) {
        const uploaded = await uploadAdminFileMaybeMock({ file, owner })
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
        trimmed
          .replace(/<img\b[^>]*>/gi, '')
          .replace(/!\[[^\]]*]\([^)]*\)/g, '')
          .replace(/[#*_`>\-[\]()]/g, '')
          .trim()
          .slice(0, 40) || '게시글'
      const inlineImageIds = collectFileObjectIdsFromHtml(trimmed)

      if (isEditMode && editingPost) {
        if (shouldUseGeneralProgramsRemoteApi() && !editingPost.id.startsWith('temp-')) {
          await updateGeneralProgramPost(programId, editingPost.id, {
            title,
            content: trimmed,
            visibilityType,
          })
          const nextAttachmentIds = [
            ...existingAttachments.map(item => item.fileObjectId),
            ...uploadResults.map(r => r.fileObjectId),
          ]
          const loadedIds = loadedAttachmentIdsRef.current
          const attachmentsChanged =
            uploadResults.length > 0 ||
            (loadedIds != null &&
              (loadedIds.length !== existingAttachments.length ||
                loadedIds.some((id, index) => existingAttachments[index]?.fileObjectId !== id)))
          if (attachmentsChanged) {
            await putGeneralProgramPostAttachments(programId, editingPost.id, nextAttachmentIds)
          }
          await putGeneralProgramPostInlineImages(programId, editingPost.id, inlineImageIds)
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
        if (createdPostId != null && inlineImageIds.length > 0) {
          await putGeneralProgramPostInlineImages(programId, String(createdPostId), inlineImageIds)
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
    } catch (error) {
      const data =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined
      const message = extractApiErrorMessage(data, {
        fallback: isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.',
      })
      const field = getApiErrorField(error) ?? ''
      if (field === 'content' || field === 'inlineImages' || field === 'attachments') {
        setFieldError({ field, message })
      } else {
        setFieldError(null)
        showAlert({ title: '안내', content: message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={isEditMode ? '게시글 수정' : '게시글 등록'}
      width={1000}
      className="post-write-modal"
      footer={
        <div className="post-write-modal__footer-actions">
          <CmsButton variant="secondary" size="h40" onClick={onCancel} disabled={loading}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="h40" onClick={handleRegister} loading={loading}>
            {isEditMode ? '수정' : '등록'}
          </CmsButton>
        </div>
      }
    >
      <div className="post-write-modal__body">
        <div className="post-write-modal__field">
          <CmsCheckbox.Group
            label="게시글 공개 범위"
            required
            checkboxSize="medium"
            options={audienceOptions}
            value={audience}
            onChange={vals =>
              setAudience(
                reconcilePostWriteAudienceSelection(vals as PostWriteAudienceApiKey[], program)
              )
            }
          />
        </div>

        <div className="post-write-modal__field post-write-modal__field--editor">
          <div className="post-write-modal__editor-host">
            <RichTextEditor
              editor={editor}
              minHeight={editorMinHeight}
              fileUploadOwner={inlineImageOwner}
            />
            {fieldError &&
            (fieldError.field === 'content' || fieldError.field === 'inlineImages') ? (
              <p className="text-area-field-row__field-error" role="alert">
                {fieldError.message}
              </p>
            ) : null}
          </div>
        </div>

        <DetailInfoForm
          title="첨부 파일"
          hideHeader
          mode="edit"
          className="post-write-modal__attachment-form"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="첨부 파일"
              colSpan={2}
              view=""
              edit={
                <>
                  <FileSelectField
                    accept=".jpg,.jpeg,.png"
                    fileNames={fileNames}
                    maxFileBytes={FILE_SELECT_MAX_FILE_BYTES}
                    maxTotalBytes={0}
                    onFilesChange={handleFilesChange}
                    onRemoveFile={handleRemoveFile}
                    uploading={loading}
                    guideLines={[
                      `- 파일당 최대 20MB까지 ${getAllowedExtensionsDescription()} 형식만 등록 가능합니다.`,
                      '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                    ]}
                    className="post-write-modal__file-field file-select-field--edit"
                  />
                  {fieldError?.field === 'attachments' ? (
                    <p className="text-area-field-row__field-error" role="alert">
                      {fieldError.message}
                    </p>
                  ) : null}
                </>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
