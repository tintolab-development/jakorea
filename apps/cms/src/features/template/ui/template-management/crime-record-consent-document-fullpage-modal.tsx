/**
 * 작성 양식 — 성범죄 경력조회 동의서 상세: 정적 A4 이미지 미리보기 풀페이지 모달
 */

import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { type ChangeEvent, useCallback, useId, useRef } from 'react'
import { useAgreementCrimeConsentDocumentEditor } from '@/features/template/hooks/use-agreement-crime-consent-document-editor'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { downloadBlob } from '@/shared/utils/file-download'
import './crime-record-consent-document-fullpage-modal.css'

export const CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE =
  '성범죄 경력 조회 및 아동학대 관련 범죄전력조회 동의서'

const DEFAULT_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.png'

const NOTICE_TEXT = '* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다.'

export interface CrimeRecordConsentDocumentFullpageModalProps {
  open: boolean
  onClose: () => void
}

export function CrimeRecordConsentDocumentFullpageModal({
  open,
  onClose,
}: CrimeRecordConsentDocumentFullpageModalProps) {
  const iconMaskId = `crime-consent-pen-mask-${useId().replace(/:/g, '')}`
  const { displaySrc, replacementFileName, handleImageFile } =
    useAgreementCrimeConsentDocumentEditor(open)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickDocument = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) return
      void handleImageFile(file)
    },
    [handleImageFile]
  )

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(displaySrc)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const filename =
        replacementFileName && replacementFileName.trim() !== ''
          ? replacementFileName
          : DEFAULT_DOWNLOAD_FILENAME
      await downloadBlob(blob, filename)
    } catch (error) {
      console.debug('crimeRecordConsentDocument download failed', error)
    }
  }, [displaySrc, replacementFileName])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title={CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
      size="full"
      hideHeader
      className="crime-consent-doc-modal"
    >
      <div className="crime-consent-doc-modal__layout">
        <header className="crime-consent-doc-modal__topbar">
          <div className="crime-consent-doc-modal__title-row">
            <span className="crime-consent-doc-modal__title-text">
              {CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
            </span>
            <svg
              className="crime-consent-doc-modal__title-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <g opacity="0.4">
                <mask
                  id={iconMaskId}
                  className="crime-consent-doc-modal__pen-mask"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                >
                  <rect width="28" height="28" fill="#D9D9D9" />
                </mask>
                <g mask={`url(#${iconMaskId})`}>
                  <path
                    d="M4.08203 28.0007C3.60486 28.0007 3.19391 27.8301 2.84916 27.4891C2.50441 27.148 2.33203 26.7352 2.33203 26.2507C2.33203 25.7735 2.50441 25.3625 2.84916 25.0178C3.19391 24.673 3.60486 24.5007 4.08203 24.5007H23.9154C24.3925 24.5007 24.8035 24.6712 25.1482 25.0123C25.493 25.3533 25.6654 25.7661 25.6654 26.2507C25.6654 26.7278 25.493 27.1388 25.1482 27.4835C24.8035 27.8283 24.3925 28.0007 23.9154 28.0007H4.08203ZM6.9987 19.1498H8.44128L18.1246 9.48422L17.3911 8.73959L16.6642 8.02384L6.9987 17.7072V19.1498ZM5.2487 19.8451V17.4021C5.2487 17.2615 5.27223 17.1276 5.31928 17.0005C5.36653 16.8733 5.4447 16.7551 5.55378 16.6458L18.3267 3.9023C18.4957 3.73333 18.6875 3.60548 18.9022 3.51876C19.1167 3.43203 19.3383 3.38867 19.5672 3.38867C19.8036 3.38867 20.0284 3.43203 20.2415 3.51876C20.4546 3.60548 20.6517 3.73935 20.8327 3.92038L22.2348 5.34051C22.4158 5.50948 22.5467 5.70237 22.6274 5.91917C22.7083 6.13617 22.7487 6.3628 22.7487 6.59905C22.7487 6.81605 22.7083 7.03178 22.6274 7.24626C22.5467 7.46092 22.4158 7.65877 22.2348 7.8398L9.49128 20.5833C9.382 20.6926 9.26388 20.7726 9.13691 20.8233C9.00974 20.8743 8.87586 20.8998 8.73528 20.8998H6.30336C6.00256 20.8998 5.75163 20.7991 5.55057 20.5979C5.34932 20.3968 5.2487 20.1459 5.2487 19.8451ZM18.1246 9.48422L17.3911 8.73959L16.6642 8.02384L18.1246 9.48422Z"
                    fill="#3D3D3D"
                  />
                </g>
              </g>
            </svg>
          </div>
          <button
            type="button"
            className="crime-consent-doc-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="crime-consent-doc-modal__body">
          <div className="crime-consent-doc-modal__toolbar">
            <div className="crime-consent-doc-modal__notice-wrap">
              <p className="crime-consent-doc-modal__notice">{NOTICE_TEXT}</p>
            </div>
            <div className="crime-consent-doc-modal__actions">
              <CmsButton
                variant="secondary"
                icon={<DownloadOutlined />}
                onClick={() => void handleDownload()}
                className="crime-consent-doc-modal__download-btn"
              >
                문서 다운로드
              </CmsButton>
              <CmsButton variant="primary" onClick={handlePickDocument}>
                문서 변경
              </CmsButton>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="crime-consent-doc-modal__visually-hidden-file"
            onChange={handleFileChange}
            aria-label="동의서 문서 이미지 선택"
          />

          <div className="crime-consent-doc-modal__a4-outer">
            <img
              className="crime-consent-doc-modal__a4-img"
              src={displaySrc}
              alt={CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
              width={1146}
              height={1618}
            />
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
