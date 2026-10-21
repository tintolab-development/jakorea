import { useEffect, useMemo, useRef, useState } from 'react'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import {
  createDefaultParticipantRowVisibility,
  DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/features/template/ui/template-management/template-custom-fields-form'
import { useObjectUrlFromFile } from '@/shared/hooks/use-object-url-from-file'

/** 인증서 상세 진입 시 좌측·우측 기본 포커스 */
const INITIAL_ACTIVE_FIELD_NAME = TEMPLATE_FIELD_CERTIFICATE_BACKGROUND

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

  const initialsRef = useRef({
    stringValues: resolvedInitialStringValues,
    hydration: initialHydration,
  })
  initialsRef.current = {
    stringValues: resolvedInitialStringValues,
    hydration: initialHydration,
  }
  const hydrationReady = initialHydration != null

  // 열림·템플릿 hydration 도착 시에만 시드. 객체 identity 변경으로 재실행하지 않음.
  useEffect(() => {
    const { stringValues, hydration } = initialsRef.current
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when dialog closes
      setActiveFieldName(null)
      setOrgLogoFile(null)
      setOrgLogo02File(null)
      setCertificateBackgroundFile(null)
      setChairmanSealFile(null)
      setLogoUploadResults({})
      setStringPreviewValues({ ...stringValues })
      setParticipantRowVisibility(createDefaultParticipantRowVisibility())
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed on open / hydration
    setActiveFieldName(INITIAL_ACTIVE_FIELD_NAME)
    setStringPreviewValues({ ...stringValues })
    setLogoUploadResults(hydration?.logoUploadResults ?? {})
    setParticipantRowVisibility(
      hydration?.participantRowVisibility ?? createDefaultParticipantRowVisibility()
    )
  }, [open, hydrationReady])

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
