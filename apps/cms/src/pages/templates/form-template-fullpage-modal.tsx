import { useCallback, useRef } from 'react'
import { message } from 'antd'
import { TemplateFullpageModal } from '@/shared/components/template/template-fullpage-modal'
import {
  type TemplateCustomFieldDef,
  TemplateCustomFieldsForm,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/shared/components/template/template-custom-fields-form'
import { generateFilename } from '@/shared/utils/file-download'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from './form-certificate-preview'
import { FormCertificatePdfExportOverlay } from './form-certificate-pdf-export-overlay'
import { saveFormTemplateSettings } from './form-template-api'
import { FormCertificateDocumentPreviewModal } from './form-certificate-document-preview-modal'
import { useFormCertificateDocumentPreviewModal } from './use-form-certificate-document-preview-modal'
import { useFormCertificatePdfDownload } from './use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from './use-form-certificate-preview-props'
import { useFormTemplateCertificateModalState } from './use-form-template-certificate-modal-state'

export interface FormTemplateFullpageModalProps {
  open: boolean
  onClose: () => void
}

export function FormTemplateFullpageModal({ open, onClose }: FormTemplateFullpageModalProps) {
  const modalState = useFormTemplateCertificateModalState(open)
  const {
    setOrgLogoFile,
    setOrgLogo02File,
    setCertificateBackgroundFile,
    setChairmanSealFile,
    logoUploadResults,
    setLogoUploadResults,
    activeFieldName,
    setActiveFieldName,
    setStringPreviewValues,
    participantRowVisibility,
    setParticipantRowVisibility,
    fieldTextColors,
    setFieldTextColors,
  } = modalState

  const { interactive: certificatePreviewProps, pdfExport: certificatePdfExportProps } =
    useFormCertificatePreviewProps(modalState)

  const { open: documentPreviewOpen, openPreview, closePreview } =
    useFormCertificateDocumentPreviewModal()

  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const buildPdfFilename = useCallback(() => generateFilename('봉사활동인증서', 'pdf'), [])

  const { downloadPdf, isDownloading: isPdfDownloading } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

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
    <>
    <FormCertificatePdfExportOverlay visible={isPdfDownloading} />
    <TemplateFullpageModal
      className="form-template-fullpage-modal"
      open={open}
      onClose={onClose}
      title="봉사활동인증서"
      description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
      templateTabType="issuance"
      onPreview={openPreview}
      onSave={handleSave}
      onDownloadDocument={downloadPdf}
      downloadDocumentLoading={isPdfDownloading}
      leftContent={
        <>
          <FormCertificatePreview {...certificatePreviewProps} />
          <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden>
            <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
          </div>
        </>
      }
      rightNavigation={
        <TemplateCustomFieldsForm
          key={open ? 'form-template-fields' : 'form-template-fields-closed'}
          selectedFieldName={activeFieldName}
          onFieldClick={field => setActiveFieldName(field?.name ?? null)}
          onSecondaryValueChange={(field: TemplateCustomFieldDef, value: string) => {
            setStringPreviewValues(prev => ({ ...prev, [field.name]: value }))
          }}
          onLogoFileSelected={(fieldName, file) => {
            if (fieldName === TEMPLATE_FIELD_ORG_LOGO) setOrgLogoFile(file)
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
          fieldTextColors={fieldTextColors}
          onFieldTextColorChange={(fieldName, color) => {
            setFieldTextColors(prev => ({ ...prev, [fieldName]: color }))
          }}
        />
      }
    />
    <FormCertificateDocumentPreviewModal
      open={documentPreviewOpen}
      onClose={closePreview}
      previewProps={certificatePdfExportProps}
    />
    </>
  )
}
