import { useState } from 'react'
import { Input } from 'antd'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'
import customInstance from '@/shared/api/orval-mutator'
import type { FormSubmissionFileDownloadResponse } from '@/shared/api/generated/dashboard/schemas/formSubmissionFileDownloadResponse'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { AttachmentDownloadIcon } from '@/shared/ui'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import { downloadBlob } from '@/shared/utils/file-download'
import './evidence-files.css'

type EvidenceFilesProps = {
  files: readonly VolunteerApplicationEvidenceAttachment[]
}

async function fetchEvidenceDownloadPolicy(
  file: VolunteerApplicationEvidenceAttachment,
): Promise<FormSubmissionFileDownloadResponse> {
  return unwrapApiBody<FormSubmissionFileDownloadResponse>(
    await customInstance({
      url: file.downloadPolicyPath,
      method: 'GET',
    }),
  )
}

async function saveEvidenceBlob(
  file: VolunteerApplicationEvidenceAttachment,
  policy: FormSubmissionFileDownloadResponse,
  reason: string,
): Promise<void> {
  const fileName = file.originalFileName.trim() || `증빙서류-${file.fileObjectId}`
  if (policy.sensitive) {
    const blob = await loadSensitiveAdminFileBlob({
      fileObjectId: file.fileObjectId,
      reason,
      claimPath: policy.downloadEndpoint,
    })
    // sensitive-downloads/stream 이 file-access 이력을 남긴다 — client 로그 중복 방지
    await downloadBlob(blob, fileName, { skipAccessLog: true })
    return
  }
  const endpoint = policy.downloadEndpoint?.trim()
  if (!endpoint) throw new Error('다운로드 URL이 없습니다.')
  const blob = await customInstance<Blob>({
    url: endpoint,
    method: 'GET',
    responseType: 'blob',
  })
  await downloadBlob(blob, fileName)
}

/** 이전 참여 JA 봉사 프로그램 증빙. 민감 파일은 사유를 받은 뒤 내려받는다. */
export function VolunteerEvidenceFileList({ files }: EvidenceFilesProps) {
  const [pending, setPending] = useState<{
    file: VolunteerApplicationEvidenceAttachment
    policy: FormSubmissionFileDownloadResponse
  } | null>(null)
  const [reason, setReason] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const close = () => {
    if (downloadingId != null) return
    setPending(null)
    setReason('')
    setErrorText(null)
  }

  const startDownload = async (file: VolunteerApplicationEvidenceAttachment) => {
    setDownloadingId(file.submissionFileId)
    setErrorText(null)
    try {
      const policy = await fetchEvidenceDownloadPolicy(file)
      if (policy.sensitive) {
        setPending({ file, policy })
        setReason('')
        setErrorText(null)
        return
      }
      await saveEvidenceBlob(file, policy, '')
    } catch {
      setErrorText('증빙서류 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setDownloadingId(null)
    }
  }

  const confirm = async () => {
    if (!pending) return
    const trimmed = reason.trim()
    if (trimmed.length < 1 || trimmed.length > 500) {
      setErrorText('다운로드 사유는 1자 이상 500자 이하로 입력해 주세요.')
      return
    }
    setErrorText(null)
    setDownloadingId(pending.file.submissionFileId)
    try {
      await saveEvidenceBlob(pending.file, pending.policy, trimmed)
      setPending(null)
      setReason('')
    } catch {
      setErrorText('증빙서류 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (files.length === 0) return null

  return (
    <>
      <div className="general-volunteer-evidence-files">
        {files.map(file => (
          <button
            key={file.submissionFileId}
            type="button"
            className="general-volunteer-evidence-files__file"
            disabled={downloadingId === file.submissionFileId}
            title={file.originalFileName}
            onClick={() => void startDownload(file)}
          >
            <AttachmentDownloadIcon className="general-volunteer-evidence-files__file-icon" />
            <span className="general-volunteer-evidence-files__file-name">
              {file.originalFileName}
            </span>
          </button>
        ))}
        {errorText && pending == null ? (
          <p className="general-volunteer-evidence-files__error">{errorText}</p>
        ) : null}
      </div>
      <ContentModal
        open={pending != null}
        onCancel={close}
        title="증빙서류 다운로드"
        width={480}
        description="개인정보가 포함된 파일입니다. 다운로드 사유를 입력해 주세요."
        footer={
          <>
            <CmsButton variant="secondary" size="medium" type="button" disabled={downloadingId != null} onClick={close}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="button" disabled={downloadingId != null} onClick={() => void confirm()}>
              다운로드
            </CmsButton>
          </>
        }
      >
        <Input.TextArea
          value={reason}
          maxLength={500}
          rows={3}
          placeholder="다운로드 사유"
          status={errorText ? 'error' : undefined}
          onChange={event => setReason(event.target.value)}
        />
        {errorText ? <p className="general-volunteer-evidence-files__error">{errorText}</p> : null}
      </ContentModal>
    </>
  )
}
