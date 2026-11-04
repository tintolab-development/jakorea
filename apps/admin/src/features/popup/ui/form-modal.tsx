import { useCallback, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsPeriodDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  ThumbnailPlaceholder,
  useCmsAlert,
} from '@/shared/ui'
import type { Popup, PopupCreateInput } from '@/entities/popup/model/types'
import { shouldUsePopupRemoteApi } from '@/features/popup/api/capabilities'
import {
  buildPublishPeriodExpiredAlert,
  createPublishPeriodDisabledDate,
  isPublishPeriodExpired,
} from '@/shared/lib/publish-period'
import { HTTP_LINK_URL_FORMAT_ALERT, isValidHttpLinkUrl } from '@/shared/lib/http-link-url'
import { formatDateDot } from '@/shared/lib/format-display'
import './form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 이미지 사이즈는 418 × 488px입니다.',
]

const MODAL_DESCRIPTION =
  '홈페이지 접속 시 노출되는 팝업입니다.\n연결 링크를 설정하면 팝업을 클릭했을 때 설정된 페이지가 새 창으로 열립니다.'

const WEEKDAY_KO_MIN = ['일', '월', '화', '수', '목', '금', '토'] as const

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M10.6592 3C10.9165 3 11.1645 3.09963 11.3506 3.27734L14.5557 6.33984C14.7531 6.52847 14.8652 6.78942 14.8652 7.0625V15.5C14.8652 16.0523 14.4175 16.5 13.8652 16.5H6C5.44772 16.5 5 16.0523 5 15.5V4C5.00023 3.44791 5.44786 3 6 3H10.6592ZM7.61328 11.8691V13.9834C7.61328 14.2807 7.49224 14.4365 7.27148 14.4365C7.06412 14.4365 6.92962 14.2955 6.92578 14.0547H6.34961C6.34769 14.6533 6.74128 14.9422 7.24414 14.9424C7.80287 14.9424 8.18555 14.5717 8.18555 13.9834V11.8691H7.61328ZM12.0938 11.8271C11.3604 11.8273 10.7959 12.4057 10.7959 13.3896C10.7961 14.3483 11.3261 14.9423 12.1055 14.9424C12.8063 14.9424 13.3076 14.4567 13.3076 13.6611V13.2842H12.1475V13.7578H12.751C12.7433 14.1388 12.5068 14.3836 12.1094 14.3857C11.6659 14.3836 11.3838 14.0215 11.3838 13.3809C11.3838 12.7444 11.6754 12.3859 12.1055 12.3838C12.4088 12.3859 12.6185 12.56 12.6973 12.8447H13.2803C13.2034 12.2481 12.7215 11.8271 12.0938 11.8271ZM8.57715 11.8691V14.9004H9.15332V13.9131H9.65332C10.2943 13.9129 10.6631 13.4955 10.6631 12.8906C10.663 12.2941 10.2996 11.8691 9.66797 11.8691H8.57715ZM9.56055 12.3838C9.9022 12.3859 10.0692 12.5893 10.0674 12.8906C10.0693 13.1963 9.90231 13.4062 9.56055 13.4062H9.15332V12.3838H9.56055ZM11.333 7.04785C11.1761 6.83881 10.8635 6.83395 10.7002 7.03809L9.55762 8.4668C9.40876 8.65283 9.13148 8.66828 8.96289 8.5L8.72266 8.25977C8.55415 8.09126 8.27593 8.10605 8.12695 8.29199L7.18164 9.47461C6.97222 9.73651 7.15877 10.124 7.49414 10.124H12.8398C13.1694 10.124 13.3578 9.74806 13.1602 9.48438L11.333 7.04785ZM7.75195 5.59668C7.39063 5.59668 7.09766 5.88965 7.09766 6.25098C7.09775 6.61222 7.39069 6.90527 7.75195 6.90527C8.11322 6.90527 8.40616 6.61222 8.40625 6.25098C8.40625 5.88966 8.11327 5.59668 7.75195 5.59668Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
  return formatDateDot(ymd)
}

