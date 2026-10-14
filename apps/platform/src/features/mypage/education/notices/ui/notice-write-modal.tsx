import { useEffect, useMemo, useState } from 'react'
import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../../applications/api/types'
import { useCreateApplicationNoticeMutation } from '../../applications/api/activity-hooks'
import {
  appendMockEducationInProgressFiles,
  appendMockEducationInProgressNotice,
} from '../lib/mock-notices'
import {
  deriveNoticeTitleFromHtml,
  isNoticeHtmlContentEmpty,
} from '../lib/derive-notice-title'
import {
  NOTICE_ATTACH_ACCEPT,
  validateNoticeAttachmentFile,
} from '../lib/notice-attach-policy'
import {
  buildPostWriteAudienceOptions,
  buildPostWriteVisibilityType,
  defaultPostWriteAudience,
  reconcilePostWriteAudienceSelection,
  type PostWriteAudienceApiKey,
} from '../lib/post-write-audience'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import { PfRichTextEditor, useRichTextEditor } from '@/shared/rich-text'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFFormField,
  PFFormFileAttach,
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
  onMockSuccess?: () => void
}

export function EducationProgramNoticeWriteModal({
  open,
  onClose,
  applicationType,
  applicationId,
  program,
  authorDisplayName,
  onMockSuccess,
}: EducationProgramNoticeWriteModalProps) {
  const [audience, setAudience] = useState<PostWriteAudienceApiKey[]>(() =>
    defaultPostWriteAudience(program),
  )
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const audienceOptions = useMemo(() => buildPostWriteAudienceOptions(program), [program])
  const [editorEpoch, setEditorEpoch] = useState(0)
  useEffect(() => {
    if (open) setEditorEpoch(epoch => epoch + 1)
  }, [open])

  const editorResetKey = useMemo(
    () => (open ? `education-notice-write-${applicationId}-${editorEpoch}` : 'closed'),
    [open, applicationId, editorEpoch],
  )

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: '',
    contentFormat: 'html',
    placeholder: '안내사항을 입력해 주세요.',
    resetKey: editorResetKey,
  })

  const createMutation = useCreateApplicationNoticeMutation(applicationType, applicationId)

  useEffect(() => {
    if (!open) return
    setAudience(defaultPostWriteAudience(program))
    setAttachments([])
    setAttachError(null)
    setAlertMessage(null)
  }, [open, program])

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

    const title = deriveNoticeTitleFromHtml(content)
    const visibilityType = buildPostWriteVisibilityType(audience)
    const organizationApplicationId =
      program.programAudience === 'organization' ? Number(applicationId) : undefined
    const orgId =
      organizationApplicationId != null && !Number.isNaN(organizationApplicationId)
        ? organizationApplicationId
        : undefined

    const useMockPersist = !isRemoteApiConfigured() || shouldUsePlatformMockData()

    try {
      if (useMockPersist) {
        const notice = appendMockEducationInProgressNotice({
          programId: program.id,
          title,
          content,
          authorName: authorDisplayName,
          attachmentCount: attachments.length,
        })
        if (attachments.length > 0) {
          appendMockEducationInProgressFiles(
            program.id,
            notice.id,
            attachments.map(item => ({
              fileName: item.file.name,
              fileSizeBytes: item.file.size,
            })),
          )
        }
        onMockSuccess?.()
        onClose()
        return
      }

      await createMutation.mutateAsync({
        title,
        content,
        visibilityType,
        organizationApplicationId: orgId,
        attachmentFiles: attachments.map(item => item.file),
      })
      onClose()
    } catch {
      setAlertMessage('안내사항을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const submitting = createMutation.isPending

  return (
    <>
      <PFModal
        open={open}
        onClose={submitting ? () => {} : onClose}
        title="안내사항 작성하기"
        size="lg"
        mobilePlacement="full"
        className={styles.modal}
        closeOnBackdropClick={!submitting}
      >
        <div className={styles.body}>
          <div className={styles.audienceField}>
            <PFFormField label="게시글 공개 범위" required>
              <div className={styles.audienceChecks}>
                {audienceOptions.map(option => (
                  <PFCheckbox
                    key={option.value}
                    size="large"
                    checked={audience.includes(option.value)}
                    onChange={event => toggleAudience(option.value, event.target.checked)}
                  >
                    {option.label}
                  </PFCheckbox>
                ))}
              </div>
            </PFFormField>
          </div>

          <div className={styles.editorWrap}>
            <PfRichTextEditor editor={editor} />
          </div>

          <section className={styles.attachSection} aria-label="파일 첨부">
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
              파일 첨부
            </PFText>
            <div className={styles.attachList}>
              {attachments.map(item => (
                <PFFormFileAttach
                  key={item.id}
                  hideTrigger
                  fileName={item.file.name}
                  onFileSelect={() => {}}
                  onRemove={() => handleRemoveFile(item.id)}
                />
              ))}
            </div>
            <PFFormFileAttach
              className={styles.addFileButton}
              accept={NOTICE_ATTACH_ACCEPT}
              buttonLabel="파일 추가하기"
              disabled={submitting}
              onFileSelect={handleAddFile}
              error={attachError}
            />
            <ul className={styles.attachHints}>
              <li>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500">
                  JPG, PNG 형식의 파일만 등록할 수 있으며, 파일 용량은 15MB 이하만 등록할 수
                  있습니다.
                </PFText>
              </li>
              <li>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500">
                  파일명에 특수문자가 포함된 경우 등록이 되지 않을 수 있습니다.
                </PFText>
              </li>
            </ul>
          </section>

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
              {submitting ? '등록 중…' : '등록'}
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
