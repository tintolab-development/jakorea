import { useEffect, useId, useState } from 'react'
import { Form } from 'antd'
import {
  FILE_DOWNLOAD_PASSWORD_NOT_STORED_MESSAGE,
  FILE_DOWNLOAD_PASSWORD_RULE_MESSAGE,
  formatContainedPiiLead,
  validateFileDownloadPasswordConfirm,
  type ContainedPiiType,
} from '@jakorea/domain/shared/file-download-password'
import {
  resolveContainedPiiTypes,
  type ProtectedFileDownloadKind,
} from '@jakorea/domain/shared/protected-file-download-kinds'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
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
  const { showAlert } = useCmsAlert()
  const passwordId = useId()
  const confirmId = useId()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!open) return
    setPassword('')
    setConfirmPassword('')
  }, [open])

  const lead = formatContainedPiiLead(resolveContainedPiiTypes(kind, containedPiiTypes))

  const handleConfirm = () => {
    const error = validateFileDownloadPasswordConfirm(password, confirmPassword)
    if (error) {
      showAlert({
        title: '안내',
        content: error,
      })
      return
    }
    void onConfirm(password)
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
            size="large"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            onClick={handleConfirm}
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
          <label className="file-password-setup-modal__label" htmlFor={passwordId}>
            파일 암호{' '}
            <span className="file-password-setup-modal__required" aria-hidden>
              *
            </span>
          </label>
          <CmsInput
            id={passwordId}
            type="password"
            autoComplete="new-password"
            allowClear={false}
            value={password}
            onChange={e => setPassword(e.target.value)}
            width="100%"
            placeholder="사용할 암호를 입력해 주세요"
          />
          <label className="file-password-setup-modal__label" htmlFor={confirmId}>
            파일 암호 확인{' '}
            <span className="file-password-setup-modal__required" aria-hidden>
              *
            </span>
          </label>
          <CmsInput
            id={confirmId}
            type="password"
            autoComplete="new-password"
            allowClear={false}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            width="100%"
            placeholder="암호를 한 번 더 입력해 주세요"
          />
        </div>
      </Form>
    </ContentModal>
  )
}
