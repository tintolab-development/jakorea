import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import {
  CmsButton,
  CmsInput,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './org-chart-form-modal.css'

const IMAGE_ACCEPT = '.png,image/png'
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 PNG 형식만 등록 가능합니다.',
  '- 조직도 이미지의 권장 사이즈는 1440*826입니다.',
]

const MODAL_DESCRIPTION =
  '메인 타이틀 문구 및 조직도 이미지를 설정해 주세요.\n조직도 이미지는 배경 색상이 없는 투명 배경 이미지로 작업 후 png 형식으로만 업로드 가능합니다.'

function isAllowedPngFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/png') return true
  return file.name.toLowerCase().endsWith('.png')
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

type FormBodyProps = {
  initial: OrganizationChartInfo
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: OrganizationChartSaveInput) => void
}

function OrgChartFormBody({
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: FormBodyProps) {
  const { showAlert } = useCmsAlert()
  const [mainTitle, setMainTitle] = useState(initial.mainTitle)
  const [imageUrl, setImageUrl] = useState(initial.imageUrl)
  const [imageFileName, setImageFileName] = useState(initial.imageFileName ?? '')
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedPngFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: 'PNG 형식의 이미지만 등록할 수 있습니다.',
        })
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        showAlert({
          title: '파일 용량 초과',
          content: '파일은 최대 15MB까지 등록 가능합니다.',
        })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setImageUrl(dataUrl)
        setImageFileName(file.name)
        setPendingImageFile(file)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const handleRemoveFile = useCallback(() => {
    setImageUrl('')
    setImageFileName('')
    setPendingImageFile(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!mainTitle.trim()) {
      showAlert({
        title: '메인 문구 필수',
        content: '메인 타이틀을 입력해 주세요.',
      })
      return
    }
    if (!imageUrl.trim()) {
      showAlert({
        title: '조직도 이미지 필수',
        content: '조직도 이미지를 등록해 주세요.',
      })
      return
    }
    onSubmit({
      mainTitle: mainTitle.trim(),
      imageUrl,
      imageFileName: imageFileName || undefined,
      imageAssetId: pendingImageFile ? undefined : initial.imageAssetId,
      imageFile: pendingImageFile,
    })
  }, [
    imageFileName,
    imageUrl,
    initial.imageAssetId,
    mainTitle,
    onSubmit,
    pendingImageFile,
    showAlert,
  ])

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="소개글 및 조직도 수정"
      description={MODAL_DESCRIPTION}
      width={800}
      className="org-chart-form-modal"
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
        title="소개글 및 조직도 수정"
        hideHeader
        mode="edit"
        className="org-chart-form-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="메인"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="타이틀을 입력하세요"
                value={mainTitle}
                onChange={e => setMainTitle(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="조직도"
            required
            view={null}
            edit={
              <div className="org-chart-form-modal__image-row">
                <div
                  className={
                    imageUrl
                      ? 'org-chart-form-modal__preview'
                      : 'org-chart-form-modal__preview org-chart-form-modal__preview--empty'
                  }
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="조직도 미리보기" />
                  ) : (
                    <ImagePlaceholderIcon />
                  )}
                </div>
                <FileSelectField
                  className="org-chart-form-modal__file-field"
                  multiple={false}
                  accept={IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={imageFileName ? [imageFileName] : []}
                  onFilesChange={files => {
                    void handleFilesChange(files)
                  }}
                  onRemoveFile={handleRemoveFile}
                  guideLines={IMAGE_GUIDE_LINES}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}

export function OrgChartFormModal({
  open,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean
  initial: OrganizationChartInfo | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: OrganizationChartSaveInput) => void
}) {
  if (!open || !initial) return null

  return (
    <OrgChartFormBody
      key={`edit-${initial.updatedAt}-${initial.imageUrl}`}
      initial={initial}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}
