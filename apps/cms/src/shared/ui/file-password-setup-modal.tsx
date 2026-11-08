import { useEffect, useId, useState } from 'react'
import { Form } from 'antd'
import {
  FILE_DOWNLOAD_PASSWORD_NOT_STORED_MESSAGE,
  FILE_DOWNLOAD_PASSWORD_RULE_MESSAGE,
  fileDownloadPasswordSubmitFieldErrors,
  formatContainedPiiLead,
  type ContainedPiiType,
} from '@jakorea/domain/shared/file-download-password'
import {
  resolveContainedPiiTypes,
  type ProtectedFileDownloadKind,
} from '@jakorea/domain/shared/protected-file-download-kinds'
import { getFileDownloadPasswordFormError } from '@/shared/lib/file-download-password-api-error'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui'
import './file-password-setup-modal.css'

export interface FilePasswordSetupModalProps {
  open: boolean
  kind: ProtectedFileDownloadKind
  containedPiiTypes?: readonly ContainedPiiType[] | null
  confirmLoading?: boolean
  zIndex?: number
  onCancel: () => void
  onConfirm: (password: string) => void | Promise<void>
}

export function FilePasswordSetupModal({
  open,
  kind,
  containedPiiTypes,
  confirmLoading = false,
  zIndex,
  onCancel,
  onConfirm,
}: FilePasswordSetupModalProps) {
  const passwordId = useId()
  const confirmId = useId()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setConfirmError(null)
  }, [open])

  const lead = formatContainedPiiLead(resolveContainedPiiTypes(kind, containedPiiTypes))

  const handleConfirm = async () => {
    const local = fileDownloadPasswordSubmitFieldErrors(password, confirmPassword)
    setPasswordError(local.password ?? null)
    setConfirmError(local.confirm ?? null)
    if (local.password || local.confirm) return
    try {
      await onConfirm(password)
    } catch (error) {
      const fieldError = getFileDownloadPasswordFormError(error)
      if (fieldError) setPasswordError(fieldError)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="파일 암호 설정 안내"
      width={600}
      zIndex={zIndex}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="h40"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            type="button"
            loading={confirmLoading}
            onClick={() => void handleConfirm()}
          >
            다운로드
          </CmsButton>
        </>
      }
    >
      <Form component={false} colon={false} requiredMark={false} preserve={false}>
        <div className="file-password-setup-modal">
          <p className="file-password-setup-modal__lead">
            {lead}
            <br />
            {FILE_DOWNLOAD_PASSWORD_RULE_MESSAGE}
            <br />
            {FILE_DOWNLOAD_PASSWORD_NOT_STORED_MESSAGE}
          </p>
          {/* 시안 Field / Input M(40): 라벨 14 Medium #525252 · 라벨↔입력 6 · 필드 사이 30 (15984:378448) */}
          <CmsInput
            id={passwordId}
            className="file-password-setup-modal__field"
            label="파일 암호"
            required
            inputSize="medium"
            type="password"
            autoComplete="new-password"
            allowClear={false}
            value={password}
            error={passwordError != null}
            message={passwordError ?? undefined}
            onChange={e => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError(null)
            }}
            width="100%"
            placeholder="사용할 암호를 입력해 주세요"
          />
          <CmsInput
            id={confirmId}
            className="file-password-setup-modal__field"
            label="파일 암호 확인"
            required
            inputSize="medium"
            type="password"
            autoComplete="new-password"
            allowClear={false}
            value={confirmPassword}
            error={confirmError != null}
            message={confirmError ?? undefined}
            onChange={e => {
              setConfirmPassword(e.target.value)
              if (confirmError) setConfirmError(null)
            }}
            width="100%"
            placeholder="암호를 한 번 더 입력해 주세요"
          />
        </div>
      </Form>
    </ContentModal>
  )
}
