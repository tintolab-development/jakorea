import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  AlimtalkPhonePreview,
  CmsButton,
  CmsDatePicker,
  CmsRadio,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import { ALIMTALK_CATEGORY_MOCK } from '@/features/notifications/model/alimtalk-template/mock'
import {
  ALIMTALK_CHANNEL_ADD_GUIDE,
  ALIMTALK_EMPHASIS_TYPE_LABEL,
  ALIMTALK_MESSAGE_TYPE_LABEL,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'
import { ALIMTALK_SEND_ALL_PROGRAM_ID } from '@/features/notifications/model/alimtalk-send/types'
import type {
  AlimtalkSendRecipient,
  AlimtalkSendRecipientSearchParams,
} from '@/features/notifications/model/alimtalk-send/types'
import {
  createManualRecipient,
  mergeAlimtalkSendRecipients,
  resolveAlimtalkSendRecipientTypeMode,
  alimtalkSendRecipientTypeColumnTitle,
  toAlimtalkSendMemberTypeApi,
  toAlimtalkSendParticipantTypeApi,
} from '@/features/notifications/model/alimtalk-send/recipients'
import { categoryPathNames } from '@/features/notifications/lib/tree'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { isAlimtalkTemplateApproved } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import {
  createAlimtalkSendBatch,
  getAlimtalkRecipientCandidates,
  shouldUseAlimtalkSendRemoteApi,
} from '@/features/notifications/api/alimtalk-send-service'
import {
  useAlimtalkRecipientCandidatesQuery,
  useAlimtalkSenderProfilesQuery,
  useAlimtalkSendTemplatePickerQuery,
  useAlimtalkTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-alimtalk-send-queries'
import {
  useAlimtalkCategoryTreeQuery,
  useAlimtalkTemplateDetailQuery,
  useAlimtalkTemplatePreviewQuery,
} from '@/features/notifications/hooks/use-alimtalk-template-tree-query'
import { templateUsesProgramRequiredVariable } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { ContentPanel } from './content-panel'
import { RecipientManualModal } from './recipient-manual-modal'
import { RecipientSelectModal } from './recipient-select-modal'
import { RecipientTable } from './recipient-table'
import { TemplateSelectField } from './template-select-field'
import './fullpage-modal.css'

const EMPTY_HINT = '발신 프로필/템플릿을 먼저 선택하세요.'
const UNSELECTED_CONTENT =
  '알림톡은 미리 승인 받은 템플릿만 사용 가능합니다. 템플릿 제목을 선택하면 내용이 표시됩니다.'

const PROGRAM_OPTIONS = [
  { label: '전체', value: ALIMTALK_SEND_ALL_PROGRAM_ID },
  { label: '2026 JA Company Of The Year', value: 'prog-coy-2026' },
]

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `alimtalk-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function emptyFallbackTemplate(templateId: string | undefined): AlimtalkTemplateItem {
  return {
    id: templateId ?? '',
    name: '-',
    templateName: '-',
    categoryId: 'root',
    registeredAt: '',
    updatedAt: '',
    senderProfile: '-',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '',
    extraInfo: '',
    ctaLabel: '',
    buttons: [],
    quickLinks: [],
  }
}

function recipientTotalPages(
  total: number,
  size: number,
  totalPages?: number
): number {
  if (totalPages != null && totalPages > 0) return totalPages
  return Math.max(Math.ceil((total || 0) / (size || 50)), 1)
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
  initialTemplateId?: string
}

export function SendFullpageModal({ open, onClose, initialTemplateId }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const remote = shouldUseAlimtalkSendRemoteApi()
  const [programId, setProgramId] = useState<string | undefined>(ALIMTALK_SEND_ALL_PROGRAM_ID)
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [senderProfileKey, setSenderProfileKey] = useState<string | undefined>()
  const [sendTiming, setSendTiming] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [recipients, setRecipients] = useState<AlimtalkSendRecipient[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState<AlimtalkSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })
  const idempotencyKeyRef = useRef(createIdempotencyKey())

  const senderProfilesQuery = useAlimtalkSenderProfilesQuery(open)
  const templatesQuery = useAlimtalkSendTemplatePickerQuery(open)
  const treeQuery = useAlimtalkCategoryTreeQuery(new URLSearchParams(), open)
  const categories = remote
    ? (treeQuery.data?.categories ?? [])
    : ALIMTALK_CATEGORY_MOCK

  const senderOptions = useMemo(
    () =>
      (senderProfilesQuery.data ?? []).map(profile => ({
        label: profile.displayName,
        value: String(profile.profileId),
        senderKey: profile.senderKey,
        profileId: profile.profileId,
      })),
    [senderProfilesQuery.data]
  )

  const pickerTemplates = templatesQuery.data ?? []

  const programNumericId =
    programId && programId !== ALIMTALK_SEND_ALL_PROGRAM_ID && Number.isFinite(Number(programId))
      ? Number(programId)
      : undefined

  const recipientTypeMode = resolveAlimtalkSendRecipientTypeMode(programId)
  const typeColumnTitle = alimtalkSendRecipientTypeColumnTitle(recipientTypeMode)

  const candidatesQuery = useAlimtalkRecipientCandidatesQuery(
    {
      programId: programNumericId,
      keyword: recipientSearch.keyword || undefined,
      participantType:
        recipientTypeMode === 'participation'
          ? toAlimtalkSendParticipantTypeApi(recipientSearch.typeValue)
          : undefined,
      memberType:
        recipientTypeMode === 'member'
          ? toAlimtalkSendMemberTypeApi(recipientSearch.typeValue)
          : undefined,
      page: recipientSearch.page,
      size: 50,
    },
    open && recipientSelectOpen
  )

  const variablesQuery = useAlimtalkTemplateVariablesQuery({}, open && Boolean(templateId))
  const pickerTemplate = useMemo(
    () => pickerTemplates.find(item => item.id === templateId) ?? null,
    [pickerTemplates, templateId]
  )
  const detailQuery = useAlimtalkTemplateDetailQuery(
    templateId ?? null,
    open && remote && Boolean(templateId)
  )
  const previewQuery = useAlimtalkTemplatePreviewQuery(
    templateId ?? null,
    pickerTemplate,
    open && remote && Boolean(templateId)
  )

  useEffect(() => {
    if (!open) return
    idempotencyKeyRef.current = createIdempotencyKey()
    setProgramId(ALIMTALK_SEND_ALL_PROGRAM_ID)
    setTemplateId(initialTemplateId)
    setSendTiming('immediate')
    setScheduledAt(null)
    setRecipients([])
    setSelectedRecipientIds([])
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSendConfirmOpen(false)
    setSending(false)
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
  }, [open, initialTemplateId])

  // 프로그램 전환 시: 유형 필터·page 리셋 (이전 모드 enum 혼용 금지)
  useEffect(() => {
    if (!open) return
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
  }, [open, programId])

  useEffect(() => {
    if (!open || senderOptions.length === 0) return
    if (senderProfileKey && senderOptions.some(option => option.value === senderProfileKey)) return

    if (initialTemplateId) {
      const template = pickerTemplates.find(item => item.id === initialTemplateId)
      if (template?.senderKey) {
        const matched = senderOptions.find(option => option.senderKey === template.senderKey)
        if (matched) {
          setSenderProfileKey(matched.value)
          return
        }
      }
    }
    setSenderProfileKey(senderOptions[0]?.value)
  }, [initialTemplateId, open, pickerTemplates, senderOptions, senderProfileKey])

  const selectedSender = senderOptions.find(option => option.value === senderProfileKey)
  // preview(본문) → detail(메타) → picker(목록) 순으로 병합
  const selectedTemplate = useMemo(() => {
    const preview = remote ? previewQuery.data : null
    const detail = remote ? detailQuery.data : null
    if (!preview && !detail && !pickerTemplate) return null
    return {
      ...(pickerTemplate ?? emptyFallbackTemplate(templateId)),
      ...(detail ?? {}),
      ...(preview ?? {}),
      id: templateId ?? preview?.id ?? detail?.id ?? pickerTemplate?.id ?? '',
      name:
        preview?.name ||
        detail?.name ||
        pickerTemplate?.name ||
        preview?.templateName ||
        detail?.templateName ||
        '-',
      templateName:
        preview?.templateName ||
        detail?.templateName ||
        pickerTemplate?.templateName ||
        preview?.name ||
        detail?.name ||
        '-',
      content: preview?.content || detail?.content || pickerTemplate?.content || '',
      extraInfo: preview?.extraInfo || detail?.extraInfo || pickerTemplate?.extraInfo || '',
      senderProfile:
        (preview?.senderProfile && preview.senderProfile !== '-'
          ? preview.senderProfile
          : undefined) ||
        (detail?.senderProfile && detail.senderProfile !== '-'
          ? detail.senderProfile
          : undefined) ||
        pickerTemplate?.senderProfile ||
        '-',
      buttons: preview?.buttons?.length
        ? preview.buttons
        : detail?.buttons?.length
          ? detail.buttons
          : (pickerTemplate?.buttons ?? []),
      quickLinks: preview?.quickLinks?.length
        ? preview.quickLinks
        : detail?.quickLinks?.length
          ? detail.quickLinks
          : (pickerTemplate?.quickLinks ?? []),
    } satisfies AlimtalkTemplateItem
  }, [detailQuery.data, pickerTemplate, previewQuery.data, remote, templateId])

  const variablesRequireProgram = useMemo(
    () => templateUsesProgramRequiredVariable(variablesQuery.data ?? [], selectedTemplate),
    [selectedTemplate, variablesQuery.data]
  )

  const canConfigureRecipients = Boolean(selectedSender && selectedTemplate)

  const handleSelectTemplate = (template: AlimtalkTemplateItem) => {
    setTemplateId(template.id)
    if (template.senderKey) {
      const matched = senderOptions.find(option => option.senderKey === template.senderKey)
      if (matched) setSenderProfileKey(matched.value)
    }
  }

  const requireProfileAndTemplate = () => {
    if (selectedSender && selectedTemplate) return true
    showAlert({
      title: '안내',
      content: EMPTY_HINT,
    })
    return false
  }

  const handleDeleteSelected = () => {
    if (!requireProfileAndTemplate()) return
    if (selectedRecipientIds.length === 0) {
      showAlert({
        title: '안내',
        content: '삭제할 수신자를 선택하세요.',
      })
      return
    }
    const removeIds = new Set(selectedRecipientIds)
    setRecipients(prev => prev.filter(item => !removeIds.has(item.id)))
    setSelectedRecipientIds([])
  }

  const handleManualRecipients = () => {
    if (!requireProfileAndTemplate()) return
    setRecipientManualOpen(true)
  }

  const handleSetRecipients = () => {
    if (!requireProfileAndTemplate()) return
    if (variablesRequireProgram && !programNumericId) {
      showAlert({
        title: '안내',
        content: '프로그램 변수가 필요한 템플릿입니다. 대상 프로그램을 먼저 선택하세요.',
      })
      return
    }
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  const handleRequestSend = () => {
    if (!selectedSender) {
      showAlert({ title: '필수 입력 안내', content: '발신 프로필을 선택하세요.' })
      return
    }
    if (!selectedTemplate) {
      showAlert({ title: '필수 입력 안내', content: '템플릿을 선택하세요.' })
      return
    }
    if (!isAlimtalkTemplateApproved(selectedTemplate) && remote) {
      showAlert({
        title: '안내',
        content: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
      })
      return
    }
    if (sendTiming === 'scheduled' && !scheduledAt) {
      showAlert({ title: '필수 입력 안내', content: '예약 발송 일시를 선택하세요.' })
      return
    }
    if (recipients.length === 0) {
      showAlert({ title: '필수 입력 안내', content: '수신자를 설정하세요.' })
      return
    }
    if (variablesRequireProgram && !programNumericId) {
      showAlert({
        title: '필수 입력 안내',
        content: '프로그램 변수가 필요한 템플릿입니다. 대상 프로그램을 선택하세요.',
      })
      return
    }
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedTemplate || !selectedSender) return
    setSendConfirmOpen(false)

    if (!remote) {
      showAlert({
        title: '안내',
        content: '알림톡 발송이 완료 되었습니다.',
        onConfirm: onClose,
      })
      return
    }

    setSending(true)
    try {
      await createAlimtalkSendBatch({
        batchName: selectedTemplate.templateName || selectedTemplate.name || '알림톡 발송',
        templateId: selectedTemplate.id,
        programId,
        scheduledAt:
          sendTiming === 'scheduled' && scheduledAt ? scheduledAt.toISOString() : undefined,
        senderKey: selectedSender.senderKey,
        senderProfileId: selectedSender.profileId,
        recipients,
        idempotencyKey: idempotencyKeyRef.current,
      })
      idempotencyKeyRef.current = createIdempotencyKey()
      showAlert({
        title: '안내',
        content: '알림톡 발송이 완료 되었습니다.',
        onConfirm: onClose,
      })
    } catch (error) {
      showAlert({
        title: '안내',
        content: getNotificationsApiErrorMessage(error, '알림톡 발송에 실패했습니다.'),
      })
    } finally {
      setSending(false)
    }
  }

  const phoneButtons = useMemo(() => {
    if (!selectedTemplate) return undefined
    return selectedTemplate.buttons.slice(0, 5).map(button => ({
      variant: button.variant,
      label: button.name === 'test sample' ? '버튼명' : button.name,
    }))
  }, [selectedTemplate])

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title="알림톡 발송"
        size="full"
        hideHeader
        className="alimtalk-send-fullpage-modal teal-header-modal--full"
      >
        <div className="alimtalk-send-fullpage-modal__shell">
          <header className="alimtalk-send-fullpage-modal__title-row">
            <span className="alimtalk-send-fullpage-modal__title-text">알림톡 발송</span>
            <button
              type="button"
              className="alimtalk-send-fullpage-modal__title-close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="alimtalk-send-fullpage-modal__body">
            <div className="alimtalk-send-fullpage-modal__notice">
              <p className="alimtalk-send-fullpage-modal__notice-text">
                * 프로그램은 현재 운영 중인 프로그램만 선택 가능하며, 템플릿은 카카오 승인을 받은
                템플릿만 사용이 가능합니다.
              </p>
              <div className="alimtalk-send-fullpage-modal__notice-actions">
                <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                  취소
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  type="button"
                  disabled={sending}
                  onClick={handleRequestSend}
                >
                  알림톡 발송
                </CmsButton>
              </div>
            </div>

            <section className="alimtalk-send-fullpage__widget">
              <h3 className="alimtalk-send-fullpage__section-title">1. 기본 설정</h3>
              <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="대상 프로그램"
                    view={PROGRAM_OPTIONS.find(option => option.value === programId)?.label}
                    edit={
                      <CmsSelect
                        inputSize="large"
                        withAllOption={false}
                        value={programId}
                        onChange={value =>
                          setProgramId(typeof value === 'string' ? value : undefined)
                        }
                        options={PROGRAM_OPTIONS}
                        style={{ width: '100%' }}
                      />
                    }
                  />
                  <DetailInfoForm.Field
                    label="발신 프로필"
                    required
                    view={selectedSender?.label}
                    edit={
                      <CmsSelect
                        inputSize="large"
                        withAllOption={false}
                        value={senderProfileKey}
                        onChange={value =>
                          setSenderProfileKey(typeof value === 'string' ? value : undefined)
                        }
                        options={senderOptions.map(({ label, value }) => ({ label, value }))}
                        style={{ width: '100%' }}
                      />
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="템플릿"
                    required
                    view=""
                    edit={
                      <TemplateSelectField
                        value={templateId}
                        templates={pickerTemplates}
                        onSelect={handleSelectTemplate}
                      />
                    }
                  />
                  <DetailInfoForm.Field
                    label="발송 시점"
                    required
                    view={sendTiming === 'immediate' ? '즉시 발송' : '예약 발송'}
                    edit={
                      <div className="alimtalk-send-fullpage__timing">
                        <CmsRadio.Group
                          value={sendTiming}
                          onChange={event => {
                            const next = event.target.value
                            if (next === 'immediate' || next === 'scheduled') setSendTiming(next)
                          }}
                        >
                          <CmsRadio value="immediate">즉시 발송</CmsRadio>
                          <CmsRadio value="scheduled">예약 발송</CmsRadio>
                        </CmsRadio.Group>
                        <CmsDatePicker
                          showTime
                          disabled={sendTiming !== 'scheduled'}
                          value={scheduledAt}
                          onChange={value => setScheduledAt(value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section className="alimtalk-send-fullpage__widget alimtalk-send-fullpage__widget--recipients">
              <div className="alimtalk-send-fullpage__section-head">
                <h3 className="alimtalk-send-fullpage__section-title">
                  2. 수신자 설정<span className="alimtalk-send-fullpage__required">*</span>
                </h3>
                <div className="alimtalk-send-fullpage__section-actions">
                  <CmsButton
                    variant="delete"
                    size="large"
                    type="button"
                    onClick={handleDeleteSelected}
                  >
                    선택 삭제
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    type="button"
                    onClick={handleManualRecipients}
                  >
                    수신자 직접 입력
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    type="button"
                    onClick={handleSetRecipients}
                  >
                    수신자 설정
                  </CmsButton>
                </div>
              </div>
              {canConfigureRecipients ? (
                <RecipientTable
                  recipients={recipients}
                  selectedIds={selectedRecipientIds}
                  onSelectedIdsChange={setSelectedRecipientIds}
                  typeColumnTitle={typeColumnTitle}
                />
              ) : (
                <div className="alimtalk-send-fullpage__empty">{EMPTY_HINT}</div>
              )}
            </section>

            <section className="alimtalk-send-fullpage__widget">
              <h3 className="alimtalk-send-fullpage__section-title">3. 템플릿 정보</h3>
              <DetailInfoForm title="템플릿 정보" hideHeader mode="view">
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="메시지 유형"
                    view={
                      selectedTemplate
                        ? ALIMTALK_MESSAGE_TYPE_LABEL[selectedTemplate.messageType]
                        : EMPTY_HINT
                    }
                  />
                  <DetailInfoForm.Field
                    label="템플릿 강조 유형"
                    view={
                      selectedTemplate
                        ? ALIMTALK_EMPHASIS_TYPE_LABEL[selectedTemplate.emphasisType]
                        : EMPTY_HINT
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="보안 템플릿 여부"
                    view={
                      selectedTemplate
                        ? selectedTemplate.isSecurityTemplate
                          ? '예'
                          : '설정 안 함'
                        : EMPTY_HINT
                    }
                  />
                  <DetailInfoForm.Field
                    label="카테고리"
                    view={
                      selectedTemplate
                        ? withProgramDetailTdDivider(
                            categoryPathNames(categories, selectedTemplate.categoryId)
                          )
                        : EMPTY_HINT
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section className="alimtalk-send-fullpage__widget alimtalk-send-fullpage__widget--content">
              <div className="alimtalk-send-fullpage__content-main">
                <h3 className="alimtalk-send-fullpage__section-title">4. 템플릿 내용</h3>
                {selectedTemplate ? (
                  <ContentPanel template={selectedTemplate} />
                ) : (
                  <div className="alimtalk-send-fullpage__empty alimtalk-send-fullpage__empty--fill">
                    {EMPTY_HINT}
                  </div>
                )}
              </div>
              <AlimtalkPhonePreview
                senderName={selectedTemplate?.senderProfile ?? 'JA KOREA'}
                content={selectedTemplate?.content ?? UNSELECTED_CONTENT}
                extraContent={selectedTemplate?.extraInfo}
                channelGuide={ALIMTALK_CHANNEL_ADD_GUIDE}
                messageType={selectedTemplate?.messageType}
                emphasisType={selectedTemplate?.emphasisType}
                emphasisTitle={selectedTemplate?.emphasisTitle}
                emphasisSubtitle={selectedTemplate?.emphasisSubtitle}
                imageUrl={selectedTemplate?.imageUrl}
                templateHeader={selectedTemplate?.templateHeader}
                itemTitle={selectedTemplate?.itemTitle}
                itemDescription={selectedTemplate?.itemDescription}
                itemImageUrl={selectedTemplate?.itemImageUrl}
                itemList={selectedTemplate?.itemList}
                itemSummary={selectedTemplate?.itemSummary}
                buttons={phoneButtons}
                quickLinks={selectedTemplate?.quickLinks.map(link => link.name)}
              />
            </section>
          </div>
        </div>
      </TealHeaderModal>

      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidatesQuery.data?.items}
        initialSelected={recipients}
        typeMode={recipientTypeMode}
        onSearch={
          remote
            ? params => {
                setRecipientSearch(params)
              }
            : undefined
        }
        totalCount={candidatesQuery.data?.total}
        totalPages={
          candidatesQuery.data
            ? recipientTotalPages(
                candidatesQuery.data.total,
                candidatesQuery.data.size,
                candidatesQuery.data.totalPages
              )
            : 1
        }
        fetchAllCandidates={
          remote
            ? async () => {
                const total = Math.max(candidatesQuery.data?.total ?? 0, 1)
                const result = await getAlimtalkRecipientCandidates({
                  programId: programNumericId,
                  keyword: recipientSearch.keyword || undefined,
                  participantType:
                    recipientTypeMode === 'participation'
                      ? toAlimtalkSendParticipantTypeApi(recipientSearch.typeValue)
                      : undefined,
                  memberType:
                    recipientTypeMode === 'member'
                      ? toAlimtalkSendMemberTypeApi(recipientSearch.typeValue)
                      : undefined,
                  page: 0,
                  // 발송 수신자 상한 1000 · 전 페이지를 한 번에 가져와 「전체 선택」
                  size: Math.min(Math.max(total, 50), 1000),
                })
                return result.items
              }
            : undefined
        }
        onClose={() => setRecipientSelectOpen(false)}
        onConfirm={next => {
          setRecipients(prev => mergeAlimtalkSendRecipients(prev, next))
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen}
        phones={recipients.filter(item => item.source === 'manual').map(item => item.phone)}
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={phones => {
          const manual = phones.map(phone => createManualRecipient(phone))
          setRecipients(prev => {
            const withoutManual = prev.filter(item => item.source !== 'manual')
            return mergeAlimtalkSendRecipients(withoutManual, manual)
          })
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="발송 안내"
        content="해당 내용으로 알림톡을 발송하시겠습니까?"
        confirmText="발송"
        cancelText="취소"
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => setSendConfirmOpen(false)}
      />
    </>
  )
}
