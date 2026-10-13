import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProgramApplicationType } from '../../applications/api/types'
import { createPortalProgramNotice } from '../api/notice-compose-client'
import { appendMockEducationInProgressNotice } from '../lib/mock-notices'
import { educationProgramNoticeTabPath } from '../lib/notice-path'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'
import { PfRichTextEditor, useRichTextEditor } from '@/shared/rich-text'
import { PFAlertModal, PFButton, PFFormField, PFText, PFTextInput } from '@/shared/ui'
import styles from './notice-write-form.module.css'

type EducationProgramNoticeWriteFormProps = {
  applicationId: string
  applicationType: ProgramApplicationType
  programId: string
  authorDisplayName: string
}

export function EducationProgramNoticeWriteForm({
  applicationId,
  applicationType,
  programId,
  authorDisplayName,
}: EducationProgramNoticeWriteFormProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const editorResetKey = useMemo(
    () => `education-notice-write-${applicationId}`,
    [applicationId],
  )

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: '',
    contentFormat: 'markdown',
    placeholder: '안내사항 내용을 작성해 주세요.',
    resetKey: editorResetKey,
  })

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const content = (api?.getMarkdown() ?? '').trim()
    if (!trimmedTitle || !content) {
      setAlertMessage('제목과 내용을 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const useMockPersist = !isRemoteApiConfigured() || shouldUsePlatformMockData()
      if (useMockPersist) {
        appendMockEducationInProgressNotice({
          programId,
          title: trimmedTitle,
          content,
          authorName: authorDisplayName,
        })
      } else {
        await createPortalProgramNotice({
          applicationType,
          applicationId,
          title: trimmedTitle,
          content,
        })
      }
      navigate(educationProgramNoticeTabPath(applicationId), { replace: true })
    } catch {
      setAlertMessage('안내사항을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className={styles.root}>
        <div className={styles.field}>
          <PFFormField label="제목" required>
            <PFTextInput
              value={title}
              onValueChange={setTitle}
              placeholder="제목을 입력해 주세요."
              maxLength={200}
            />
          </PFFormField>
        </div>

        <div className={styles.field}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            내용
          </PFText>
          <div className={styles.editorWrap}>
            <PfRichTextEditor editor={editor} />
          </div>
        </div>

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            등록하기
          </PFButton>
        </div>
      </div>

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
