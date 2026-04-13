import { useMemo } from 'react'
import {
  DEFAULT_PARTICIPANT_ROW_VISIBILITY,
  PARTICIPANT_INFO_ROW_COUNT,
} from '@/features/template/ui/template-custom-fields-form'
import { resolveCanvasRegion } from './form-certificate-preview-mapping'
import { splitParticipantValues } from './form-certificate-preview-utils'

export interface CertificatePreviewModelInput {
  activeFieldName?: string | null
  bodyContent: string
  participantInfo: string
  participantRowVisibility?: boolean[]
}

/**
 * 미리보기에 필요한 파생 값 — 필드 선택 영역, 본문 줄, 참여자 값/행 가시성
 */
export function useCertificatePreviewModel({
  activeFieldName,
  bodyContent,
  participantInfo,
  participantRowVisibility,
}: CertificatePreviewModelInput) {
  const region = useMemo(() => resolveCanvasRegion(activeFieldName), [activeFieldName])

  const confirmLines = useMemo(() => bodyContent.split('\n'), [bodyContent])

  const participantValues = useMemo(
    () => splitParticipantValues(participantInfo, PARTICIPANT_INFO_ROW_COUNT),
    [participantInfo]
  )

  const rowVisibility = participantRowVisibility ?? DEFAULT_PARTICIPANT_ROW_VISIBILITY

  return {
    region,
    confirmLines,
    participantValues,
    rowVisibility,
  }
}
