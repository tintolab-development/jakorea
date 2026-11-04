import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModalCloseIcon } from '@/shared/ui/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton, CmsRadio, CmsSelect, ConfirmModal, useCmsAlert } from '@/shared/ui'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import {
  fetchAllSmsRecipientCandidates,
  resolveSmsSenderProfileId,
  shouldUseSmsSendRemoteApi,
  submitSmsSend,
} from '@/features/notifications/api/sms-send-service'
import { useInvalidateSmsSendHistory } from '@/features/notifications/hooks/use-sms-send-history-query'
import {
  useSmsRecipientCandidatesQuery,
  useSmsSendTemplatePickerQuery,
  useSmsSenderProfilesQuery,
  useSmsTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-sms-send-queries'
import {
  useRecipientCandidatePrivacyGate,
  useReportRecipientCandidateQueryError,
} from '@/features/notifications/hooks/use-recipient-candidate-privacy'
import { recipientCandidateErrorNotice } from '@/features/notifications/model/shared/recipient-candidate-privacy'
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
import { SMS_SEND_PICKER_PAGE_SIZE } from '@/features/notifications/model/sms-send/types'
import { buildSmsSenderPhoneOptions } from '@/features/notifications/model/sms-template/sender-phone'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'
import {
  classifyAlimtalkPlaceholderKey,
  listAlimtalkManualVariableKeys,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import {
  SMS_SEND_CONFIRM_MESSAGE,
  listSmsSendPlaceholderKeys,
  validateSmsSendVariables,
  type SmsSendVariableValidationResult,
} from '@/features/notifications/model/sms-send/validate-send'
import {
  buildNotificationTemplateVariablesQuery,
  inferUniqueRecipientTypeValue,
} from '@/features/notifications/model/shared/template-variables-query'
import {
  SMS_SEND_MEMBER_TYPE_OPTIONS,
  SMS_SEND_PARTICIPATION_TYPE_OPTIONS,
  createManualRecipient,
  filterSmsSendRecipients,
  formatSmsPhoneDuplicateMessage,
  listSmsPhoneDuplicateNotices,
  normalizeSmsSendPhone,
  resolveSmsSendRecipientTypeMode,
  smsSendRecipientTypeColumnTitle,
  smsSendRecipientTypeLabel,
  toSmsSendMemberTypeApi,
  toSmsSendParticipantTypeApi,
} from '@/features/notifications/model/sms-send/recipients'
import { isValidKoreanPhoneNumber } from '@/shared/utils/phone-validation'
import { type SmsSendRecipientSearchParams } from '@/features/notifications/model/sms-send/types'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import { PreviewModal } from '@/features/notifications/ui/sms-template/preview-modal'
import { ProgramSelectField } from '@/features/notifications/ui/mail-send/program-select-field'
import { SendScheduleField } from '@/features/notifications/ui/shared/send-schedule-field'
import { SmsSendComposeFields } from './compose-fields'
import {
  SMS_SEND_REQUEST_ATTACHMENT_OVERRIDE_HINT,
  SMS_SEND_TEMPLATE_ATTACHMENT_HINT,
} from '@/features/notifications/model/sms-send/attachments'
import { SendRequestCompletedModal } from '@/features/notifications/ui/shared/send-request-completed-modal'
import { showNotificationSendErrorAlert } from '@/features/notifications/ui/shared/show-notification-send-request-failed-alert'
import { RecipientManualModal } from '@/features/notifications/ui/shared/recipient-manual-modal'
import { RecipientSelectModal } from '@/features/notifications/ui/shared/recipient-select-modal'
import { TemplateSelectField } from '@/features/notifications/ui/shared/template-select-field'
import { RecipientTable } from './recipient-table'
import { useSmsSendForm } from './use-form'
import '@/features/notifications/ui/shared/notification-fullpage-modal.css'
import '@/features/notifications/ui/mail-send/fullpage-modal.css'
import './fullpage-modal.css'

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sms-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** BE 발송 검증 오류(error.code) → 포커스할 입력 */
const SMS_SEND_ERROR_FOCUS_SELECTORS = {
  template: '.sms-send-fullpage__message-type input:not(:disabled)',
  messageType: '.sms-send-fullpage__message-type input:not(:disabled)',
  content: '.sms-send-fullpage__body-field textarea',
  sender: '.sms-send-fullpage__sender-select input',
  attachments: '.sms-send-fullpage__attachments button:not(:disabled)',
} as const

function recipientTotalPages(total: number, size: number, totalPages?: number): number {
  if (totalPages != null && totalPages > 0) return totalPages
  return Math.max(Math.ceil((total || 0) / (size || SMS_SEND_PICKER_PAGE_SIZE)), 1)
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
  initialTemplateId?: string
}

export function SendFullpageModal({ open, onClose, initialTemplateId }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const invalidateHistory = useInvalidateSmsSendHistory()
  const form = useSmsSendForm(open, initialTemplateId)
  const remote = shouldUseSmsSendRemoteApi()
  const canLoadProgramScoped =
    isNotificationSendWithoutProgram(form.programId) ||
    parseNotificationSendProgramId(form.programId) != null
  const templatesQuery = useSmsSendTemplatePickerQuery(open && remote && canLoadProgramScoped)
  const templates = templatesQuery.data ?? []
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBodyText, setPreviewBodyText] = useState('')
  const [previewAt, setPreviewAt] = useState<string | undefined>()
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [usedVariableKeys, setUsedVariableKeys] = useState<string[]>([])
  const handleUsedVariableKeysChange = useCallback((keys: string[]) => {
    setUsedVariableKeys(prev => {
      if (prev.length === keys.length && prev.every((key, index) => key === keys[index])) {
        return prev
      }
      return keys
    })
  }, [])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sendRequestCompletedOpen, setSendRequestCompletedOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState<SmsSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })

  const selectedTemplate = useMemo(
    () => templates.find(item => item.id === form.templateId) ?? null,
    [form.templateId, templates]
  )
  const senderProfilesQuery = useSmsSenderProfilesQuery(open && remote)
  const programsQuery = useNotificationSendProgramsQuery(open && remote)
  const programs = programsQuery.data ?? []
  /** 모달 open당 1회만 시드. 비어 있을 때마다 채우면 사용자가 지운 값이 다시 들어온다. */
  const didSeedSenderRef = useRef(false)

  useEffect(() => {
    if (!open) {
      didSeedSenderRef.current = false
      return
    }
    if (didSeedSenderRef.current) return
    const first = senderProfilesQuery.data?.[0]
    if (!first) return
    didSeedSenderRef.current = true
    if (!form.senderPhone.trim()) form.setSenderPhone(first.senderKey)
  }, [form.senderPhone, form.setSenderPhone, open, senderProfilesQuery.data])

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

  // NHN 사전 등록 발신번호만 노출 (orphan 미포함)
  const senderOptions = useMemo(
    () => buildSmsSenderPhoneOptions(senderProfilesQuery.data),
    [senderProfilesQuery.data]
  )
  const resolvedSenderProfileId = useMemo(() => {
    return resolveSmsSenderProfileId(senderProfilesQuery.data ?? [], form.senderPhone)
  }, [form.senderPhone, senderProfilesQuery.data])
  const programNumericId = parseNotificationSendProgramId(form.programId)
  const onRecipientPrivacyFailure = useCallback(
    (failure: 'forbidden' | 'audit-unavailable') => {
      if (failure === 'audit-unavailable') form.clearRecipients()
      else form.clearCandidateRecipients()
      setSelectedRecipientIds([])
      setSendConfirmOpen(false)
    },
    [form.clearCandidateRecipients, form.clearRecipients]
  )
  const recipientPrivacy = useRecipientCandidatePrivacyGate({
    screenOpen: open,
    programKey: String(programNumericId ?? ''),
    onFailure: onRecipientPrivacyFailure,
  })
  const isWithoutProgram = isNotificationSendWithoutProgram(form.programId)
  const recipientTypeMode = resolveSmsSendRecipientTypeMode(form.programId)
  const typeColumnTitle = smsSendRecipientTypeColumnTitle(recipientTypeMode)

  const templateVariablesQuery = useMemo(
    () =>
      buildNotificationTemplateVariablesQuery({
        programId: programNumericId,
        participantTypeValue: inferUniqueRecipientTypeValue(
          form.recipients.map(item => item.participationType)
        ),
        memberTypeValue: inferUniqueRecipientTypeValue(
          form.recipients.map(item => item.memberType)
        ),
        toParticipantTypeApi: toSmsSendParticipantTypeApi,
        toMemberTypeApi: toSmsSendMemberTypeApi,
      }),
    [form.recipients, programNumericId]
  )

  const candidatesQuery = useSmsRecipientCandidatesQuery(
    {
      programId: programNumericId,
      keyword: recipientSearch.keyword || undefined,
      participantType:
        recipientTypeMode === 'participation'
          ? toSmsSendParticipantTypeApi(recipientSearch.typeValue)
          : undefined,
      memberType:
        recipientTypeMode === 'member'
          ? toSmsSendMemberTypeApi(recipientSearch.typeValue)
          : undefined,
      page: recipientSearch.page,
      size: SMS_SEND_PICKER_PAGE_SIZE,
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
  const variablesQuery = useSmsTemplateVariablesQuery(
    templateVariablesQuery,
    open && remote && canLoadProgramScoped
  )
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
        keys: usedVariableKeys,
        catalog: variablesCatalog,
        recipient: { source: 'manual', actorType: 'DIRECT' },
        programSelected,
      }),
    [programSelected, usedVariableKeys, variablesCatalog]
  )
  const manualKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const recipient of form.recipients) {
      next[recipient.id] = listAlimtalkManualVariableKeys({
        keys: usedVariableKeys,
        catalog: variablesCatalog,
        recipient,
        programSelected,
      })
    }
    return next
  }, [form.recipients, programSelected, usedVariableKeys, variablesCatalog])
  const blockedKeysByRecipientId = useMemo(() => {
    const next: Record<string, string[]> = {}
    if (variablesCatalog == null) return next
    for (const recipient of form.recipients) {
      const blocked: string[] = []
      for (const key of usedVariableKeys) {
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
  }, [form.recipients, programSelected, usedVariableKeys, variablesCatalog])
  const readVariableCheck = (): SmsSendVariableValidationResult => {
    const draft = form.getDraft()
    return validateSmsSendVariables({
      programId: draft.programId,
      messageType: draft.messageType,
      subject: draft.subject,
      bodyText: draft.bodyText,
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
      const found = (variablesCatalog ?? []).find(item => item.key === label)
      return isNotificationCatalogVariableDisabled(found, programNumericId)
    },
    [programNumericId, variablesCatalog]
  )
  const hasTemplates = templates.length > 0
  const canPickTemplate = canSelectNotificationSendTemplate(form.programId) && hasTemplates

  const isTemplateUsable = useCallback(
    (template: (typeof templates)[number]) =>
      canUseNotificationSendTemplateForProgram({
        texts: [template.subject, template.bodyText],
        catalog: variablesCatalog,
        programNumericId,
      }),
    [programNumericId, variablesCatalog]
  )

  const getTemplateUnusableMessage = useCallback(
    (template: (typeof templates)[number]) =>
      formatNotificationSendTemplateDisabledKeysWarning(
        listNotificationSendTemplateDisabledKeysForProgram({
          texts: [template.subject, template.bodyText],
          catalog: variablesCatalog,
          programNumericId,
        })
      ),
    [programNumericId, variablesCatalog]
  )

  // 선택 완료된 템플릿은 수신자 추가·유형 문맥 변경으로 자동 clear 하지 않음.

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

  function handleDisabledVariableInsert() {
    showAlert({
      title: '안내',
      content: '현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.',
    })
  }

  function handleClose() {
    setPreviewOpen(false)
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSelectedRecipientIds([])
    setSendConfirmOpen(false)
    onClose()
  }

  function handleDeleteSelected() {
    if (selectedRecipientIds.length === 0) {
      showAlert({ title: '안내', content: '삭제할 수신자를 선택해 주세요.' })
      return
    }
    form.removeRecipients(selectedRecipientIds)
    setSelectedRecipientIds([])
  }

  function handleOpenRecipientSelect() {
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  function handleOpenRecipientManual() {
    if (!isWithoutProgram) return
    setRecipientManualOpen(true)
  }

  function handlePreview() {
    const snapshot = form.readComposeSnapshot()
    setPreviewSubject(snapshot.subject)
    setPreviewBodyText(snapshot.bodyText)
    setPreviewAt(
      form.sendTiming === 'scheduled' && form.scheduledAt
        ? form.scheduledAt.toISOString()
        : new Date().toISOString()
    )
    setPreviewOpen(true)
  }

  function handleSend() {
    if (recipientPrivacy.blockSend) return
    if (form.composeBlocking) {
      const error = form.validateRequired()
      showAlert({ title: '필수 입력 안내', content: error ?? '입력값을 확인하세요.' })
      return
    }
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }

    if (remote && senderProfilesQuery.data && senderProfilesQuery.data.length > 0) {
      if (!resolvedSenderProfileId) {
        showAlert({
          title: '필수 입력 안내',
          content: 'NHN에 등록된 발신 번호를 선택해 주세요.',
        })
        return
      }
    }

    const variableResult = readVariableCheck()
    if (!variableResult.ok) {
      showAlert({ title: variableResult.title, content: variableResult.alert })
      return
    }

    setSendConfirmOpen(true)
  }

  async function handleConfirmSend() {
    if (recipientPrivacy.blockSend) return
    if (sending) return
    const error = form.validateRequired()
    if (error) {
      setSendConfirmOpen(false)
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    const variableResult = readVariableCheck()
    if (!variableResult.ok) {
      setSendConfirmOpen(false)
      showAlert({ title: variableResult.title, content: variableResult.alert })
      return
    }
    setSending(true)
    try {
      const draft = form.getDraft()
      await submitSmsSend({
        draft: { ...draft, recipients: variableResult.validRecipients },
        placeholderKeys: listSmsSendPlaceholderKeys(draft),
        variableCatalog: variablesCatalog ?? null,
        templateDisplayName: selectedTemplate?.templateName,
        templateCategoryId: selectedTemplate?.categoryId,
        templateBaseline: selectedTemplate
          ? {
              subject: selectedTemplate.subject,
              bodyText: selectedTemplate.bodyText,
              messageType: selectedTemplate.messageType,
            }
          : undefined,
        idempotencyKey: createIdempotencyKey(),
        senderProfileId: resolvedSenderProfileId,
      })
      setSendConfirmOpen(false)
      await invalidateHistory()
      setSendRequestCompletedOpen(true)
    } catch (error) {
      setSendConfirmOpen(false)
      showNotificationSendErrorAlert(showAlert, error, SMS_SEND_ERROR_FOCUS_SELECTORS)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={handleClose}
        title="문자 발송"
        size="full"
        hideHeader
        className="notification-fullpage-modal mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="notification-fullpage-modal__shell">
          <header className="notification-fullpage-modal__title-row">
            <span className="notification-fullpage-modal__title-text">문자 발송</span>
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
                <CmsButton variant="cancel" size="large" type="button" onClick={handleClose}>
                  취소
                </CmsButton>
                <CmsButton variant="secondary" size="large" type="button" onClick={handlePreview}>
                  미리보기
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  type="button"
                  disabled={
                    sending ||
                    recipientPrivacy.blockSend ||
                    form.attachmentUploadPending ||
                    form.composeBlocking ||
                    form.recipients.length === 0 ||
                    !form.senderPhone.trim() ||
                    (form.sendTiming === 'scheduled' && !form.scheduledAt)
                  }
                  onClick={handleSend}
                >
                  문자 발송
                </CmsButton>
              </div>
            </div>

            <div className="notification-fullpage-modal__layout">
              <div className="notification-fullpage-modal__main">
                <section className="notification-fullpage-modal__widget">
                  <h3 className="mail-send-fullpage__section-title">1. 기본 설정</h3>
                  <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="대상 프로그램"
                        fullRow
                        view=""
                        edit={
                          <ProgramSelectField
                            value={form.programId || undefined}
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
                            onSelect={form.applyTemplate}
                            extraColumns={[
                              {
                                title: '발송 유형',
                                dataIndex: 'messageType',
                                key: 'messageType',
                                width: 140,
                                align: 'center',
                              },
                            ]}
                            renderPreview={({ template, open, onClose, zIndex }) => (
                              <PreviewModal
                                open={open}
                                zIndex={zIndex}
                                templateName={template?.templateName ?? ''}
                                senderPhone={template?.senderPhone ?? ''}
                                messageType={template?.messageType ?? 'SMS'}
                                subject={template?.subject ?? ''}
                                bodyText={template?.bodyText ?? ''}
                                attachments={
                                  template?.attachments?.length
                                    ? template.attachments.map(item => ({
                                        name: item.fileName,
                                        sizeBytes: item.byteSize,
                                      }))
                                    : template?.attachmentFileNames.map(name => ({ name }))
                                }
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
                        label="발신 번호"
                        required
                        view={form.senderPhone}
                        edit={
                          <CmsSelect
                            className="sms-send-fullpage__sender-select"
                            inputSize="small"
                            width="100%"
                            withAllOption={false}
                            loading={senderProfilesQuery.isLoading}
                            placeholder="발신 번호를 선택해 주세요"
                            options={senderOptions}
                            value={form.senderPhone || undefined}
                            onChange={value => form.setSenderPhone(String(value ?? ''))}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발송 유형"
                        required
                        view={form.messageType}
                        edit={
                          <CmsRadio.Group
                            className="sms-send-fullpage__message-type"
                            size="medium"
                            disabled={Boolean(form.templateId?.trim())}
                            value={form.messageType}
                            onChange={event =>
                              form.applyMessageType(
                                event.target.value === 'MMS' || event.target.value === 'LMS'
                                  ? event.target.value
                                  : 'SMS'
                              )
                            }
                          >
                            <CmsRadio size="medium" value="SMS">
                              SMS
                            </CmsRadio>
                            <CmsRadio size="medium" value="LMS">
                              LMS
                            </CmsRadio>
                            <CmsRadio size="medium" value="MMS">
                              MMS
                            </CmsRadio>
                          </CmsRadio.Group>
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
                  {candidateNotice ? (
                    <p className="mail-send-fullpage__section-hint" role="alert">
                      {candidateNotice}
                    </p>
                  ) : null}
                  <RecipientTable
                    recipients={form.recipients}
                    selectedIds={selectedRecipientIds}
                    onSelectedIdsChange={setSelectedRecipientIds}
                    typeColumnTitle={typeColumnTitle}
                    typeMode={recipientTypeMode}
                    manualKeysByRecipientId={manualKeysByRecipientId}
                    blockedKeysByRecipientId={blockedKeysByRecipientId}
                    onVariableChange={form.updateRecipientVariable}
                  />
                </section>

                <section className="notification-fullpage-modal__widget sms-send-fullpage__widget--compose">
                  <SmsSendComposeFields
                    composeVersion={form.composeVersion}
                    initialSubject={form.composeSeed.subject}
                    initialBodyText={form.composeSeed.bodyText}
                    messageType={form.messageType}
                    attachmentFileNames={form.attachmentFileNames}
                    subjectRef={form.subjectRef}
                    bodyTextRef={form.bodyTextRef}
                    senderPhone={form.senderPhone}
                    onRememberSubjectRange={form.rememberSubjectRange}
                    onRememberBodyRange={form.rememberBodyRange}
                    onRemoveAttachment={form.removeAttachmentAt}
                    onAddAttachments={form.addAttachments}
                    attachmentRemovable={form.attachmentSource === 'request'}
                    attachmentUploading={form.attachmentUploadPending}
                    attachmentHint={
                      form.attachmentSource === 'template'
                        ? SMS_SEND_TEMPLATE_ATTACHMENT_HINT
                        : form.attachmentSource === 'request' &&
                            form.templateAttachmentFileNames.length > 0
                          ? SMS_SEND_REQUEST_ATTACHMENT_OVERRIDE_HINT
                          : null
                    }
                    onBlockingChange={form.setComposeBlocking}
                    onUsedVariableKeysChange={handleUsedVariableKeysChange}
                  />
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

      {previewOpen ? (
        <PreviewModal
          open={open && previewOpen}
          zIndex={1100}
          templateName={selectedTemplate?.templateName ?? ''}
          senderPhone={form.senderPhone}
          messageType={form.messageType}
          subject={previewSubject}
          bodyText={previewBodyText}
          attachments={
            form.attachmentSource === 'template' && selectedTemplate?.attachments?.length
              ? selectedTemplate.attachments.map(item => ({
                  name: item.fileName,
                  sizeBytes: item.byteSize,
                }))
              : form.attachmentFileNames.map(name => ({ name }))
          }
          previewAt={previewAt}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidateItems}
        initialSelected={recipientPrivacy.failure ? [] : form.recipients}
        resetKey={`${recipientTypeMode}:${recipientPrivacy.failure ?? ''}`}
        statusMessage={candidateNotice}
        selectionBlocked={recipientPrivacy.blockSelection || candidatesQuery.isError}
        loading={candidatesQuery.isFetching && !candidatesQuery.isError}
        typeColumnTitle={typeColumnTitle}
        typeOptions={
          recipientTypeMode === 'member'
            ? SMS_SEND_MEMBER_TYPE_OPTIONS
            : SMS_SEND_PARTICIPATION_TYPE_OPTIONS
        }
        getTypeLabel={row => smsSendRecipientTypeLabel(row, recipientTypeMode) || '-'}
        contactColumnTitle="휴대폰 번호"
        getContact={row => normalizeSmsSendPhone(row.phone) || '-'}
        filterCandidates={(rows, applied) =>
          filterSmsSendRecipients(rows, {
            typeMode: recipientTypeMode,
            typeValue: applied.typeValue,
            keyword: applied.keyword,
          })
        }
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
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
                  const result = await candidatesQuery.refetch({
                    throwOnError: true,
                  })
                  if (!result.data) return []
                  if (result.data.total <= result.data.items.length) return result.data.items
                  return await fetchAllSmsRecipientCandidates({
                    programId: programNumericId,
                    keyword: recipientSearch.keyword || undefined,
                    participantType:
                      recipientTypeMode === 'participation'
                        ? toSmsSendParticipantTypeApi(recipientSearch.typeValue)
                        : undefined,
                    memberType:
                      recipientTypeMode === 'member'
                        ? toSmsSendMemberTypeApi(recipientSearch.typeValue)
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
        onConfirm={recipients => {
          if (recipientPrivacy.blockSelection) return
          const notices = listSmsPhoneDuplicateNotices(form.recipients, recipients)
          form.addRecipients(recipients)
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatSmsPhoneDuplicateMessage(notices) })
          }
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen && isWithoutProgram}
        contact="phone"
        values={form.recipients
          .filter(item => item.source === 'manual')
          .map(item => ({ contact: item.phone, variables: item.variables }))}
        variableKeys={directManualKeys}
        normalize={normalizeSmsSendPhone}
        isValid={isValidKoreanPhoneNumber}
        invalidMessage="올바른 휴대폰 번호를 입력해 주세요."
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={entries => {
          const manual = entries.map(entry =>
            createManualRecipient(entry.contact, '', entry.variables)
          )
          const withoutManual = form.recipients.filter(item => item.source !== 'manual')
          const notices = listSmsPhoneDuplicateNotices(withoutManual, manual)
          form.replaceManualRecipients(manual)
          if (notices.length > 0) {
            showAlert({ title: '안내', content: formatSmsPhoneDuplicateMessage(notices) })
          }
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="문자 발송 확인"
        content={variableCheck.ok ? variableCheck.confirmMessage : SMS_SEND_CONFIRM_MESSAGE}
        confirmText="발송"
        cancelText="취소"
        confirmLoading={sending}
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => {
          if (!sending) setSendConfirmOpen(false)
        }}
      />
      <SendRequestCompletedModal
        open={sendRequestCompletedOpen && open}
        channel="sms"
        onDismissSendScreen={() => {
          setSendRequestCompletedOpen(false)
          handleClose()
        }}
      />
    </>
  )
}
