import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  CmsButton,
  CmsInput,
  CmsPeriodDatePicker,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'
import type { StripBanner, StripBannerCreateInput } from '@/entities/strip-banner/model/types'
import './form-modal.css'

const TEXT_MAX_LENGTH = 80

const CREATE_DESCRIPTION =
  '홈페이지 메인 화면 최상단에 노출되는 띠배너를 설정해 주세요. 연결 링크를 설정하면 배너에 이동 화살표가 노출되며, 배너 선택 시 입력된 주소 화면으로 이동됩니다.'

const DETAIL_DESCRIPTION =
  '홈페이지 메인 화면 최상단에 노출되는 띠배너입니다. 연결 링크가 설정된 경우, 배너에 이동 화살표가 노출되며, 배너 선택 시 입력된 주소 화면으로 이동됩니다.'

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
  if (!ymd) return '-'
  return ymd.replace(/-/g, '.')
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
  const [formMode, setFormMode] = useState<'view' | 'edit'>(
    variant === 'create' ? 'edit' : 'view'
  )
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [isActive, setIsActive] = useState(() =>
    variant === 'detail' && initial ? initial.isActive : true
  )
  const [text, setText] = useState(() =>
    variant === 'detail' && initial ? initial.text : ''
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
    variant === 'detail' && initial ? initial.linkEnabled : true
  )
  const [linkUrl, setLinkUrl] = useState(() =>
    variant === 'detail' && initial ? initial.linkUrl : ''
  )

  const createdAtLabel = initial ? formatCreatedAt(initial.createdAt) : '-'

  const validateAndBuild = useCallback((): StripBannerFormValues | null => {
    const trimmed = text.trim()
    if (!trimmed) {
      showAlert({
        title: '배너 문구 필수',
        content: '배너 문구를 입력해 주세요.',
      })
      return null
    }
    if (trimmed.length > TEXT_MAX_LENGTH) {
      showAlert({
        title: '글자 수 초과',
        content: `배너 문구는 최대 ${TEXT_MAX_LENGTH}자까지 입력할 수 있습니다.`,
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
        content: '연결 링크를 입력해 주세요.',
      })
      return null
    }
    return {
      isActive,
      text: trimmed,
      periodStart: start.format('YYYY-MM-DD'),
      periodEnd: end.format('YYYY-MM-DD'),
      linkEnabled,
      linkUrl: linkEnabled ? linkUrl.trim() : '',
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
  const description = variant === 'create' ? CREATE_DESCRIPTION : DETAIL_DESCRIPTION
  const primaryLabel =
    variant === 'create' ? '배너 등록' : formMode === 'view' ? '배너 수정' : '배너 수정'

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
            <div className="strip-banner-form-modal__footer-start">
              {variant === 'detail' ? (
                <CmsButton
                  variant="delete"
                  size="medium"
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={confirmLoading || deleteLoading}
                  loading={deleteLoading}
                >
                  배너 삭제
                </CmsButton>
              ) : null}
            </div>
            <div className="strip-banner-form-modal__footer-end">
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={onCancel}
                disabled={confirmLoading || deleteLoading}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
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
        <div className="strip-banner-form-modal__forms">
          {variant === 'detail' ? (
            <DetailInfoForm
              title="등록 정보"
              hideHeader
              mode={formMode}
              className="strip-banner-form-modal__form strip-banner-form-modal__form--meta"
            >
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
            </DetailInfoForm>
          ) : null}

          <DetailInfoForm
            title={title}
            hideHeader
            mode={formMode}
            className="strip-banner-form-modal__form"
          >
            {variant === 'create' ? (
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
            ) : null}

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="배너 문구"
                required
                view={<span>{text || '-'}</span>}
                edit={
                  <CmsInput
                    inputSize="large"
                    width="100%"
                    placeholder="배너 문구를 입력하세요"
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
                required
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
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      placeholder="연결 링크를 입력하세요"
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
    variant === 'detail'
      ? `detail-${initial?.id ?? 'unknown'}`
      : `create-${String(open)}`

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
