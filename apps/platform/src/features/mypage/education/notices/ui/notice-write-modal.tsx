import { useEffect, useMemo, useState } from 'react'
import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  useCreateApplicationNoticeMutation,
  useUpdateApplicationNoticeMutation,
} from '../../applications/api/activity-hooks'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import type { EducationInProgressNotice } from '../model/types'
import { deriveNoticeTitleFromHtml, isNoticeHtmlContentEmpty } from '../lib/derive-notice-title'
import {
  NOTICE_ATTACH_ACCEPT,
  NOTICE_ATTACH_HINT,
  validateNoticeAttachmentFile,
  validateNoticeAttachmentsBatch,
  PORTAL_PROGRAM_POST_INLINE_IMAGE_FILE_PURPOSE,
} from '../lib/notice-attach-policy'
import { resolvePortalNoticeWriteErrorMessage } from '../lib/notice-write-errors'
import { collectNoticeInlineImageFileObjectIds } from '../lib/validate-notice-content'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  reconcilePostWriteAudienceSelection,
  type PostWriteAudienceApiKey,
} from '../lib/post-write-audience'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PfRichTextEditor, useRichTextEditor } from '@/shared/rich-text'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFDescriptionList,
  PFFormFileAttach,
  PFItemDeleteButton,
  PFModal,
  PFText,
} from '@/shared/ui'
import styles from './notice-write-modal.module.css'

type PendingAttachment = {
  id: string
  file: File
}

type EducationProgramNoticeWriteModalProps = {
  open: boolean
  onClose: () => void
  applicationType: ProgramApplicationType
  applicationId: string
  program: ProgramDetail
  authorDisplayName: string
  notice?: EducationInProgressNotice | null
  onSaved?: () => void
}

