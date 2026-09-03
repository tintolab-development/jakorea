import { useMemo } from 'react'
import {
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_CLASS,
  type FormCertificatePreviewProps,
} from './form-certificate-preview'
import { useFormTemplateCertificateModalState } from './use-form-template-certificate-modal-state'

type ModalState = ReturnType<typeof useFormTemplateCertificateModalState>

/**
 * 양식 모달 상태에서 좌측 미리보기(interactive)와 PDF용 클론(pdfExport)에 동일 데이터를 공급합니다.
 * 미리보기는 고유번호 플레이스홀더만 쓰고, 실번호는 PDF 캡처(pdfExport)에만 넣습니다.
 */
export function useFormCertificatePreviewProps(
  state: ModalState,
  issueDate?: Date,
  serialNumber?: string
) {
  return useMemo(() => {
    const common: Omit<FormCertificatePreviewProps, 'activeFieldName' | 'onRegionClick' | 'className'> = {
      orgLogoPreviewSrc: state.orgLogoPreviewSrc,
      orgLogo02PreviewSrc: state.orgLogo02PreviewSrc,
      certificateBackgroundPreviewSrc: state.certificateBackgroundPreviewSrc,
      chairmanSealPreviewSrc: state.chairmanSealPreviewSrc,
      titleText: state.stringPreviewValues.titleName,
      bodyContent: state.stringPreviewValues.bodyContent,
      chairmanNameDisplay: state.stringPreviewValues.chairmanName,
      participantInfo: state.stringPreviewValues.participantInfo,
      issueDate,
      participantRowVisibility: state.participantRowVisibility,
      orgAddress: state.stringPreviewValues.orgAddress,
      orgPhone: state.stringPreviewValues.orgPhone,
      orgFax: state.stringPreviewValues.orgFax,
      orgWebsite: state.stringPreviewValues.orgWebsite,
    }

    const interactive: FormCertificatePreviewProps = {
      ...common,
      activeFieldName: state.activeFieldName,
      onRegionClick: state.setActiveFieldName,
    }

    const pdfExport: FormCertificatePreviewProps = {
      ...common,
      serialNumber,
      activeFieldName: null,
      className: FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_CLASS,
    }

    return { interactive, pdfExport }
  }, [
    state.orgLogoPreviewSrc,
    state.orgLogo02PreviewSrc,
    state.certificateBackgroundPreviewSrc,
    state.chairmanSealPreviewSrc,
    state.stringPreviewValues,
    state.participantRowVisibility,
    state.activeFieldName,
    state.setActiveFieldName,
    issueDate,
    serialNumber,
  ])
}
