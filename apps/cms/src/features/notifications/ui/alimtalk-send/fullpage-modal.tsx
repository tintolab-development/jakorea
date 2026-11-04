import { ModalCloseIcon } from '@/shared/ui/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AlimtalkPhonePreview, CmsButton, CmsSelect, ConfirmModal, useCmsAlert } from '@/shared/ui'
import {
  ALIMTALK_CHANNEL_ADD_GUIDE,
  ALIMTALK_EMPHASIS_TYPE_LABEL,
  ALIMTALK_MESSAGE_TYPE_LABEL,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'
import type {
  AlimtalkSendRecipient,
  AlimtalkSendRecipientSearchParams,
} from '@/features/notifications/model/alimtalk-send/types'
import {
  ALIMTALK_PROGRAM_SELECTED_DIRECT_GUIDANCE,
  ALIMTALK_SEND_MEMBER_TYPE_OPTIONS,
  ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS,
  alimtalkSendRecipientTypeColumnTitle,
  alimtalkSendRecipientTypeLabel,
  createManualRecipient,
  filterAlimtalkSendRecipients,
  formatAlimtalkPhoneDuplicateMessage,
  listAlimtalkPhoneDuplicateNotices,
  mergeAlimtalkSendRecipients,
  normalizeAlimtalkSendPhone,
  resolveAlimtalkSendRecipientTypeMode,
  toAlimtalkSendMemberTypeApi,
  toAlimtalkSendParticipantTypeApi,
} from '@/features/notifications/model/alimtalk-send/recipients'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { isAlimtalkTemplateApproved } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { ALIMTALK_NO_APPROVED_TEMPLATE_MESSAGE } from '@/features/notifications/api/alimtalk-template-service'
import { PreviewModal } from '@/features/notifications/ui/alimtalk-template/preview-modal'
import {
  classifyAlimtalkPlaceholderKey,
  listAlimtalkManualVariableKeys,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import {
  ALIMTALK_SEND_CONFIRM_MESSAGE,
  ALIMTALK_SEND_STATE_CHANGED_MESSAGE,
  validateAlimtalkSendRequest,
  type AlimtalkSendValidationInput,
} from '@/features/notifications/model/alimtalk-send/validate-send'
import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { useNotificationSendProgramsQuery } from '@/features/notifications/hooks/use-send-programs-query'
import {
  canSelectNotificationSendTemplate,
  isNotificationSendWithoutProgram,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import {
  canUseAlimtalkSendTemplateForManualSend,
  diagnoseAlimtalkManualSendUnusable,
  formatAlimtalkManualSendUnusableMessage,
  formatAlimtalkManualSendUnusableReasonView,
  listAlimtalkManualSendUnusableKeys,
} from '@/features/notifications/model/alimtalk-send/manual-send-usable'
import { alimtalkSendStateAfterProgramChange } from '@/features/notifications/model/alimtalk-send/program-change'
import { alimtalkSendTemplateContentEmptyTitle } from '@/features/notifications/model/alimtalk-send/content-empty'
import {
  buildNotificationTemplateVariablesQuery,
  inferUniqueRecipientTypeValue,
} from '@/features/notifications/model/shared/template-variables-query'
import { ALIMTALK_SEND_PICKER_PAGE_SIZE } from '@/features/notifications/model/alimtalk-send/types'
import { categoryPathNames } from '@/features/notifications/lib/tree'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import { resolveScheduledAtForCreateRequest } from '@/features/notifications/model/send-scheduled-at'
import {
  createAlimtalkSendBatch,
  fetchAllAlimtalkRecipientCandidates,
  shouldUseAlimtalkSendRemoteApi,
} from '@/features/notifications/api/alimtalk-send-service'
import {
  useAlimtalkRecipientCandidatesQuery,
  useAlimtalkSenderProfilesQuery,
  useAlimtalkSendTemplatePickerQuery,
  useAlimtalkTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-alimtalk-send-queries'
import {
  useRecipientCandidatePrivacyGate,
  useReportRecipientCandidateQueryError,
} from '@/features/notifications/hooks/use-recipient-candidate-privacy'
import { recipientCandidateErrorNotice } from '@/features/notifications/model/shared/recipient-candidate-privacy'
import {
  useAlimtalkCategoryTreeQuery,
  useAlimtalkTemplateDetailQuery,
  useAlimtalkTemplatePreviewQuery,
} from '@/features/notifications/hooks/use-alimtalk-template-tree-query'
import { useInvalidateAlimtalkSendHistory } from '@/features/notifications/hooks/use-alimtalk-send-history-query'
import { ProgramSelectField } from '@/features/notifications/ui/mail-send/program-select-field'
import { SendScheduleField } from '@/features/notifications/ui/shared/send-schedule-field'
import { ContentPanel } from './content-panel'
import { SendRequestCompletedModal } from '@/features/notifications/ui/shared/send-request-completed-modal'
import { showNotificationSendErrorAlert } from '@/features/notifications/ui/shared/show-notification-send-request-failed-alert'
import { RecipientManualModal } from '@/features/notifications/ui/shared/recipient-manual-modal'
import { RecipientSelectModal } from '@/features/notifications/ui/shared/recipient-select-modal'
import { TemplateSelectField } from '@/features/notifications/ui/shared/template-select-field'
import { RecipientTable } from './recipient-table'
import '@/features/notifications/ui/shared/notification-fullpage-modal.css'
import './fullpage-modal.css'

const EMPTY_HINT = '발신 프로필/템플릿을 먼저 선택하세요.'
const RECIPIENT_PROFILE_HINT = '발신 프로필을 먼저 선택하세요.'
const EMPTY_SECTION_TITLE = '발신 프로필을 먼저 선택해 주세요.'
const EMPTY_SECTION_DESCRIPTION = '항목이 선택되면 이곳에 목록이 표시됩니다.'
const UNSELECTED_CONTENT =
  '알림톡은 미리 승인 받은 템플릿만 사용 가능합니다. 템플릿 제목을 선택하면 내용이 표시됩니다.'

function AlimtalkSendEmptyHint({
  className,
  title = EMPTY_SECTION_TITLE,
}: {
  className?: string
  title?: string
}) {
  return (
    <div className={className} role="status">
      <p className="alimtalk-send-fullpage__empty-title">{title}</p>
      <p className="alimtalk-send-fullpage__empty-description">{EMPTY_SECTION_DESCRIPTION}</p>
    </div>
  )
}

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
    hasAlimtalkMetadata: false,
  }
}

function recipientTotalPages(total: number, size: number, totalPages?: number): number {
  if (totalPages != null && totalPages > 0) return totalPages
  return Math.max(Math.ceil((total || 0) / (size || 20)), 1)
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
  initialTemplateId?: string
}

export function SendFullpageModal({ open, onClose, initialTemplateId }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const invalidateHistory = useInvalidateAlimtalkSendHistory()
  const remote = shouldUseAlimtalkSendRemoteApi()
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [senderProfileKey, setSenderProfileKey] = useState<string | undefined>()
  const [sendTiming, setSendTiming] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [recipients, setRecipients] = useState<AlimtalkSendRecipient[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sendConfirmMessage, setSendConfirmMessage] = useState(ALIMTALK_SEND_CONFIRM_MESSAGE)
  const [sendRequestCompletedOpen, setSendRequestCompletedOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const sendingRef = useRef(false)
  const confirmedFingerprintRef = useRef('')
  const sendDraftRef = useRef<AlimtalkSendValidationInput | null>(null)
  const [recipientSearch, setRecipientSearch] = useState<AlimtalkSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })
  const idempotencyKeyRef = useRef(createIdempotencyKey())

  const senderProfilesQuery = useAlimtalkSenderProfilesQuery(open)
  const programsQuery = useNotificationSendProgramsQuery(open && remote)
  const programs = programsQuery.data ?? []
  /** 미선택(전체회원) · 특정 프로그램 — 템플릿/변수 카탈로그 로드. 비정상 id만 제외. */
  const canLoadProgramScoped =
    isNotificationSendWithoutProgram(programId) || parseNotificationSendProgramId(programId) != null

  useEffect(() => {
    if (!open || !remote || !programsQuery.isError) return
    showAlert({
      title: '안내',
      content: getNotificationsApiErrorMessage(
        programsQuery.error,
        '프로그램 목록을 불러오지 못했습니다. 다시 불러오세요.'
      ),
    })
  }, [open, programsQuery.error, programsQuery.isError, remote, showAlert])

  const templatesQuery = useAlimtalkSendTemplatePickerQuery(open && remote && canLoadProgramScoped)
  const treeQuery = useAlimtalkCategoryTreeQuery(
    new URLSearchParams(),
    open && remote && canLoadProgramScoped
  )
  const categories = treeQuery.data?.categories ?? []

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

  const programNumericId = parseNotificationSendProgramId(programId)
  const isWithoutProgram = isNotificationSendWithoutProgram(programId)
  const canPickTemplate = canSelectNotificationSendTemplate(programId) && pickerTemplates.length > 0

  const recipientTypeMode = resolveAlimtalkSendRecipientTypeMode(programId)
  const typeColumnTitle = alimtalkSendRecipientTypeColumnTitle(recipientTypeMode)

  const templateVariablesQuery = useMemo(
    () =>
      buildNotificationTemplateVariablesQuery({
        programId: programNumericId,
        participantTypeValue: inferUniqueRecipientTypeValue(
          recipients.map(item => item.participationType)
        ),
        memberTypeValue: inferUniqueRecipientTypeValue(recipients.map(item => item.memberType)),
        toParticipantTypeApi: toAlimtalkSendParticipantTypeApi,
        toMemberTypeApi: toAlimtalkSendMemberTypeApi,
      }),
    [programNumericId, recipients]
  )

  const variablesQuery = useAlimtalkTemplateVariablesQuery(
    templateVariablesQuery,
    open && remote && canLoadProgramScoped
  )

  const variablesCatalog = variablesQuery.data?.variables

  const isTemplateUsable = useCallback(
    (template: AlimtalkTemplateItem) => {
      if (variablesQuery.isError || variablesCatalog == null) return false
      if (template.hasAlimtalkMetadata !== true) return false
      return canUseAlimtalkSendTemplateForManualSend({
        usedKeys: collectTemplatePlaceholderKeys(template),
        catalog: variablesCatalog,
        programNumericId,
      })
    },
    [programNumericId, variablesCatalog, variablesQuery.isError]
  )

  const getTemplateUnusableMessage = useCallback(
    (template: AlimtalkTemplateItem) => {
      if (variablesQuery.isError) {
        return '변수 목록을 불러오지 못했습니다. 다시 시도해 주세요.'
      }
      if (variablesCatalog == null) {
        return '변수 목록을 확인한 뒤 템플릿을 사용할 수 있습니다.'
      }
      if (template.hasAlimtalkMetadata !== true) {
        return '템플릿 상세를 불러온 뒤 사용할 수 있습니다. 미리보기에서 다시 확인해 주세요.'
      }
      return formatAlimtalkManualSendUnusableMessage(
        listAlimtalkManualSendUnusableKeys({
          usedKeys: collectTemplatePlaceholderKeys(template),
          catalog: variablesCatalog,
          programNumericId,
        })
      )
    },
    [programNumericId, variablesCatalog, variablesQuery.isError]
  )

  const getTemplateUnusableReason = useCallback(
    (template: AlimtalkTemplateItem) => {
      const message = getTemplateUnusableMessage(template)
      if (
        variablesQuery.isError ||
        variablesCatalog == null ||
        template.hasAlimtalkMetadata !== true
      ) {
        return message ? { summary: message, detail: message } : null
      }
      return (
        formatAlimtalkManualSendUnusableReasonView(
          diagnoseAlimtalkManualSendUnusable({
            usedKeys: collectTemplatePlaceholderKeys(template),
            catalog: variablesCatalog,
            programNumericId,
          })
        ) ?? (message ? { summary: message, detail: message } : null)
      )
    },
    [getTemplateUnusableMessage, programNumericId, variablesCatalog, variablesQuery.isError]
  )

  const onRecipientPrivacyFailure = useCallback((failure: 'forbidden' | 'audit-unavailable') => {
    setRecipients(prev =>
      failure === 'audit-unavailable' ? [] : prev.filter(item => item.source === 'manual')
    )
    setSelectedRecipientIds([])
    setSendConfirmOpen(false)
  }, [])
  const recipientPrivacy = useRecipientCandidatePrivacyGate({
    screenOpen: open,
    programKey: String(programNumericId ?? ''),
    onFailure: onRecipientPrivacyFailure,
  })
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
      size: ALIMTALK_SEND_PICKER_PAGE_SIZE,
    },
    open &&
      recipientSelectOpen &&
      recipientPrivacy.queryEnabled &&
      (programNumericId != null || isWithoutProgram)
  )
  useReportRecipientCandidateQueryError(
    recipientPrivacy.report,
    candidatesQuery.isError,
    candidatesQuery.error
  )
  const candidateNotice =
    recipientPrivacy.notice ??
    (candidatesQuery.isError ? recipientCandidateErrorNotice(candidatesQuery.error) : null)
  const candidateItems =
    recipientPrivacy.failure || candidatesQuery.isError ? undefined : candidatesQuery.data?.items

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
    if (!open) {
      setRecipients([])
      setSelectedRecipientIds([])
      return
    }
    idempotencyKeyRef.current = createIdempotencyKey()
    setProgramId(undefined)
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
      titleTemplate:
        preview?.titleTemplate || detail?.titleTemplate || pickerTemplate?.titleTemplate,
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

  const placeholderKeys = useMemo(
    () => collectTemplatePlaceholderKeys(selectedTemplate),
    [selectedTemplate]
  )
  const programSelected = programNumericId != null
  const directRecipientProbe = useMemo(
    () => ({ source: 'manual' as const, actorType: 'DIRECT' }),
    []
  )
  const directManualKeys = useMemo(
    () =>
      listAlimtalkManualVariableKeys({
        keys: placeholderKeys,
        catalog: variablesCatalog,
        recipient: directRecipientProbe,
        programSelected,
      }),
    [directRecipientProbe, placeholderKeys, programSelected, variablesCatalog]
  )
  const manualKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const recipient of recipients) {
      next[recipient.id] = listAlimtalkManualVariableKeys({
        keys: placeholderKeys,
        catalog: variablesCatalog,
        recipient,
        programSelected,
      })
    }
    return next
  }, [placeholderKeys, programSelected, recipients, variablesCatalog])
  const blockedKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    if (variablesCatalog == null) return next
    for (const recipient of recipients) {
      const blocked: string[] = []
      for (const key of placeholderKeys) {
        if (
          classifyAlimtalkPlaceholderKey({
            key,
            catalog: variablesCatalog,
            recipient,
            programSelected,
          }) === 'blocked'
        ) {
          blocked.push(key)
        }
      }
      next[recipient.id] = blocked
    }
    return next
  }, [placeholderKeys, programSelected, recipients, variablesCatalog])
  const manualEntries = useMemo(
    () =>
      recipients
        .filter(item => item.source === 'manual')
        .map(item => ({ phone: item.phone, variables: item.variables })),
    [recipients]
  )

  sendDraftRef.current = {
    senderSelected: Boolean(selectedSender),
    senderKey: selectedSender?.senderKey,
    senderProfileId: selectedSender?.profileId,
    templateId: selectedTemplate?.id,
    templateName: selectedTemplate?.templateName || selectedTemplate?.name,
    approvalStatus: selectedTemplate?.approvalStatus ?? pickerTemplate?.approvalStatus ?? null,
    sendTiming,
    scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    programId,
    recipients,
    placeholderKeys,
    catalog: variablesCatalog ?? null,
    catalogState: variablesQuery.isError
      ? 'error'
      : variablesQuery.isSuccess && variablesCatalog != null
        ? 'ready'
        : 'pending',
  }

  const canConfigureRecipients = Boolean(selectedSender) && canLoadProgramScoped

  const handleSelectTemplate = (template: AlimtalkTemplateItem) => {
    setTemplateId(template.id)
    if (template.senderKey) {
      const matched = senderOptions.find(option => option.senderKey === template.senderKey)
      if (matched) setSenderProfileKey(matched.value)
    }
  }

  const requireSenderProfile = () => {
    if (selectedSender) return true
    showAlert({
      title: '안내',
      content: RECIPIENT_PROFILE_HINT,
    })
    return false
  }

  const handleDeleteSelected = () => {
    if (!requireSenderProfile()) return
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
    if (!isWithoutProgram) return
    if (!requireSenderProfile()) return
    setRecipientManualOpen(true)
  }

  const handleSetRecipients = () => {
    if (!requireSenderProfile()) return
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  const handleRequestSend = () => {
    if (recipientPrivacy.blockSend) return
    const draft = sendDraftRef.current
    if (!draft) return
    const result = validateAlimtalkSendRequest(draft)
    if (!result.ok) {
      showAlert({ title: result.title, content: result.alert })
      return
    }
    confirmedFingerprintRef.current = result.fingerprint
    setSendConfirmMessage(result.confirmMessage)
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = async () => {
    if (recipientPrivacy.blockSend) return
    if (sendingRef.current) return
    const draft = sendDraftRef.current
    if (!draft?.templateId) return
    const result = validateAlimtalkSendRequest(draft)
    if (!result.ok) {
      setSendConfirmOpen(false)
      showAlert({ title: result.title, content: result.alert })
      return
    }
    if (result.fingerprint !== confirmedFingerprintRef.current) {
      setSendConfirmOpen(false)
      showAlert({ title: '안내', content: ALIMTALK_SEND_STATE_CHANGED_MESSAGE })
      return
    }

    sendingRef.current = true
    setSendConfirmOpen(false)
    setSending(true)
    try {
      await createAlimtalkSendBatch({
        batchName: draft.templateName || '알림톡 발송',
        templateId: draft.templateId,
        programId: draft.programId,
        scheduledAt: resolveScheduledAtForCreateRequest({
          sendTiming: draft.sendTiming,
          scheduledAt: draft.scheduledAt,
        }),
        senderKey: draft.senderKey,
        senderProfileId: draft.senderProfileId,
        recipients: result.validRecipients,
        placeholderKeys: draft.placeholderKeys,
        variableCatalog: draft.catalog ?? null,
        idempotencyKey: idempotencyKeyRef.current,
      })
      idempotencyKeyRef.current = createIdempotencyKey()
      await invalidateHistory()
      setSendRequestCompletedOpen(true)
    } catch (error) {
      showNotificationSendErrorAlert(showAlert, error, {
        template: '.send-template-select-field__trigger',
      })
    } finally {
      sendingRef.current = false
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
        className="notification-fullpage-modal alimtalk-send-fullpage-modal teal-header-modal--full"
      >
        <div className="notification-fullpage-modal__shell">
          <header className="notification-fullpage-modal__title-row">
            <span className="notification-fullpage-modal__title-text">알림톡 발송</span>
            <button
              type="button"
              className="notification-fullpage-modal__title-close"
              onClick={onClose}
              aria-label="닫기"
            >
              <ModalCloseIcon />
            </button>
          </header>

          <div className="notification-fullpage-modal__body">
            <div className="notification-fullpage-modal__notice">
              {remote && templatesQuery.isSuccess && pickerTemplates.length === 0 ? (
                <p className="notification-fullpage-modal__notice-text">
                  * {ALIMTALK_NO_APPROVED_TEMPLATE_MESSAGE}
                </p>
              ) : null}
              {remote && templatesQuery.isError ? (
                <p className="notification-fullpage-modal__notice-text">
                  * 승인 템플릿 목록을 불러오지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
              <div className="notification-fullpage-modal__notice-actions">
                <CmsButton variant="cancel" size="large" type="button" onClick={onClose}>
                  취소
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  disabled={sending || recipientPrivacy.blockSend}
                  onClick={handleRequestSend}
                >
                  알림톡 발송
                </CmsButton>
              </div>
            </div>

            <div className="notification-fullpage-modal__layout">
              <div className="notification-fullpage-modal__main">
                <section className="notification-fullpage-modal__widget">
                  <div className="alimtalk-send-fullpage__section-title-row">
                    <h3 className="alimtalk-send-fullpage__section-title">1. 기본 설정</h3>
                    <p className="alimtalk-send-fullpage__section-guide">
                      템플릿은 카카오 승인을 받은 템플릿만 사용이 가능합니다.
                    </p>
                  </div>
                  <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="대상 프로그램"
                        view=""
                        edit={
                          <ProgramSelectField
                            value={programId}
                            programs={programs}
                            onSelect={program => {
                              const reset = alimtalkSendStateAfterProgramChange()
                              setProgramId(program.id)
                              setTemplateId(reset.templateId)
                              setRecipients(reset.recipients)
                              setSelectedRecipientIds(reset.selectedRecipientIds)
                              setRecipientSearch(reset.recipientSearch)
                              setRecipientManualOpen(false)
                            }}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발신 프로필"
                        required
                        view={selectedSender?.label}
                        edit={
                          <CmsSelect
                            inputSize="small"
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
                            disabled={!canPickTemplate}
                            isTemplateUsable={isTemplateUsable}
                            getTemplateUnusableMessage={getTemplateUnusableMessage}
                            getTemplateUnusableReason={getTemplateUnusableReason}
                            showUnusableReasonInline
                            isUseEnabled={isAlimtalkTemplateApproved}
                            useButtonLabel="템플릿 사용"
                            onBeforeUse={template => {
                              if (!isAlimtalkTemplateApproved(template)) {
                                showAlert({
                                  title: '안내',
                                  content:
                                    '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
                                })
                                return false
                              }
                              return true
                            }}
                            onSelect={handleSelectTemplate}
                            renderPreview={({ template, open, onClose, onUse, zIndex }) => (
                              <PreviewModal
                                open={open}
                                template={template}
                                onClose={onClose}
                                onUse={onUse}
                                isTemplateUsable={isTemplateUsable}
                                getTemplateUnusableMessage={getTemplateUnusableMessage}
                                getTemplateUnusableReason={getTemplateUnusableReason}
                                showUnusableReasonInline
                                zIndex={zIndex}
                              />
                            )}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발송 시점"
                        required
                        view={sendTiming === 'immediate' ? '즉시 발송' : '예약 발송'}
                        edit={
                          <SendScheduleField
                            className="alimtalk-send-fullpage__timing"
                            sendTiming={sendTiming}
                            scheduledAt={scheduledAt}
                            onSendTimingChange={setSendTiming}
                            onScheduledAtChange={setScheduledAt}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>

                <section className="notification-fullpage-modal__widget alimtalk-send-fullpage__widget--recipients">
                  <div className="alimtalk-send-fullpage__section-head">
                    <h3 className="alimtalk-send-fullpage__section-title">
                      2. 수신자 설정<span className="alimtalk-send-fullpage__required">*</span>
                    </h3>
                    <div className="alimtalk-send-fullpage__section-actions">
                      <CmsButton
                        variant="delete"
                        size="h40"
                        type="button"
                        onClick={handleDeleteSelected}
                      >
                        선택 삭제
                      </CmsButton>
                      {isWithoutProgram ? (
                        <CmsButton
                          variant="secondary"
                          size="h40"
                          type="button"
                          onClick={handleManualRecipients}
                        >
                          수신자 직접 입력
                        </CmsButton>
                      ) : null}
                      <CmsButton
                        variant="secondary"
                        size="h40"
                        type="button"
                        onClick={handleSetRecipients}
                      >
                        수신자 설정
                      </CmsButton>
                    </div>
                  </div>
                  {!isWithoutProgram ? (
                    <p className="alimtalk-send-fullpage__variable-hint">
                      {ALIMTALK_PROGRAM_SELECTED_DIRECT_GUIDANCE}
                    </p>
                  ) : null}
                  {candidateNotice ? (
                    <p className="alimtalk-send-fullpage__variable-hint" role="alert">
                      {candidateNotice}
                    </p>
                  ) : null}
                  {canConfigureRecipients ? (
                    <>
                      {directManualKeys.length > 0 ? (
                        <p className="alimtalk-send-fullpage__variable-hint">
                          직접 입력 변수는 수신자마다 값을 넣어야 합니다. 값이 없으면 해당 수신자는
                          발송할 수 없습니다.
                        </p>
                      ) : null}
                      <RecipientTable
                        recipients={recipients}
                        selectedIds={selectedRecipientIds}
                        onSelectedIdsChange={setSelectedRecipientIds}
                        typeColumnTitle={typeColumnTitle}
                        manualKeysByRecipientId={manualKeysByRecipientId}
                        blockedKeysByRecipientId={blockedKeysByRecipientId}
                        onVariableChange={(recipientId, key, value) => {
                          setRecipients(prev =>
                            prev.map(item =>
                              item.id === recipientId
                                ? {
                                    ...item,
                                    variables: { ...item.variables, [key]: value },
                                  }
                                : item
                            )
                          )
                        }}
                      />
                    </>
                  ) : (
                    <AlimtalkSendEmptyHint className="alimtalk-send-fullpage__empty" />
                  )}
                </section>

                <section className="notification-fullpage-modal__widget">
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

                <section className="notification-fullpage-modal__widget alimtalk-send-fullpage__widget--content">
                  <div className="alimtalk-send-fullpage__content-main">
                    <h3 className="alimtalk-send-fullpage__section-title">4. 템플릿 내용</h3>
                    {selectedTemplate ? (
                      <ContentPanel template={selectedTemplate} />
                    ) : (
                      <AlimtalkSendEmptyHint
                        className="alimtalk-send-fullpage__empty alimtalk-send-fullpage__empty--fill"
                        title={
                          alimtalkSendTemplateContentEmptyTitle({
                            senderSelected: Boolean(selectedSender),
                            templateSelected: false,
                          }) ?? undefined
                        }
                      />
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
          </div>
        </div>
      </TealHeaderModal>

      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidateItems}
        initialSelected={recipientPrivacy.failure ? [] : recipients}
        resetKey={`${recipientTypeMode}:${recipientPrivacy.failure ?? ''}`}
        statusMessage={candidateNotice}
        selectionBlocked={recipientPrivacy.blockSelection || candidatesQuery.isError}
        loading={candidatesQuery.isFetching && !candidatesQuery.isError}
        pageSize={ALIMTALK_SEND_PICKER_PAGE_SIZE}
        typeColumnTitle={typeColumnTitle}
        typeOptions={
          recipientTypeMode === 'member'
            ? ALIMTALK_SEND_MEMBER_TYPE_OPTIONS
            : ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS
        }
        getTypeLabel={row => alimtalkSendRecipientTypeLabel(row) || '-'}
        contactColumnTitle="휴대폰 번호"
        getContact={row => row.phone}
        filterCandidates={(rows, applied) =>
          filterAlimtalkSendRecipients(rows, {
            typeMode: recipientTypeMode,
            typeValue: applied.typeValue,
            keyword: applied.keyword,
          })
        }
        onSearch={
          remote
            ? params => {
                setRecipientSearch(params)
              }
            : undefined
        }
        totalCount={candidateItems ? candidatesQuery.data?.total : 0}
        totalPages={
          candidateItems && candidatesQuery.data
            ? recipientTotalPages(
                candidatesQuery.data.total,
                candidatesQuery.data.size,
                candidatesQuery.data.totalPages
              )
            : 1
        }
        fetchAllCandidates={
          remote && recipientPrivacy.queryEnabled && (programNumericId != null || isWithoutProgram)
            ? async () => {
                try {
                  return await fetchAllAlimtalkRecipientCandidates({
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
                  })
                } catch (error) {
                  recipientPrivacy.report(error)
                  throw error
                }
              }
            : undefined
        }
        onClose={() => setRecipientSelectOpen(false)}
        onConfirm={next => {
          if (recipientPrivacy.blockSelection) return
          const notices = listAlimtalkPhoneDuplicateNotices(recipients, next)
          setRecipients(prev => mergeAlimtalkSendRecipients(prev, next))
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatAlimtalkPhoneDuplicateMessage(notices) })
          }
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen && isWithoutProgram}
        contact="phone"
        values={manualEntries.map(entry => ({
          contact: entry.phone,
          variables: entry.variables,
        }))}
        variableKeys={directManualKeys}
        normalize={normalizeAlimtalkSendPhone}
        isValid={isValidKoreanPhoneNumber}
        invalidMessage="올바른 휴대폰 번호를 입력해 주세요."
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={nextEntries => {
          const manual = nextEntries.map(entry =>
            createManualRecipient(entry.contact, '', entry.variables)
          )
          const withoutManual = recipients.filter(item => item.source !== 'manual')
          const notices = listAlimtalkPhoneDuplicateNotices(withoutManual, manual)
          setRecipients(mergeAlimtalkSendRecipients(withoutManual, manual))
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatAlimtalkPhoneDuplicateMessage(notices) })
          }
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="알림톡 발송"
        content={sendConfirmMessage}
        confirmText="발송"
        cancelText="취소"
        confirmLoading={sending}
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => {
          if (sending) return
          setSendConfirmOpen(false)
        }}
      />
      <SendRequestCompletedModal
        open={sendRequestCompletedOpen && open}
        channel="alimtalk"
        onDismissSendScreen={() => {
          setSendRequestCompletedOpen(false)
          onClose()
        }}
      />
    </>
  )
}
