import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  CmsButton,
  CmsPeriodDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import type { Popup, PopupCreateInput } from '@/entities/popup/model/types'
import { shouldUsePopupRemoteApi } from '@/features/popup/api/capabilities'
import {
  HTTP_LINK_URL_FORMAT_ALERT,
  isValidHttpLinkUrl,
} from '@/shared/lib/http-link-url'
import './form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 배너 사이즈는 1920*1080입니다.',
]

const MODAL_DESCRIPTION =
  '홈페이지 진입 시 노출되는 팝업입니다.\n연결 링크가 설정된 경우, 팝업 클릭 시 입력된 주소가 새 창에서 열립니다.'

const WEEKDAY_KO_MIN = ['일', '월', '화', '수', '목', '금', '토'] as const

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

function formatYmdDot(ymd: string): string {
  if (!ymd) return '-'
  return ymd.replace(/-/g, '.')
}

function formatCreatedAt(iso: string): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return `${d.format('YYYY.MM.DD')}(${WEEKDAY_KO_MIN[d.day()]}) ${d.format('HH:mm')}`
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

export type PopupFormValues = PopupCreateInput

type FormBodyProps = {
  variant: 'create' | 'detail'
  initial?: Popup | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: PopupFormValues) => void
  onDelete?: () => void
}