function formatCreatedAt(iso: string): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return `${d.format('YYYY.MM.DD')}(${WEEKDAY_KO_MIN[d.day()]}) ${d.format('HH:mm')}`
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
  const [formMode, setFormMode] = useState<'view' | 'edit'>(variant === 'create' ? 'edit' : 'view')
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
  const [name, setName] = useState(() => (variant === 'detail' && initial ? initial.name : ''))
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
  const periodDisabledDate = useMemo(
    () => createPublishPeriodDisabledDate(variant === 'detail' ? initial?.periodStart : null),
    [initial?.periodStart, variant]
  )

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: '등록할 수 없는 파일 형식입니다.',
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
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (useRemote && variant === 'create' && !pendingImageFile) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (useRemote && variant === 'detail' && imageCleared && !pendingImageFile) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (!name.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (!altText.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    const start = periodRange[0]
    const end = periodRange[1]
    if (!start || !end) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (isActive && isPublishPeriodExpired(end)) {
      showAlert(buildPublishPeriodExpiredAlert('팝업은'))
      return null
    }
    if (linkEnabled && !linkUrl.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
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
      imageAssetId: !pendingImageFile && !imageCleared ? initial?.imageAssetId : undefined,
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
            {variant === 'detail' ? (
              <CmsButton
                className={CONTENT_MODAL_FOOTER_START_CLASS}
                variant="delete"
                size="h40"
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={confirmLoading || deleteLoading}
                loading={deleteLoading}
              >
                팝업 삭제
              </CmsButton>
            ) : null}
            <CmsButton
              variant="secondary"
              size="h40"
              type="button"
              onClick={onCancel}
              disabled={confirmLoading || deleteLoading}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="h40"
              type="button"
              loading={confirmLoading}
              disabled={confirmLoading || deleteLoading}
              onClick={handlePrimaryAction}
            >
              {primaryLabel}
            </CmsButton>
          </>
        }
      >
        <div className="popup-form-modal__forms">
          <DetailInfoForm
            title={title}
            hideHeader
            mode={formMode}
            className="popup-form-modal__form"
          >
            {variant === 'detail' ? (
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="등록일시"
                  readOnlyDisplay
                  view={<span className="popup-form-modal__created-at">{createdAtLabel}</span>}
                />
                <DetailInfoForm.Field
                  label="사용 여부"
                  required
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
            ) : (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="사용 여부"
                  required
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
            )}

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="이미지"
                required
                view={
                  imageFileName ? (
                    <div className="popup-form-modal__file-view">
                      <FileIcon className="popup-form-modal__file-icon" />
                      <span className="popup-form-modal__file-name">{imageFileName}</span>
                    </div>
                  ) : (
                    <span>-</span>
                  )
                }
                edit={
                  <div className="file-select-image-cell">
                    <div className="file-select-image-cell__preview">
                      {imageUrl ? (
                        <img src={imageUrl} alt="팝업 미리보기" />
                      ) : (
                        <ThumbnailPlaceholder />
                      )}
                    </div>
                    <FileSelectField
                      className="popup-form-modal__file-field"
                      multiple={false}
                      accept={IMAGE_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={imageFileName ? [imageFileName] : []}
                      maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
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
                required
                view={<span>{name || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width={240}
                    placeholder="팝업명을 입력해 주세요"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="대체 텍스트"
                required
                view={<span>{altText || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width={240}
                    placeholder="대체 텍스트를 입력해 주세요"
                    value={altText}
                    onChange={e => setAltText(e.target.value)}
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="게시 기간"
                required
                view={<span>{periodViewLabel}</span>}
                edit={
                  <CmsPeriodDatePicker
                    inputSize="medium"
                    width="100%"
                    value={periodRange}
                    onChange={dates => {
                      setPeriodRange(dates ?? [null, null])
                    }}
                    disabledDate={periodDisabledDate}
                    placeholder="게시 기간을 선택해 주세요"
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="연결 링크"
                required
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
                      inputSize="medium"
                      width="100%"
                      placeholder="연결 URL을 입력해 주세요"
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
    variant === 'detail' ? `detail-${initial?.id ?? 'unknown'}` : `create-${String(open)}`

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
