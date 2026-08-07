/**
 * 유관기관 로고 배너 수정 모달
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { FooterRelatedLogo } from '@/entities/footer/model/types'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  FileSelectField,
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'

import './related-logo-form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 배너 사이즈는 195*60입니다.',
]

const MODAL_DESCRIPTION =
  '유관기관의 로고 이미지와 문구를 설정해 주세요. 기관명은 홈페이지에서 별도 노출되지 않습니다.'

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="#BDBDBD" strokeWidth="2" />
      <circle cx="17" cy="20" r="3" fill="#BDBDBD" />
      <path
        d="M8 32L18 24L24 29L32 20L40 32"
        stroke="#BDBDBD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type RelatedLogoFormValues = {
  isActive: boolean
  name: string
  logoUrl: string
  logoFileName?: string
}

type Props = {
  open: boolean
  initial: FooterRelatedLogo | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: RelatedLogoFormValues) => void
}

export function RelatedLogoFormModal({
  open,
  initial,
  confirmLoading = false,
  onCancel,
  onSubmit,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [isActive, setIsActive] = useState(true)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFileName, setLogoFileName] = useState('')

  useEffect(() => {
    if (!open || !initial) return
    setIsActive(initial.isActive)
    setName(initial.name)
    setLogoUrl(initial.logoUrl)
    setLogoFileName(initial.logoFileName ?? '')
  }, [open, initial])

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: 'JPG, PNG 형식의 이미지만 등록할 수 있습니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: FILE_SELECT_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded()
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setLogoUrl(dataUrl)
        setLogoFileName(file.name)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const handleSubmit = useCallback(() => {
    onSubmit({
      isActive,
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      logoFileName: logoFileName || undefined,
    })
  }, [isActive, logoFileName, logoUrl, name, onSubmit])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="유관기관 로고 배너 수정"
      description={MODAL_DESCRIPTION}
      size="default"
      className="footer-related-logo-form-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title="유관기관 로고"
        hideHeader
        mode="edit"
        className="footer-related-logo-form-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="사용 여부"
            view={null}
            edit={
              <CmsRadioGroup
                size="medium"
                value={isActive}
                onChange={e => setIsActive(coerceRadioBoolean(e.target.value))}
              >
                <CmsRadio size="medium" value={true}>
                  사용
                </CmsRadio>
                <CmsRadio size="medium" value={false}>
                  미사용
                </CmsRadio>
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기관명"
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                value={name}
                placeholder="기관명을 입력하세요"
                onChange={e => setName(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="로고 이미지"
            view={null}
            edit={
              <div className="footer-related-logo-form-modal__image-row">
                <div className="footer-related-logo-form-modal__preview">
                  {logoUrl ? (
                    <img src={logoUrl} alt="로고 미리보기" />
                  ) : (
                    <ImagePlaceholderIcon />
                  )}
                </div>
                <FileSelectField
                  className="footer-related-logo-form-modal__file-field"
                  multiple={false}
                  accept={IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={logoFileName ? [logoFileName] : []}
                  guideLines={IMAGE_GUIDE_LINES}
                  onFilesChange={files => {
                    void handleFilesChange(files)
                  }}
                  onRemoveFile={() => {
                    setLogoUrl('')
                    setLogoFileName('')
                  }}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
