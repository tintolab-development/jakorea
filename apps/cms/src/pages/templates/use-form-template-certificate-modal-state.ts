import { useEffect, useMemo, useState } from 'react'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import {
  createDefaultParticipantRowVisibility,
  DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/features/template/ui/template-management/template-custom-fields-form'

/** 인증서 상세 진입 시 좌측·우측 기본 포커스 */
const INITIAL_ACTIVE_FIELD_NAME = TEMPLATE_FIELD_CERTIFICATE_BACKGROUND
import { useObjectUrlFromFile } from '@/shared/hooks/use-object-url-from-file'

export type CertificateModalInitialHydration = {
  logoUploadResults?: Record<string, FileUploadResult>
  participantRowVisibility?: boolean[]
}

export function useFormTemplateCertificateModalState(
  open: boolean,
  initialStringValues?: Record<string, string>,
  initialHydration?: CertificateModalInitialHydration
) {
  const resolvedInitialStringValues = useMemo(
    () => ({
      ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
      ...initialStringValues,
    }),
    [initialStringValues]
  )
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null)
  const [orgLogo02File, setOrgLogo02File] = useState<File | null>(null)
  const [certificateBackgroundFile, setCertificateBackgroundFile] = useState<File | null>(null)
  const [chairmanSealFile, setChairmanSealFile] = useState<File | null>(null)

  const [logoUploadResults, setLogoUploadResults] = useState<Record<string, FileUploadResult>>({})

  const orgLogoPreviewSrc =
    useObjectUrlFromFile(orgLogoFile) ?? logoUploadResults[TEMPLATE_FIELD_ORG_LOGO]?.url
  const orgLogo02PreviewSrc =
    useObjectUrlFromFile(orgLogo02File) ?? logoUploadResults[TEMPLATE_FIELD_ORG_LOGO_02]?.url
  const certificateBackgroundPreviewSrc =
    useObjectUrlFromFile(certificateBackgroundFile) ??
    logoUploadResults[TEMPLATE_FIELD_CERTIFICATE_BACKGROUND]?.url
  const chairmanSealPreviewSrc =
    useObjectUrlFromFile(chairmanSealFile) ?? logoUploadResults[TEMPLATE_FIELD_CHAIRMAN_SEAL]?.url

  const [activeFieldName, setActiveFieldName] = useState<string | null>(null)
  const [stringPreviewValues, setStringPreviewValues] = useState(() => ({
    ...resolvedInitialStringValues,
  }))
  const [participantRowVisibility, setParticipantRowVisibility] = useState(() =>
    createDefaultParticipantRowVisibility()
  )

  // 진입 시 수료증 배경 선택 · 닫을 때만 해제 (hydration 재실행으로 포커스 뺏지 않음)
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- default focus on dialog open
      setActiveFieldName(INITIAL_ACTIVE_FIELD_NAME)
      return
    }
    setActiveFieldName(null)
  }, [open])

  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 행별 기본값을 좌측 미리보기 상태에도 반영
      // eslint-disable-next-line react-hooks/set-state-in-effect -- apply row defaults when dialog opens
      setStringPreviewValues({ ...resolvedInitialStringValues })
      setLogoUploadResults(initialHydration?.logoUploadResults ?? {})
      setParticipantRowVisibility(
        initialHydration?.participantRowVisibility ?? createDefaultParticipantRowVisibility()
      )
      return
    }

    // 모달 닫힘 시 미리보기·폼 상태 초기화
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when dialog closes
    setOrgLogoFile(null)
    setOrgLogo02File(null)
    setCertificateBackgroundFile(null)
    setChairmanSealFile(null)
    setLogoUploadResults({})
    setStringPreviewValues({ ...resolvedInitialStringValues })
    setParticipantRowVisibility(createDefaultParticipantRowVisibility())
  }, [open, resolvedInitialStringValues, initialHydration])

  return {
    orgLogoFile,
    setOrgLogoFile,
    orgLogo02File,
    setOrgLogo02File,
    certificateBackgroundFile,
    setCertificateBackgroundFile,
    chairmanSealFile,
    setChairmanSealFile,
    orgLogoPreviewSrc,
    orgLogo02PreviewSrc,
    certificateBackgroundPreviewSrc,
    chairmanSealPreviewSrc,
    logoUploadResults,
    setLogoUploadResults,
    activeFieldName,
    setActiveFieldName,
    stringPreviewValues,
    setStringPreviewValues,
    participantRowVisibility,
    setParticipantRowVisibility,
  }
}
