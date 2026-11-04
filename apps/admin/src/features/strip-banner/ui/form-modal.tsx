import { useCallback, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  CmsPeriodDatePicker,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'
import type { StripBanner, StripBannerCreateInput } from '@/entities/strip-banner/model/types'
import { HTTP_LINK_URL_FORMAT_ALERT, isValidHttpLinkUrl } from '@/shared/lib/http-link-url'
import { formatDateDot } from '@/shared/lib/format-display'
import {
  buildPublishPeriodExpiredAlert,
  createPublishPeriodDisabledDate,
  isPublishPeriodExpired,
} from '@/shared/lib/publish-period'
import './form-modal.css'

const TEXT_MAX_LENGTH = 80

const MODAL_DESCRIPTION =
  '홈페이지 메인 화면 최상단에 노출되는 띠배너입니다.\n연결 링크를 설정하면 배너에 이동 화살표가 표시되며, 배너를 클릭하면 설정된 페이지로 이동합니다.'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

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

function formatYmdDot(ymd: string): string {
  return formatDateDot(ymd)
}

function formatCreatedAt(iso: string): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  const weekday = WEEKDAY_KO[d.day()] ?? ''
  return `${d.format('YYYY.MM.DD')}(${weekday}) ${d.format('HH:mm')}`
}

export type StripBannerFormValues = StripBannerCreateInput

type FormBodyProps = {
  variant: 'create' | 'detail'
  initial?: StripBanner | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: StripBannerFormValues) => void
  onDelete?: () => void
}

function StripBannerFormBody({
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
  const [text, setText] = useState(() => (variant === 'detail' && initial ? initial.text : ''))
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
    variant === 'detail' && initial ? initial.linkEnabled : true
  )
  const [linkUrl, setLinkUrl] = useState(() =>
    variant === 'detail' && initial ? initial.linkUrl : ''
  )

  const createdAtLabel = initial ? formatCreatedAt(initial.createdAt) : '-'
  const periodDisabledDate = useMemo(
    () => createPublishPeriodDisabledDate(variant === 'detail' ? initial?.periodStart : null),
    [initial?.periodStart, variant]
  )

  const validateAndBuild = useCallback((): StripBannerFormValues | null => {
    const trimmed = text.trim()
    if (!trimmed) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (trimmed.length > TEXT_MAX_LENGTH) {
      showAlert({
        title: '글자 수 초과',
        content: `배너 텍스트는 최대 ${TEXT_MAX_LENGTH}자까지 입력할 수 있습니다.`,
      })
      return null
    }
    const start = periodRange[0]
    const end = periodRange[1]
    if (!start || !end) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return null
    }
    if (isActive && isPublishPeriodExpired(end)) {
      showAlert(buildPublishPeriodExpiredAlert('띠배너는'))
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
      text: trimmed,
      periodStart: start.format('YYYY-MM-DD'),
      periodEnd: end.format('YYYY-MM-DD'),
      linkEnabled,
      linkUrl: trimmedLinkUrl,
    }
  }, [isActive, linkEnabled, linkUrl, periodRange, showAlert, text])

  const handlePrimaryAction = useCallback(() => {
    if (variant === 'detail' && formMode === 'view') {
      setFormMode('edit')
      return
    }
    const values = validateAndBuild()
    if (!values) return
    onSubmit(values)
  }, [formMode, onSubmit, validateAndBuild, variant])

  const title = variant === 'create' ? '상단 띠배너 등록' : '상단 띠배너 상세'
  const description = MODAL_DESCRIPTION
  const isView = formMode === 'view'
  const primaryLabel =
    variant === 'create' ? '배너 등록' : isView ? '배너 수정' : '배너 수정'

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
        description={description}
        width={800}
        className="strip-banner-form-modal"
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
                배너 삭제
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
        <div className="strip-banner-form-modal__forms">
          <DetailInfoForm
            title={title}
            hideHeader
            mode={formMode}
            className="strip-banner-form-modal__form"
          >
            {variant === 'detail' ? (
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="등록일시"
                  readOnlyDisplay
                  view={
                    <span className="strip-banner-form-modal__created-at">{createdAtLabel}</span>
                  }
                />
                <DetailInfoForm.Field
                  label="사용 여부"
                  required={!isView}
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
                label="배너 텍스트"
                required={!isView}
                view={<span>{text || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="small"
                    width="100%"
                    placeholder="배너 텍스트를 입력해 주세요"
                    value={text}
                    maxLength={TEXT_MAX_LENGTH}
                    onChange={e => setText(e.target.value)}
                  />
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="게시 기간"
                required={!isView}
                view={<span>{periodViewLabel}</span>}
                edit={
                  <CmsPeriodDatePicker
                    inputSize="small"
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
                required={!isView}
                view={
                  <div className="strip-banner-form-modal__link-view">
                    <span>{linkEnabled ? '연결' : '미연결'}</span>
                    {linkEnabled && linkUrl ? (
                      <>
                        <DetailInfoForm.TdDivider />
                        <span className="strip-banner-form-modal__link-url">{linkUrl}</span>
                      </>
                    ) : null}
                  </div>
                }
                edit={
                  <div className="strip-banner-form-modal__link-edit">
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
                      inputSize="small"
                      width="100%"
                      placeholder="연결 링크를 입력해 주세요"
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
          title="배너 삭제"
          content="이 배너를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
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

export function StripBannerFormModal({
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
  initial?: StripBanner | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: StripBannerFormValues) => void
  onDelete?: () => void
}) {
  if (!open) return null

  const formKey =
    variant === 'detail' ? `detail-${initial?.id ?? 'unknown'}` : `create-${String(open)}`

  return (
    <StripBannerFormBody
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