export function EducationProgramNoticeWriteModal({
  open,
  onClose,
  applicationType,
  applicationId,
  program,
  authorDisplayName: _authorDisplayName,
  notice = null,
  onSaved,
}: EducationProgramNoticeWriteModalProps) {
  const editing = notice != null
  const [audience, setAudience] = useState<PostWriteAudienceApiKey[]>(() =>
    defaultPostWriteAudience(program)
  )
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const audienceOptions = useMemo(() => buildPostWriteAudienceOptions(program), [program])
  const [editorEpoch, setEditorEpoch] = useState(0)
  useEffect(() => {
    if (open) setEditorEpoch(epoch => epoch + 1)
  }, [open])

  const noticeId = notice?.id ?? ''
  const editorResetKey = open
    ? `education-notice-${editing ? `edit-${noticeId}` : 'write'}-${applicationId}-${editorEpoch}`
    : 'closed'

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: notice?.content ?? '',
    contentFormat: 'html',
    placeholder: '안내사항을 입력해 주세요.',
    resetKey: editorResetKey,
    resolveImageSrc: async file => {
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: PORTAL_PROGRAM_POST_INLINE_IMAGE_FILE_PURPOSE,
      })
      const referenceToken = `file-object:${fileObjectId}`
      return { src: referenceToken, persistSrc: referenceToken }
    },
  })

  const createMutation = useCreateApplicationNoticeMutation(applicationType, applicationId)
  const updateMutation = useUpdateApplicationNoticeMutation(applicationType, applicationId)

  useEffect(() => {
    if (!open) return
    setAudience(defaultPostWriteAudience(program))
    setAttachments([])
    setAttachError(null)
    setAlertMessage(null)
  }, [editing, open, program])

  const toggleAudience = (value: PostWriteAudienceApiKey, checked: boolean) => {
    setAudience(prev => {
      const next = checked ? [...prev, value] : prev.filter(key => key !== value)
      return reconcilePostWriteAudienceSelection(next, program)
    })
  }

  const handleAddFile = (file: File) => {
    const validationError = validateNoticeAttachmentFile(file)
    if (validationError) {
      setAttachError(validationError)
      return
    }
    const batchError = validateNoticeAttachmentsBatch(
      attachments.map(item => item.file),
      [file]
    )
    if (batchError) {
      setAttachError(batchError)
      return
    }
    setAttachError(null)
    setAttachments(prev => [...prev, { id: `${Date.now()}-${file.name}`, file }])
  }

  const handleRemoveFile = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async () => {
    if (audience.length === 0) {
      setAlertMessage('게시글 공개 범위를 선택해 주세요.')
      return
    }

    const content = (api?.getHTML() ?? '').trim()
    if (isNoticeHtmlContentEmpty(content)) {
      setAlertMessage('안내사항 내용을 입력해 주세요.')
      return
    }
    const inlineImageFileObjectIds = collectNoticeInlineImageFileObjectIds(content)
    if (inlineImageFileObjectIds == null) {
      setAlertMessage('본문 이미지는 파일로 삽입해 주세요.')
      return
    }

    const title = deriveNoticeTitleFromHtml(content)
    const visibilityType = buildPostWriteVisibilityType(audience)
    const organizationApplicationId =
      program.programAudience === 'organization' ? Number(applicationId) : undefined
    const orgId =
      organizationApplicationId != null && !Number.isNaN(organizationApplicationId)
        ? organizationApplicationId
        : undefined

    if (!isRemoteApiConfigured()) {
      setAlertMessage('API가 설정되지 않아 등록할 수 없습니다.')
      return
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          postId: notice.id,
          content,
          inlineImageFileObjectIds,
        })
      } else {
        await createMutation.mutateAsync({
          title,
          content,
          visibilityType,
          organizationApplicationId: orgId,
          attachmentFiles: attachments.map(item => item.file),
          inlineImageFileObjectIds,
        })
      }
      onSaved?.()
      onClose()
    } catch (error) {
      setAlertMessage(resolvePortalNoticeWriteErrorMessage(error))
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PFModal
        open={open}
        onClose={submitting ? () => {} : onClose}
        title={editing ? '안내사항 수정하기' : '안내사항 작성하기'}
        size="lg"
        mobilePlacement="full"
        className={styles.modal}
        closeOnBackdropClick={!submitting}
      >
        <div className={styles.body}>
          {!editing ? (
            <div className={styles.audienceField}>
              <div className={styles.audienceLabel}>
                <PFText
                  as="span"
                  typo="label-md"
                  color="neutral-warm-600"
                  className={styles.audienceLabelText}
                >
                  게시글 공개 범위
                </PFText>
                <PFText
                  as="span"
                  typo="bd-lg-sb"
                  color="error"
                  className={styles.audienceLabelRequired}
                  aria-hidden
                >
                  *
                </PFText>
              </div>
              <div className={styles.audienceChecks}>
                {audienceOptions.map(option => (
                  <PFCheckbox
                    className={styles.audienceCheck}
                    key={option.value}
                    size="large"
                    checked={audience.includes(option.value)}
                    onChange={event => toggleAudience(option.value, event.target.checked)}
                  >
                    {option.label}
                  </PFCheckbox>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.editorWrap}>
            <PfRichTextEditor editor={editor} allowImageUrl={false} />
          </div>

          {!editing ? (
            <section className={styles.attachSection} aria-label="파일 첨부">
              <PFText
                as="p"
                typo="label-md"
                color="neutral-warm-600"
                className={styles.attachLabel}
              >
                파일 첨부
              </PFText>
              <PFFormFileAttach
                className={styles.addFileButton}
                accept={NOTICE_ATTACH_ACCEPT}
                buttonLabel="파일 추가하기"
                buttonVariant="tertiary"
                buttonSize="xlarge"
                buttonFullWidth
                disabled={submitting}
                onFileSelect={handleAddFile}
                error={attachError}
              />
              <PFDescriptionList
                items={[
                  NOTICE_ATTACH_HINT,
                  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                ]}
              />
              {attachments.length > 0 ? (
                <ul className={styles.attachList} aria-label="첨부된 파일">
                  {attachments.map(item => (
                    <li key={item.id} className={styles.attachListRow}>
                      <PFText
                        as="span"
                        typo="bd-md-md"
                        color="black"
                        className={styles.attachFileName}
                        title={item.file.name}
                      >
                        {item.file.name}
                      </PFText>
                      <PFItemDeleteButton
                        aria-label={`${item.file.name} 삭제`}
                        disabled={submitting}
                        onClick={() => handleRemoveFile(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <div className={styles.footer}>
            <PFButton
              type="button"
              className={styles.footerButton}
              variant="secondary"
              size="xlarge"
              disabled={submitting}
              onClick={onClose}
            >
              취소
            </PFButton>
            <PFButton
              type="button"
              className={styles.footerButton}
              variant="primary"
              size="xlarge"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (editing ? '수정 중…' : '등록 중…') : editing ? '수정' : '등록'}
            </PFButton>
          </div>
        </div>
      </PFModal>

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        onConfirm={() => setAlertMessage(null)}
      >
        {alertMessage}
      </PFAlertModal>
    </>
  )
}
