import { useCallback } from 'react'
import { message } from 'antd'
import { TemplateFullpageModal } from '@/shared/components/template/template-fullpage-modal'
import {
  type TemplateCustomFieldDef,
  TemplateCustomFieldsForm,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/shared/components/template/template-custom-fields-form'
import { FormCertificatePreview } from './form-certificate-preview'
import { saveFormTemplateSettings } from './form-template-api'
import { useFormTemplateCertificateModalState } from './use-form-template-certificate-modal-state'

export interface FormTemplateFullpageModalProps {
  open: boolean
  onClose: () => void
}

export function FormTemplateFullpageModal({ open, onClose }: FormTemplateFullpageModalProps) {
  const {
    setOrgLogo02File,
    setCertificateBackgroundFile,
    setChairmanSealFile,
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
  } = useFormTemplateCertificateModalState(open)

  const handleSave = useCallback(async () => {
    const hideLoading = message.loading('저장 중…', 0)
    try {
      await saveFormTemplateSettings({
        orgLogo: logoUploadResults.orgLogo,
        orgLogo02: logoUploadResults.orgLogo02,
        certificateBackground: logoUploadResults.certificateBackground,
        chairmanSeal: logoUploadResults.chairmanSeal,
      })
      message.success('양식 설정이 저장되었습니다.')
    } catch {
      message.error('저장에 실패했습니다.')
    } finally {
      hideLoading()
    }
  }, [logoUploadResults])

  return (
    <TemplateFullpageModal
      className="form-template-fullpage-modal"
      open={open}
      onClose={onClose}
      title="봉사활동인증서"
      description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
      templateTabType="issuance"
      onPreview={() => {
        message.info('미리보기는 준비 중입니다.')
      }}
      onSave={handleSave}
      onDownloadDocument={() => {
        message.info('문서 다운로드는 준비 중입니다.')
      }}
      leftContent={
        <FormCertificatePreview
          orgLogo02PreviewSrc={orgLogo02PreviewSrc}
          certificateBackgroundPreviewSrc={certificateBackgroundPreviewSrc}
          chairmanSealPreviewSrc={chairmanSealPreviewSrc}
          activeFieldName={activeFieldName}
          onRegionClick={setActiveFieldName}
          titleText={stringPreviewValues.titleName}
          bodyContent={stringPreviewValues.bodyContent}
          chairmanNameDisplay={stringPreviewValues.chairmanName}
          participantInfo={stringPreviewValues.participantInfo}
          participantRowVisibility={participantRowVisibility}
          orgAddress={stringPreviewValues.orgAddress}
          orgPhone={stringPreviewValues.orgPhone}
          orgFax={stringPreviewValues.orgFax}
          orgWebsite={stringPreviewValues.orgWebsite}
        />
      }
      rightNavigation={
        <TemplateCustomFieldsForm
          key={open ? 'form-template-fields' : 'form-template-fields-closed'}
          selectedFieldName={activeFieldName}
          onFieldClick={field => setActiveFieldName(field.name)}
          onSecondaryValueChange={(field: TemplateCustomFieldDef, value: string) => {
            setStringPreviewValues(prev => ({ ...prev, [field.name]: value }))
          }}
          onLogoFileSelected={(fieldName, file) => {
            if (fieldName === TEMPLATE_FIELD_ORG_LOGO_02) setOrgLogo02File(file)
            if (fieldName === TEMPLATE_FIELD_CERTIFICATE_BACKGROUND) setCertificateBackgroundFile(file)
            if (fieldName === TEMPLATE_FIELD_CHAIRMAN_SEAL) setChairmanSealFile(file)
          }}
          onLogoUploadResult={(fieldName, result) => {
            setLogoUploadResults(prev => ({ ...prev, [fieldName]: result }))
          }}
          participantRowVisibility={participantRowVisibility}
          onParticipantRowVisibilityChange={(index, checked) => {
            setParticipantRowVisibility(prev => {
              const next = [...prev]
              next[index] = checked
              return next
            })
          }}
        />
      }
    />
  )
}
