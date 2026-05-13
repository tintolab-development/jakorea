import { useEffect, useMemo, useState } from 'react'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import {
  createDefaultParticipantRowVisibility,
  DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
} from '@/features/template/ui/template-management/template-custom-fields-form'
import { useObjectUrlFromFile } from '@/shared/hooks/use-object-url-from-file'

export function useFormTemplateCertificateModalState(
  open: boolean,
  initialStringValues?: Record<string, string>
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

  const orgLogoPreviewSrc = useObjectUrlFromFile(orgLogoFile)
  const orgLogo02PreviewSrc = useObjectUrlFromFile(orgLogo02File)
  const certificateBackgroundPreviewSrc = useObjectUrlFromFile(certificateBackgroundFile)
  const chairmanSealPreviewSrc = useObjectUrlFromFile(chairmanSealFile)

  const [logoUploadResults, setLogoUploadResults] = useState<Record<string, FileUploadResult>>({})
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null)
  const [stringPreviewValues, setStringPreviewValues] = useState(() => ({
    ...resolvedInitialStringValues,
  }))
  const [participantRowVisibility, setParticipantRowVisibility] = useState(() =>
    createDefaultParticipantRowVisibility()
  )
  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 행별 기본값을 좌측 미리보기 상태에도 반영
      // eslint-disable-next-line react-hooks/set-state-in-effect -- apply row defaults when dialog opens
      setStringPreviewValues({ ...resolvedInitialStringValues })
      return
    }

    if (!open) {
      // 모달 닫힘 시 미리보기·폼 상태 초기화
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when dialog closes
      setOrgLogoFile(null)
      setOrgLogo02File(null)
      setCertificateBackgroundFile(null)
      setChairmanSealFile(null)
      setLogoUploadResults({})
      setActiveFieldName(null)
      setStringPreviewValues({ ...resolvedInitialStringValues })
      setParticipantRowVisibility(createDefaultParticipantRowVisibility())
    }
  }, [open, resolvedInitialStringValues])

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
