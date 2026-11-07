import { useCallback, useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  downloadParticipant1365RegistrationJson,
  fetchParticipant1365RegistrationFormRemote,
  type Participant1365RegistrationFormResponse,
} from '@/features/program/shared/api/participant-1365-registration-form'

type GeneralVolunteer1365PreviewModalProps = {
  open: boolean
  programId: string
  participantId: number
  onCancel: () => void
}

export function GeneralVolunteer1365PreviewModal({
  open,
  programId,
  participantId,
  onCancel,
}: GeneralVolunteer1365PreviewModalProps) {
  const { showAlert } = useCmsAlert()
  const [preview, setPreview] = useState<Participant1365RegistrationFormResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setPreview(null)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchParticipant1365RegistrationFormRemote({
      programId,
      participantId,
      mode: 'PREVIEW',
    })
      .then(payload => {
        if (!cancelled) setPreview(payload)
      })
      .catch(error => {
        if (cancelled) return
        setPreview(null)
        showAlert({
          title: '1365 양식 미리보기',
          content: getGeneralProgramApiErrorMessage(
            error,
            '1365 봉사시간 등록 양식을 불러오지 못했습니다.',
          ),
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, participantId, programId, showAlert])

  const handleDownload = useCallback(async () => {
    try {
      const payload = await fetchParticipant1365RegistrationFormRemote({
        programId,
        participantId,
        mode: 'DOWNLOAD',
      })
      downloadParticipant1365RegistrationJson(payload)
    } catch (error) {
      showAlert({
        title: '1365 양식 다운로드',
        content: getGeneralProgramApiErrorMessage(
          error,
          '1365 봉사시간 등록 양식을 다운로드하지 못했습니다.',
        ),
      })
    }
  }, [participantId, programId, showAlert])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="1365 봉사시간 등록 양식 미리보기"
      footer={
        <CmsButton type="button" variant="primary" onClick={() => void handleDownload()}>
          다운로드
        </CmsButton>
      }
    >
      {loading ? (
        <p>불러오는 중…</p>
      ) : preview ? (
        <dl>
          <div>
            <dt>이름</dt>
            <dd>{preview.name ?? '-'}</dd>
          </div>
          <div>
            <dt>생년월일</dt>
            <dd>{preview.birthDate ?? '-'}</dd>
          </div>
          <div>
            <dt>1365 ID</dt>
            <dd>{preview.external1365Id ?? '-'}</dd>
          </div>
          <div>
            <dt>봉사 시간(분)</dt>
            <dd>{preview.volunteerMinutes ?? 0}</dd>
          </div>
        </dl>
      ) : null}
    </ContentModal>
  )
}