function PopupFormBody({
  variant,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: FormBodyProps) {
  const { showAlert } = useCmsAlert()
  const [formMode, setFormMode] = useState<'view' | 'edit'>(
    variant === 'create' ? 'edit' : 'view'
  )
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [isActive, setIsActive] = useState(() =>
    variant === 'detail' && initial ? initial.isActive : true
  )
  const [imageUrl, setImageUrl] = useState(() =>
    variant === 'detail' && initial ? initial.imageUrl : ''
  )
  const [imageFileName, setImageFileName] = useState(() =>
    variant === 'detail' && initial ? (initial.imageFileName ?? '') : ''
  )
  const [name, setName] = useState(() =>
    variant === 'detail' && initial ? initial.name : ''
  )
  const [altText, setAltText] = useState(() =>
    variant === 'detail' && initial ? initial.altText : ''
  )
  const [periodRange, setPeriodRange] = useState<[Dayjs | null, Dayjs | null]>(() => {
    if (variant === 'detail' && initial) {
      return [
        initial.periodStart ? dayjs(initial.periodStart) : null,
        initial.periodEnd ? dayjs(initial.periodEnd) : null,
      ]
    }
    return [null, null]
  })
  const [linkEnabled, setLinkEnabled] = useState(() =>
    variant === 'detail' && initial ? initial.linkEnabled : false
  )
  const [linkUrl, setLinkUrl] = useState(() =>
    variant === 'detail' && initial ? initial.linkUrl : ''
  )
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imageCleared, setImageCleared] = useState(false)

  const createdAtLabel = initial ? formatCreatedAt(initial.createdAt) : '-'

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
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setImageUrl(dataUrl)
        setImageFileName(file.name)
        setPendingImageFile(file)
        setImageCleared(false)
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
    setImageCleared(true)
  }, [])

  const validateAndBuild = useCallback((): PopupFormValues | null => {
    const useRemote = shouldUsePopupRemoteApi()
    const hasExistingRemoteImage =
      useRemote &&
      !imageCleared &&
      !pendingImageFile &&
      Boolean(initial?.imageAssetId) &&
      Boolean(imageUrl.trim())

    if (!imageUrl.trim() && !hasExistingRemoteImage) {
      showAlert({
        title: '이미지 필수',
        content: '팝업 이미지를 등록해 주세요.',
      })
      return null
    }
    if (useRemote && variant === 'create' && !pendingImageFile) {
      showAlert({
        title: '이미지 필수',
        content: '팝업 이미지를 파일로 등록해 주세요.',
      })
      return null
    }
    if (useRemote && variant === 'detail' && imageCleared && !pendingImageFile) {
      showAlert({
        title: '이미지 필수',
        content: '팝업 이미지를 등록해 주세요.',
      })
      return null
    }
    if (!name.trim()) {
      showAlert({
        title: '팝업명 필수',
        content: '팝업명을 입력해 주세요.',
      })
      return null
    }
    if (!altText.trim()) {
      showAlert({
        title: '대체 텍스트 필수',
        content: '대체 텍스트를 입력해 주세요.',
      })
      return null
    }
    const start = periodRange[0]
    const end = periodRange[1]
    if (!start || !end) {
      showAlert({
        title: '게시 기간 필수',
        content: '게시 기간을 선택해 주세요.',
      })
      return null
    }
    if (linkEnabled && !linkUrl.trim()) {
      showAlert({
        title: '연결 링크 필수',
        content: '연결 URL을 입력해 주세요.',
      })
      return null
    }
    const trimmedLinkUrl = linkEnabled ? linkUrl.trim() : ''
    if (trimmedLinkUrl && !isValidHttpLinkUrl(trimmedLinkUrl)) {
      showAlert(HTTP_LINK_URL_FORMAT_ALERT)
      return null
    }
    return {
      isActive,
      imageUrl,
      imageFileName: imageFileName || undefined,
      imageFile: pendingImageFile,
      imageAssetId:
        !pendingImageFile && !imageCleared ? initial?.imageAssetId : undefined,
      name,
      altText,
      periodStart: start.format('YYYY-MM-DD'),
      periodEnd: end.format('YYYY-MM-DD'),
      linkEnabled,
      linkUrl: trimmedLinkUrl,
    }
  }, [
    altText,
    imageCleared,
    imageFileName,
    imageUrl,
    initial?.imageAssetId,
    isActive,
    linkEnabled,
    linkUrl,
    name,
    pendingImageFile,
    periodRange,
    showAlert,
    variant,
  ])

  const handlePrimaryAction = useCallback(() => {
    if (variant === 'detail' && formMode === 'view') {
      setFormMode('edit')
      return
    }
    const values = validateAndBuild()
    if (!values) return
    onSubmit(values)
  }, [formMode, onSubmit, validateAndBuild, variant])

  const title = variant === 'create' ? '팝업 등록' : '팝업 상세'
  const primaryLabel =
    variant === 'create' ? '팝업 등록' : formMode === 'view' ? '팝업 수정' : '팝업 수정'

  const periodViewLabel =
    periodRange[0] && periodRange[1]
      ? `${formatYmdDot(periodRange[0].format('YYYY-MM-DD'))} ~ ${formatYmdDot(periodRange[1].format('YYYY-MM-DD'))}`
      : '-'

  return (
    <>
      <ContentModal
        open
        onCancel={onCancel}
        title={title}
        description={MODAL_DESCRIPTION}
        width={800}
        className="popup-form-modal"
        footer={
          <>
            <div className="popup-form-modal__footer-start">
              {variant === 'detail' ? (
                <CmsButton
                  variant="delete"
                  size="large"
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={confirmLoading || deleteLoading}
                  loading={deleteLoading}
                >
                  팝업 삭제
                </CmsButton>
              ) : null}
            </div>
            <div className="popup-form-modal__footer-end">
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={onCancel}
                disabled={confirmLoading || deleteLoading}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={confirmLoading}
                disabled={confirmLoading || deleteLoading}
                onClick={handlePrimaryAction}
              >
                {primaryLabel}
              </CmsButton>
            </div>
          </>
        }
      >
        <div className="popup-form-modal__forms">
          {variant === 'detail' ? (
            <DetailInfoForm
              title="등록 정보"
              hideHeader
              mode={formMode}
              className="popup-form-modal__form popup-form-modal__form--meta"
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="등록일시"
                  readOnlyDisplay
                  view={
                    <span className="popup-form-modal__created-at">{createdAtLabel}</span>
                  }
                />
                <DetailInfoForm.Field
                  label="사용 여부"
                  view={<span>{isActive ? '사용' : '미사용'}</span>}
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
            </DetailInfoForm>
          ) : null}

          <DetailInfoForm
            title={title}
            hideHeader
            mode={formMode}
            className="popup-form-modal__form"
          >
            {variant === 'create' ? (
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
            ) : null}

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="이미지"
                view={
                  <div className="popup-form-modal__image-row">
                    <div className="popup-form-modal__preview">
                      {imageUrl ? (
                        <img src={imageUrl} alt={altText || '팝업 이미지'} />
                      ) : (
                        <ImagePlaceholderIcon />
                      )}
                    </div>
                    {imageFileName ? (
                      <span className="popup-form-modal__file-name">{imageFileName}</span>
                    ) : null}
                  </div>
                }
                edit={
                  <div className="popup-form-modal__image-row">
                    <div className="popup-form-modal__preview">
                      {imageUrl ? (
                        <img src={imageUrl} alt="팝업 미리보기" />
                      ) : (
                        <ImagePlaceholderIcon />
                      )}
                    </div>
                    <FileSelectField
                      className="popup-form-modal__file-field"
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

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="팝업명"
                view={<span>{name || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="large"
                    width="100%"
                    placeholder="팝업명을 입력하세요"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="대체 텍스트 (설명)"
                view={<span>{altText || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="large"
                    width="100%"
                    placeholder="대체 텍스트를 입력하세요"
                    value={altText}
                    onChange={e => setAltText(e.target.value)}
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="게시 기간"
                view={<span>{periodViewLabel}</span>}
                edit={
                  <CmsPeriodDatePicker
                    inputSize="large"
                    width="100%"
                    value={periodRange}
                    onChange={dates => {
                      setPeriodRange(dates ?? [null, null])
                    }}
                    placeholder="게시 기간을 선택하세요"
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="연결 링크"
                view={
                  <div className="popup-form-modal__link-view">
                    <span>{linkEnabled ? '연결' : '미연결'}</span>
                    {linkEnabled && linkUrl ? (
                      <>
                        <DetailInfoForm.TdDivider />
                        <span className="popup-form-modal__link-url">{linkUrl}</span>
                      </>
                    ) : null}
                  </div>
                }
                edit={
                  <div className="popup-form-modal__link-edit">
                    <CmsRadioGroup
                      size="medium"
                      value={linkEnabled}
                      onChange={e => setLinkEnabled(coerceRadioBoolean(e.target.value))}
                    >
                      <CmsRadio size="medium" value={true}>
                        연결
                      </CmsRadio>
                      <CmsRadio size="medium" value={false}>
                        미연결
                      </CmsRadio>
                    </CmsRadioGroup>
                    <DetailInfoForm.TdDivider />
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      placeholder="연결 URL을 입력하세요"
                      value={linkUrl}
                      disabled={!linkEnabled}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </ContentModal>

      {variant === 'detail' && onDelete ? (
        <ConfirmModal
          open={deleteConfirmOpen}
          title="팝업 삭제"
          content="이 팝업을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          danger
          confirmLoading={deleteLoading}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            setDeleteConfirmOpen(false)
            onDelete()
          }}
        />
      ) : null}
    </>
  )
}

export function PopupFormModal({
  open,
  variant,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: {
  open: boolean
  variant: 'create' | 'detail'
  initial?: Popup | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: PopupFormValues) => void
  onDelete?: () => void
}) {
  if (!open) return null

  const formKey =
    variant === 'detail'
      ? `detail-${initial?.id ?? 'unknown'}`
      : `create-${String(open)}`

  return (
    <PopupFormBody
      key={formKey}
      variant={variant}
      initial={initial}
      confirmLoading={confirmLoading}
      deleteLoading={deleteLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  )
}
