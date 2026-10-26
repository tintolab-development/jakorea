import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModalCloseIcon } from '@/shared/ui/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton, CmsInput, ConfirmModal, useCmsAlert } from '@/shared/ui'
import {
  findHarvestedMailSenderKey,
  MAIL_SENDER_DISPLAY_NAME_READONLY_HINT,
  MAIL_SENDER_NAME_EMPTY_HINT,
  MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL,
} from '@/features/notifications/model/mail-template/sender-email'
import { ComposeFields } from '@/features/notifications/ui/mail-template/compose-fields'
import { PreviewModal } from '@/features/notifications/ui/mail-template/preview-modal'
import type {
  MailPreviewAttachment,
  MailPreviewRecipient,
} from '@/features/notifications/model/mail-template/preview'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import {
  MAIL_SEND_PICKER_PAGE_SIZE,
  type MailSendRecipientSearchParams,
} from '@/features/notifications/model/mail-send/types'
import { useNotificationSendProgramsQuery } from '@/features/notifications/hooks/use-send-programs-query'
import {
  canSelectNotificationSendTemplate,
  isNotificationSendWithoutProgram,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import {
  canUseNotificationSendTemplateForProgram,
  formatNotificationSendTemplateDisabledKeysWarning,
  listNotificationSendTemplateDisabledKeysForProgram,
} from '@/features/notifications/model/shared/template-usable-for-program'
import {
  inferUniqueRecipientTypeValue,
  buildNotificationTemplateVariablesQuery,
} from '@/features/notifications/model/shared/template-variables-query'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'
import {
  classifyAlimtalkPlaceholderKey,
  listAlimtalkManualVariableKeys,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import {
  MAIL_SEND_CONFIRM_MESSAGE,
  listMailSendPlaceholderKeys,
  validateMailSendVariables,
  type MailSendVariableValidationResult,
} from '@/features/notifications/model/mail-send/validate-send'
import {
  MAIL_SEND_MEMBER_TYPE_OPTIONS,
  MAIL_SEND_PARTICIPATION_TYPE_OPTIONS,
  createManualRecipient,
  filterMailSendRecipients,
  formatMailEmailDuplicateMessage,
  isMailSendEmail,
  listMailEmailDuplicateNotices,
  mailSendRecipientTypeColumnTitle,
  mailSendRecipientTypeLabel,
  normalizeMailSendEmail,
  resolveMailSendRecipientTypeMode,
  toMailSendMemberTypeApi,
  toMailSendParticipantTypeApi,
} from '@/features/notifications/model/mail-send/recipients'
import {
  shouldUseMailSendRemoteApi,
  submitMailSend,
  fetchAllMailRecipientCandidates,
} from '@/features/notifications/api/mail-send-service'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import { useInvalidateMailSendHistory } from '@/features/notifications/hooks/use-mail-send-history-query'
import {
  useMailRecipientCandidatesQuery,
  useMailSenderProfilesQuery,
  useMailTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-mail-send-queries'
import { useMailSendTemplatePickerQuery } from '@/features/notifications/hooks/use-mail-template-tree-query'
import { SendScheduleField } from '@/features/notifications/ui/shared/send-schedule-field'
import {
  listNotificationMailContextKeysInTexts,
  NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT,
  pickNotificationMailContextVariables,
  type NotificationMailContextPlaceholderKey,
} from '@/features/notifications/model/shared/mail-context-variables'
import { useMailSendForm } from './use-form'
import { ProgramSelectField } from './program-select-field'
import { RecipientTable } from './recipient-table'
import { SendRequestCompletedModal } from '@/features/notifications/ui/shared/send-request-completed-modal'
import { showNotificationSendRequestFailedAlert } from '@/features/notifications/ui/shared/show-notification-send-request-failed-alert'
import { RecipientManualModal } from '@/features/notifications/ui/shared/recipient-manual-modal'
import { RecipientSelectModal } from '@/features/notifications/ui/shared/recipient-select-modal'
import { TemplateSelectField } from '@/features/notifications/ui/shared/template-select-field'
import '@/features/notifications/ui/shared/notification-fullpage-modal.css'
import './fullpage-modal.css'

type SenderNameFieldProps = {
  seed: string
  epoch: number
  onChange: (value: string) => void
  readOnly?: boolean
}

function SenderNameField({ seed, epoch, onChange, readOnly = false }: SenderNameFieldProps) {
  const [value, setValue] = useState(seed)
  useEffect(() => {
    setValue(seed)
  }, [epoch, seed])
  return (
    <CmsInput
      inputSize="small"
      width="100%"
      allowClear={false}
      readOnly={readOnly}
      placeholder={readOnly ? MAIL_SENDER_DISPLAY_NAME_READONLY_HINT : '발신자명을 입력하세요'}
      value={value}
      onChange={event => {
        if (readOnly) return
        const next = event.target.value
        setValue(next)
        onChange(next)
      }}
    />
  )
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
}

export function SendFullpageModal({ open, onClose }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const invalidateHistory = useInvalidateMailSendHistory()
  const form = useMailSendForm(open)
  const remote = shouldUseMailSendRemoteApi()
  const canLoadProgramScoped =
    isNotificationSendWithoutProgram(form.programId) ||
    parseNotificationSendProgramId(form.programId) != null
  const templatesQuery = useMailSendTemplatePickerQuery(open && remote && canLoadProgramScoped)
  const templates = templatesQuery.data ?? []
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBodyHtml, setPreviewBodyHtml] = useState('')
  const [previewSenderName, setPreviewSenderName] = useState('')
  const [previewSenderEmail, setPreviewSenderEmail] = useState('')
  const [previewAttachments, setPreviewAttachments] = useState<MailPreviewAttachment[]>([])
  const [previewRecipient, setPreviewRecipient] = useState<MailPreviewRecipient | undefined>()
  const [previewAt, setPreviewAt] = useState<string | undefined>()
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sendRequestCompletedOpen, setSendRequestCompletedOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [contextVariableValues, setContextVariableValues] = useState<
    Partial<Record<NotificationMailContextPlaceholderKey, string>>
  >({})
  const [recipientSearch, setRecipientSearch] = useState<MailSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })

  const senderProfilesQuery = useMailSenderProfilesQuery(open && remote)
  const programsQuery = useNotificationSendProgramsQuery(open && remote)
  const programs = programsQuery.data ?? []
  /** 모달 open당 harvest 기본 From·표시명 시드 1회 */
  const didSeedSenderRef = useRef(false)

  const resolveHarvestDisplayName = useCallback(
    (email: string) => {
      const key = email.trim().toLowerCase()
      if (!key) return ''
      const matched = (senderProfilesQuery.data ?? []).find(
        profile => profile.senderKey.trim().toLowerCase() === key
      )
      return matched?.displayName.trim() ?? ''
    },
    [senderProfilesQuery.data]
  )

  const harvestedSenderKeys = useMemo(
    () => (senderProfilesQuery.data ?? []).map(profile => profile.senderKey.trim()).filter(Boolean),
    [senderProfilesQuery.data]
  )
  const defaultHarvestKey = useMemo(
    () => findHarvestedMailSenderKey(MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL, harvestedSenderKeys),
    [harvestedSenderKeys]
  )
  const senderProfilesReady =
    remote &&
    !senderProfilesQuery.isFetching &&
    !senderProfilesQuery.isLoading &&
    senderProfilesQuery.isFetched

  useEffect(() => {
    if (!open) {
      didSeedSenderRef.current = false
      return
    }
    if (!remote || !senderProfilesReady || didSeedSenderRef.current) return
    didSeedSenderRef.current = true

    if (defaultHarvestKey) {
      form.setSenderEmail(defaultHarvestKey)
      form.replaceSenderName(resolveHarvestDisplayName(defaultHarvestKey))
      return
    }
    // harvest 0건이거나 기본 From 없음: 비움 (템플릿 등록과 동일)
    form.setSenderEmail('')
    form.replaceSenderName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open당 1회 시드; sender 입력 deps 금지
  }, [
    defaultHarvestKey,
    open,
    remote,
    resolveHarvestDisplayName,
    senderProfilesReady,
    form.replaceSenderName,
    form.setSenderEmail,
  ])

  /** Hub: 발신 메일 입력에 맞는 harvest displayName은 세션당 동일 키 1회만 */
  const harvestNameSyncKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!open) {
      harvestNameSyncKeyRef.current = null
      return
    }
    if (!remote || !senderProfilesReady) return
    const email = form.senderEmail.trim()
    if (!email) return
    const displayName = resolveHarvestDisplayName(email)
    if (!displayName) return
    const syncKey = `${email.toLowerCase()}:${displayName}`
    if (harvestNameSyncKeyRef.current === syncKey) return
    harvestNameSyncKeyRef.current = syncKey
    form.replaceSenderName(displayName)
  }, [
    form.replaceSenderName,
    form.senderEmail,
    open,
    remote,
    resolveHarvestDisplayName,
    senderProfilesReady,
  ])
  const programNumericId = useMemo(
    () => parseNotificationSendProgramId(form.programId),
    [form.programId]
  )
  const isWithoutProgram = isNotificationSendWithoutProgram(form.programId)
  const recipientTypeMode = resolveMailSendRecipientTypeMode(form.programId)
  const typeColumnTitle = mailSendRecipientTypeColumnTitle(recipientTypeMode)

  useEffect(() => {
    if (!open) return
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
  }, [open, form.programId])

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

  const variablesTypeValue = useMemo(() => {
    // 후보 모달 검색 필터(recipientSearch)는 목록에만 사용.
    // 여기 넣으면 필터만 바꿔도 catalog가 바뀌고 선택 템플릿이 clear되는 회귀가 난다.
    if (recipientTypeMode === 'participation') {
      return inferUniqueRecipientTypeValue(form.recipients.map(item => item.participationType))
    }
    return inferUniqueRecipientTypeValue(form.recipients.map(item => item.memberType))
  }, [form.recipients, recipientTypeMode])

  const templateVariablesQuery = useMemo(
    () =>
      buildNotificationTemplateVariablesQuery({
        programId: programNumericId,
        recipientTypeMode,
        typeValue: variablesTypeValue,
        toParticipantTypeApi: toMailSendParticipantTypeApi,
        toMemberTypeApi: toMailSendMemberTypeApi,
      }),
    [programNumericId, recipientTypeMode, variablesTypeValue]
  )

  const candidatesQuery = useMailRecipientCandidatesQuery(
    {
      programId: programNumericId,
      keyword: recipientSearch.keyword || undefined,
      participantType:
        recipientTypeMode === 'participation'
          ? toMailSendParticipantTypeApi(recipientSearch.typeValue)
          : undefined,
      memberType:
        recipientTypeMode === 'member'
          ? toMailSendMemberTypeApi(recipientSearch.typeValue)
          : undefined,
      page: recipientSearch.page,
      size: MAIL_SEND_PICKER_PAGE_SIZE,
    },
    open && recipientSelectOpen && (programNumericId != null || isWithoutProgram)
  )
  const variablesQuery = useMailTemplateVariablesQuery(
    templateVariablesQuery,
    open && remote && canLoadProgramScoped
  )

  useEffect(() => {
    if (!open || !remote || !variablesQuery.isError) return
    showAlert({
      title: '안내',
      content: getNotificationsApiErrorMessage(
        variablesQuery.error,
        '템플릿 변수 목록을 불러오지 못했습니다.'
      ),
    })
  }, [open, remote, showAlert, variablesQuery.error, variablesQuery.isError])

  const variablesCatalog = variablesQuery.data?.variables
  const variableCatalogState = variablesQuery.isError
    ? 'error'
    : variablesQuery.isSuccess && variablesCatalog != null
      ? 'ready'
      : 'pending'
  const programSelected = programNumericId != null
  const directManualKeys = useMemo(
    () =>
      listAlimtalkManualVariableKeys({
        keys: form.placeholderKeys,
        catalog: variablesCatalog,
        recipient: { source: 'manual', actorType: 'DIRECT' },
        programSelected,
      }),
    [form.placeholderKeys, programSelected, variablesCatalog]
  )
  const manualKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const recipient of form.recipients) {
      next[recipient.id] = listAlimtalkManualVariableKeys({
        keys: form.placeholderKeys,
        catalog: variablesCatalog,
        recipient,
        programSelected,
      })
    }
    return next
  }, [form.placeholderKeys, form.recipients, programSelected, variablesCatalog])
  const blockedKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    if (variablesCatalog == null) return next
    for (const recipient of form.recipients) {
      const blocked: string[] = []
      for (const key of form.placeholderKeys) {
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
  }, [form.placeholderKeys, form.recipients, programSelected, variablesCatalog])
  const readVariableCheck = (): MailSendVariableValidationResult => {
    const draft = form.getDraft()
    return validateMailSendVariables({
      programId: draft.programId,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      recipients: draft.recipients,
      catalog: variablesCatalog ?? null,
      catalogState: variableCatalogState,
    })
  }
  const variableCheck = readVariableCheck()
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesCatalog ?? []),
    [variablesCatalog]
  )
  const isCatalogItemDisabled = useCallback(
    (label: string) => {
      const catalog = variablesCatalog ?? []
      const found = catalog.find(item => item.key === label)
      return isNotificationCatalogVariableDisabled(found, programNumericId)
    },
    [programNumericId, variablesCatalog]
  )

  const hasTemplates = templates.length > 0
  const canPickTemplate = canSelectNotificationSendTemplate(form.programId) && hasTemplates

  const isTemplateUsable = useCallback(
    (template: (typeof templates)[number]) =>
      canUseNotificationSendTemplateForProgram({
        texts: [template.subject, template.bodyHtml],
        catalog: variablesCatalog,
        programNumericId,
      }),
    [programNumericId, variablesCatalog]
  )

  const getTemplateUnusableMessage = useCallback(
    (template: (typeof templates)[number]) =>
      formatNotificationSendTemplateDisabledKeysWarning(
        listNotificationSendTemplateDisabledKeysForProgram({
          texts: [template.subject, template.bodyHtml],
          catalog: variablesCatalog,
          programNumericId,
        })
      ),
    [programNumericId, variablesCatalog]
  )

  // 선택 완료된 템플릿은 수신자 추가·유형 문맥 변경으로 자동 clear 하지 않음.
  // (피커「사용하기」비활성 + 발송 시점 fail-closed로 처리)

  const resolvedSenderProfileId = useMemo(() => {
    const email = form.senderEmail.trim().toLowerCase()
    if (!email) return undefined
    return senderProfilesQuery.data?.find(
      profile => profile.senderKey.trim().toLowerCase() === email
    )?.profileId
  }, [form.senderEmail, senderProfilesQuery.data])

  const contextKeysInCompose = listNotificationMailContextKeysInTexts(
    form.subject,
    form.editor?.getHTML() ?? ''
  )

  const handleClose = () => {
    setPreviewOpen(false)
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSelectedRecipientIds([])
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setContextVariableValues({})
    setSendConfirmOpen(false)
    onClose()
  }

  const handleAttachmentAdd = useCallback(
    (files: File[]) => {
      const result = form.handleAttachmentAdd(files)
      if (!result.ok) {
        showAlert({ title: '안내', content: result.message })
      }
    },
    [form.handleAttachmentAdd, showAlert]
  )

  const handleDisabledVariableInsert = useCallback(() => {
    showAlert({
      title: '안내',
      content: '현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.',
    })
  }, [showAlert])

  const handleOpenRecipientSelect = () => {
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  const handleOpenRecipientManual = () => {
    if (!isWithoutProgram) return
    setRecipientManualOpen(true)
  }

  const handleDeleteSelected = () => {
    if (selectedRecipientIds.length === 0) {
      showAlert({ title: '안내', content: '삭제할 수신자를 선택하세요.' })
      return
    }
    form.removeRecipients(selectedRecipientIds)
    setSelectedRecipientIds([])
  }

  const handlePreview = () => {
    const draft = form.getDraft()
    setPreviewSubject(draft.subject)
    setPreviewBodyHtml(draft.bodyHtml)
    setPreviewSenderName(draft.senderName)
    setPreviewSenderEmail(draft.senderEmail)
    setPreviewAttachments(form.getPreviewAttachments())
    setPreviewRecipient(form.getPreviewRecipient())
    setPreviewAt(form.getPreviewAt())
    setPreviewOpen(true)
  }

  const handleSend = () => {
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    const variableResult = readVariableCheck()
    if (!variableResult.ok) {
      showAlert({ title: variableResult.title, content: variableResult.alert })
      return
    }
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = async () => {
    if (sending) return
    const variableResult = readVariableCheck()
    if (!variableResult.ok) {
      setSendConfirmOpen(false)
      showAlert({ title: variableResult.title, content: variableResult.alert })
      return
    }
    setSending(true)
    try {
      const draft = form.getDraft()
      const selected = draft.templateId
        ? templates.find(item => item.id === draft.templateId)
        : undefined
      await submitMailSend({
        draft: { ...draft, recipients: variableResult.validRecipients },
        placeholderKeys: listMailSendPlaceholderKeys(draft.subject, draft.bodyHtml),
        variableCatalog: variablesCatalog ?? null,
        templateDisplayName: selected?.templateName,
        templateCategoryId: selected?.categoryId,
        templateBaseline: selected
          ? { subject: selected.subject, bodyHtml: selected.bodyHtml }
          : undefined,
        idempotencyKey: crypto.randomUUID(),
        senderProfileId: resolvedSenderProfileId,
        variables: pickNotificationMailContextVariables(contextVariableValues),
      })
      setSendConfirmOpen(false)
      await invalidateHistory()
      setSendRequestCompletedOpen(true)
    } catch {
      setSendConfirmOpen(false)
      showNotificationSendRequestFailedAlert(showAlert)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={handleClose}
        title="메일 발송"
        size="full"
        hideHeader
        className="notification-fullpage-modal mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="notification-fullpage-modal__shell">
          <header className="notification-fullpage-modal__title-row">
            <span className="notification-fullpage-modal__title-text">메일 발송</span>
            <button
              type="button"
              className="notification-fullpage-modal__title-close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <ModalCloseIcon />
            </button>
          </header>

          <div className="notification-fullpage-modal__body">
            <div className="notification-fullpage-modal__notice">
              <div className="notification-fullpage-modal__notice-actions">
                <CmsButton
                  variant="cancel"
                  size="large"
                  width={140}
                  type="button"
                  onClick={handleClose}
                >
                  취소
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  size="large"
                  width={140}
                  type="button"
                  onClick={handlePreview}
                >
                  미리보기
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  type="button"
                  onClick={handleSend}
                >
                  메일 발송
                </CmsButton>
              </div>
            </div>

            <div className="notification-fullpage-modal__layout">
              <div className="notification-fullpage-modal__main">
                <section className="notification-fullpage-modal__widget">
                  <div className="mail-send-fullpage__section-intro">
                    <h3 className="mail-send-fullpage__section-title">1. 기본 설정</h3>
                    <p className="mail-send-fullpage__section-hint">
                      {MAIL_SENDER_NAME_EMPTY_HINT}
                    </p>
                  </div>
                  <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="대상 프로그램"
                        fullRow
                        view=""
                        edit={
                          <ProgramSelectField
                            value={form.programId}
                            programs={programs}
                            onSelect={program => {
                              form.setProgramId(program.id)
                              form.clearRecipients()
                              setSelectedRecipientIds([])
                              setRecipientManualOpen(false)
                            }}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="템플릿"
                        view=""
                        edit={
                          <TemplateSelectField
                            value={form.templateId}
                            templates={templates}
                            disabled={!canPickTemplate}
                            isTemplateUsable={isTemplateUsable}
                            getTemplateUnusableMessage={getTemplateUnusableMessage}
                            onSelect={template => {
                              form.applyTemplate(template)
                              // 템플릿 senderName이 비면 harvest displayName으로 보강 (빈 문자열로 덮지 않음)
                              if (template.senderName.trim()) return
                              const email = template.senderEmail.trim()
                              const displayName = resolveHarvestDisplayName(email)
                              if (displayName) form.replaceSenderName(displayName)
                            }}
                            renderPreview={({ template, open, onClose, zIndex }) => (
                              <PreviewModal
                                open={open}
                                zIndex={zIndex}
                                subject={template?.subject ?? ''}
                                bodyHtml={template?.bodyHtml ?? ''}
                                senderName={template?.senderName}
                                senderEmail={template?.senderEmail}
                                attachments={template?.attachmentFileNames.map(name => ({
                                  name,
                                  sizeBytes: template.attachmentSizes?.[name],
                                }))}
                                previewAt={new Date().toISOString()}
                                onClose={onClose}
                              />
                            )}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발송 시점"
                        required
                        view={form.sendTiming === 'immediate' ? '즉시 발송' : '예약 발송'}
                        edit={
                          <SendScheduleField
                            className="mail-send-fullpage__timing"
                            sendTiming={form.sendTiming}
                            scheduledAt={form.scheduledAt}
                            onSendTimingChange={form.setSendTiming}
                            onScheduledAtChange={form.setScheduledAt}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="발신자명"
                        view={form.senderNameSeed}
                        edit={
                          <SenderNameField
                            seed={form.senderNameSeed}
                            epoch={form.senderNameEpoch}
                            onChange={form.setSenderName}
                            readOnly={remote && Boolean(senderProfilesQuery.data?.length)}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발신 메일"
                        required
                        view={form.senderEmail}
                        edit={
                          <CmsInput
                            inputSize="small"
                            width="100%"
                            allowClear={false}
                            placeholder="발신 메일을 입력하세요"
                            value={form.senderEmail}
                            onChange={event => {
                              const email = event.target.value
                              form.setSenderEmail(email)
                              if (!remote) return
                              form.replaceSenderName(resolveHarvestDisplayName(email))
                            }}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>

                <section className="notification-fullpage-modal__widget mail-send-fullpage__widget--recipients">
                  <div className="mail-send-fullpage__section-head">
                    <h3 className="mail-send-fullpage__section-title">
                      2. 수신자 설정
                      <span className="mail-send-fullpage__required">*</span>
                    </h3>
                    <div className="mail-send-fullpage__section-actions">
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
                          onClick={handleOpenRecipientManual}
                        >
                          수신자 직접 입력
                        </CmsButton>
                      ) : null}
                      <CmsButton
                        variant="secondary"
                        size="h40"
                        type="button"
                        onClick={handleOpenRecipientSelect}
                      >
                        수신자 설정
                      </CmsButton>
                    </div>
                  </div>
                  {directManualKeys.length > 0 ? (
                    <p className="mail-send-fullpage__section-hint">
                      사용하는 변수값은 수신자마다 입력합니다. 값이 없으면 해당 수신자는 발송되지
                      않습니다.
                    </p>
                  ) : null}
                  <RecipientTable
                    recipients={form.recipients}
                    selectedIds={selectedRecipientIds}
                    onSelectedIdsChange={setSelectedRecipientIds}
                    typeColumnTitle={typeColumnTitle}
                    manualKeysByRecipientId={manualKeysByRecipientId}
                    blockedKeysByRecipientId={blockedKeysByRecipientId}
                    onVariableChange={form.updateRecipientVariable}
                  />
                </section>

                <section className="notification-fullpage-modal__widget">
                  <h3 className="mail-send-fullpage__section-title">3. 메일 작성</h3>
                  <DetailInfoForm
                    title="메일 작성"
                    hideHeader
                    mode="edit"
                    className="mail-send-fullpage__compose"
                  >
                    <ComposeFields
                      editor={form.editor}
                      editorMinHeight={form.editorMinHeight}
                      subject={form.subject}
                      subjectMaxLength={form.subjectMaxLength}
                      subjectInputRef={form.subjectInputRef}
                      attachmentFileNames={form.attachmentFileNames}
                      onSubjectChange={form.handleSubjectChange}
                      onRememberSubjectRange={form.rememberSubjectRange}
                      onAttachmentAdd={handleAttachmentAdd}
                      onAttachmentRemove={form.handleAttachmentRemove}
                      fileUploadOwner={form.fileUploadOwner}
                    />
                  </DetailInfoForm>
                  {contextKeysInCompose.length > 0 ? (
                    <div className="mail-send-fullpage__context-vars">
                      <p className="mail-send-fullpage__context-vars-hint">
                        {NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT}
                      </p>
                      <DetailInfoForm title="문맥 변수" hideHeader mode="edit">
                        {contextKeysInCompose.map(key => (
                          <DetailInfoForm.Row key={key} type="single">
                            <DetailInfoForm.Field
                              label={`#{${key}}`}
                              fullRow
                              view={contextVariableValues[key] ?? ''}
                              edit={
                                <CmsInput
                                  inputSize="small"
                                  width="100%"
                                  placeholder={`${key} 값 입력`}
                                  value={contextVariableValues[key] ?? ''}
                                  onChange={event =>
                                    setContextVariableValues(prev => ({
                                      ...prev,
                                      [key]: event.target.value,
                                    }))
                                  }
                                />
                              }
                            />
                          </DetailInfoForm.Row>
                        ))}
                      </DetailInfoForm>
                    </div>
                  ) : null}
                </section>
              </div>

              <VariablesPanel
                onInsert={form.insertVariable}
                groups={variableGroups.length > 0 ? variableGroups : undefined}
                onDisabledInsert={handleDisabledVariableInsert}
                isItemDisabled={isCatalogItemDisabled}
                itemDisabledReason="현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다."
              />
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <PreviewModal
        open={open && previewOpen}
        zIndex={1100}
        subject={previewSubject}
        bodyHtml={previewBodyHtml}
        senderName={previewSenderName}
        senderEmail={previewSenderEmail}
        attachments={previewAttachments}
        recipient={previewRecipient}
        previewAt={previewAt}
        onClose={() => setPreviewOpen(false)}
      />
      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidatesQuery.data?.items}
        initialSelected={form.recipients}
        resetKey={recipientTypeMode}
        pageSize={MAIL_SEND_PICKER_PAGE_SIZE}
        typeColumnTitle={typeColumnTitle}
        typeOptions={
          recipientTypeMode === 'member'
            ? MAIL_SEND_MEMBER_TYPE_OPTIONS
            : MAIL_SEND_PARTICIPATION_TYPE_OPTIONS
        }
        getTypeLabel={row => mailSendRecipientTypeLabel(row) || '-'}
        contactColumnTitle="이메일"
        getContact={row => row.email}
        filterCandidates={(rows, applied) =>
          filterMailSendRecipients(rows, {
            typeMode: recipientTypeMode,
            typeValue: applied.typeValue,
            keyword: applied.keyword,
          })
        }
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
        totalCount={candidatesQuery.data?.total}
        totalPages={candidatesQuery.data?.totalPages}
        fetchAllCandidates={
          remote && (programNumericId != null || isWithoutProgram)
            ? async () => {
                return fetchAllMailRecipientCandidates({
                  programId: programNumericId,
                  keyword: recipientSearch.keyword || undefined,
                  participantType:
                    recipientTypeMode === 'participation'
                      ? toMailSendParticipantTypeApi(recipientSearch.typeValue)
                      : undefined,
                  memberType:
                    recipientTypeMode === 'member'
                      ? toMailSendMemberTypeApi(recipientSearch.typeValue)
                      : undefined,
                })
              }
            : undefined
        }
        onClose={() => setRecipientSelectOpen(false)}
        onConfirm={recipients => {
          const notices = listMailEmailDuplicateNotices(form.recipients, recipients)
          form.addRecipients(recipients)
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatMailEmailDuplicateMessage(notices) })
          }
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen && isWithoutProgram}
        contact="email"
        values={form.recipients
          .filter(item => item.source === 'manual')
          .map(item => ({ contact: item.email, variables: item.variables }))}
        variableKeys={directManualKeys}
        normalize={normalizeMailSendEmail}
        isValid={isMailSendEmail}
        invalidMessage="올바른 이메일 주소를 입력하세요."
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={entries => {
          const incoming = entries.map(entry =>
            createManualRecipient(entry.contact, entry.variables)
          )
          const notices = listMailEmailDuplicateNotices(form.recipients, incoming)
          form.applyManualEntries(entries)
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatMailEmailDuplicateMessage(notices) })
          }
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="메일 발송"
        content={variableCheck.ok ? variableCheck.confirmMessage : MAIL_SEND_CONFIRM_MESSAGE}
        confirmText="발송"
        cancelText="취소"
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => {
          if (!sending) setSendConfirmOpen(false)
        }}
      />
      <SendRequestCompletedModal
        open={sendRequestCompletedOpen && open}
        channel="mail"
        onDismissSendScreen={() => {
          setSendRequestCompletedOpen(false)
          handleClose()
        }}
      />
    </>
  )
}
