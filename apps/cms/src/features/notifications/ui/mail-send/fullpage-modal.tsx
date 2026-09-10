import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import { ComposeFields } from '@/features/notifications/ui/mail-template/compose-fields'
import { PreviewModal } from '@/features/notifications/ui/mail-template/preview-modal'
import type {
  MailPreviewAttachment,
  MailPreviewRecipient,
} from '@/features/notifications/model/mail-template/preview'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import {
  groupMailTemplateVariablesFromCatalog,
} from '@/features/notifications/model/mail-template/variables'
import { type MailSendRecipientSearchParams } from '@/features/notifications/model/mail-send/types'
import { useNotificationSendProgramsQuery } from '@/features/notifications/hooks/use-send-programs-query'
import {
  canSelectNotificationSendTemplate,
  isNotificationSendAllProgram,
  isNotificationSendProgramUnset,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import { canUseNotificationSendTemplateForProgram } from '@/features/notifications/model/shared/template-usable-for-program'
import { MAIL_SEND_ALL_PROGRAM_ID } from '@/features/notifications/model/mail-send/types'
import {
  inferUniqueRecipientTypeValue,
  buildNotificationTemplateVariablesQuery,
} from '@/features/notifications/model/shared/template-variables-query'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'
import {
  mailSendRecipientTypeColumnTitle,
  resolveMailSendRecipientTypeMode,
  toMailSendMemberTypeApi,
  toMailSendParticipantTypeApi,
} from '@/features/notifications/model/mail-send/recipients'
import {
  shouldUseMailSendRemoteApi,
  submitMailSend,
  getMailRecipientCandidates,
} from '@/features/notifications/api/mail-send-service'
import {
  getNotificationSendBatchErrorMessage,
  getNotificationsApiErrorMessage,
} from '@/features/notifications/api/get-notifications-api-error'
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
import { TemplateSelectField } from './template-select-field'
import { RecipientTable } from './recipient-table'
import { RecipientSelectModal } from './recipient-select-modal'
import { RecipientManualModal } from './recipient-manual-modal'
import './fullpage-modal.css'

type SenderNameFieldProps = {
  seed: string
  epoch: number
  onChange: (value: string) => void
}

function SenderNameField({ seed, epoch, onChange }: SenderNameFieldProps) {
  const [value, setValue] = useState(seed)
  useEffect(() => {
    setValue(seed)
  }, [epoch, seed])
  return (
    <CmsInput
      inputSize="large"
      width="100%"
      allowClear={false}
      placeholder="발신자명을 입력하세요"
      value={value}
      onChange={event => {
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
  const canLoadProgramScoped = !isNotificationSendProgramUnset(form.programId)
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
    if (!form.senderEmail.trim()) form.setSenderEmail(first.senderKey)
    if (!form.senderNameSeed.trim()) form.replaceSenderName(first.displayName)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open당 1회 시드; sender 입력 deps 금지
  }, [open, senderProfilesQuery.data, form.replaceSenderName, form.setSenderEmail])
  const programNumericId = useMemo(
    () => parseNotificationSendProgramId(form.programId),
    [form.programId]
  )
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
    const fromFilter = recipientSearch.typeValue.trim()
    if (fromFilter) return fromFilter
    if (recipientTypeMode === 'participation') {
      return inferUniqueRecipientTypeValue(
        form.recipients.map(item => item.participationType)
      )
    }
    return inferUniqueRecipientTypeValue(form.recipients.map(item => item.memberType))
  }, [form.recipients, recipientSearch.typeValue, recipientTypeMode])

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
      size: 50,
    },
    open && recipientSelectOpen && programNumericId != null
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

  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const isCatalogItemDisabled = useCallback(
    (label: string) => {
      const catalog = variablesQuery.data ?? []
      const found = catalog.find(item => item.key === label)
      return isNotificationCatalogVariableDisabled(found, programNumericId)
    },
    [programNumericId, variablesQuery.data]
  )

  const hasTemplates = templates.length > 0
  const canPickTemplate = canSelectNotificationSendTemplate(form.programId) && hasTemplates
  const isAllProgram = isNotificationSendAllProgram(form.programId)
  const isProgramUnset = isNotificationSendProgramUnset(form.programId)

  const isTemplateUsable = useCallback(
    (template: (typeof templates)[number]) =>
      canUseNotificationSendTemplateForProgram({
        texts: [template.subject, template.bodyHtml],
        catalog: variablesQuery.data,
        programNumericId,
      }),
    [programNumericId, variablesQuery.data]
  )

  useEffect(() => {
    if (!open || !form.templateId) return
    const selected = templates.find(item => item.id === form.templateId)
    if (!selected) return
    if (!isTemplateUsable(selected)) {
      form.clearTemplate()
    }
  }, [form.clearTemplate, form.templateId, isTemplateUsable, open, templates])

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
    if (isProgramUnset) {
      showAlert({ title: '안내', content: '대상 프로그램을 선택하세요.' })
      return
    }
    if (isAllProgram || programNumericId == null) {
      showAlert({
        title: '안내',
        content:
          '대상 프로그램이 미선택일 때는 프로그램 참여 회원 후보를 조회할 수 없습니다. 수신자 직접 입력을 이용해 주세요.',
      })
      return
    }
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  const handleOpenRecipientManual = () => {
    if (isProgramUnset) {
      showAlert({ title: '안내', content: '대상 프로그램을 선택하세요.' })
      return
    }
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
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = async () => {
    if (sending) return
    setSending(true)
    try {
      const draft = form.getDraft()
      const selected = draft.templateId
        ? templates.find(item => item.id === draft.templateId)
        : undefined
      await submitMailSend({
        draft,
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
      showAlert({
        title: '메일 발송 완료',
        content: '메일 발송이 완료되었습니다.',
        confirmLabel: '닫기',
      })
      handleClose()
    } catch (error) {
      setSendConfirmOpen(false)
      showAlert({
        title: '메일 발송 실패',
        content: getNotificationSendBatchErrorMessage(error, '메일 발송에 실패했습니다.'),
      })
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
        className="mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="mail-send-fullpage-modal__shell">
          <header className="mail-send-fullpage-modal__title-row">
            <span className="mail-send-fullpage-modal__title-text">메일 발송</span>
            <button
              type="button"
              className="mail-send-fullpage-modal__title-close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="mail-send-fullpage-modal__body">
            <div className="mail-send-fullpage-modal__notice">
              <p className="mail-send-fullpage-modal__notice-text">
                * 프로그램은 현재 운영 중인 프로그램만 선택 가능합니다. 발송·수신자 조회에는
                프로그램 선택이 필요합니다. 제목·본문·첨부는 선택한 템플릿 기준으로 발송됩니다.
              </p>
              <div className="mail-send-fullpage-modal__notice-actions">
                <CmsButton variant="cancel" size="large" width={140} type="button" onClick={handleClose}>
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

            <div className="mail-send-fullpage-modal__layout">
              <div className="mail-send-fullpage-modal__main">
                <section className="mail-send-fullpage__widget">
                  <h3 className="mail-send-fullpage__section-title">1. 기본 설정</h3>
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
                            }}
                            onClearProgram={() => {
                              form.setProgramId(MAIL_SEND_ALL_PROGRAM_ID)
                              form.clearRecipients()
                              setSelectedRecipientIds([])
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
                            onSelect={form.applyTemplate}
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
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발신 메일"
                        required
                        view={form.senderEmail}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="발신 메일을 입력하세요"
                            value={form.senderEmail}
                            onChange={event => form.setSenderEmail(event.target.value)}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>

                <section className="mail-send-fullpage__widget mail-send-fullpage__widget--recipients">
                  <div className="mail-send-fullpage__section-head">
                    <h3 className="mail-send-fullpage__section-title">
                      2. 수신자 설정
                      <span className="mail-send-fullpage__required">*</span>
                    </h3>
                    <div className="mail-send-fullpage__section-actions">
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
                        onClick={handleOpenRecipientManual}
                      >
                        수신자 직접 입력
                      </CmsButton>
                      <CmsButton
                        variant="secondary"
                        size="large"
                        type="button"
                        onClick={handleOpenRecipientSelect}
                      >
                        수신자 설정
                      </CmsButton>
                    </div>
                  </div>
                  <RecipientTable
                    recipients={form.recipients}
                    selectedIds={selectedRecipientIds}
                    onSelectedIdsChange={setSelectedRecipientIds}
                    typeColumnTitle={typeColumnTitle}
                  />
                </section>

                <section className="mail-send-fullpage__widget">
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
                                  inputSize="large"
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
        selectedIds={form.recipients.map(item => item.id)}
        typeMode={recipientTypeMode}
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
        totalCount={candidatesQuery.data?.total}
        totalPages={candidatesQuery.data?.totalPages}
        fetchAllCandidates={
          remote && programNumericId != null
            ? async () => {
                const total = Math.max(candidatesQuery.data?.total ?? 0, 1)
                const result = await getMailRecipientCandidates({
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
                  page: 0,
                  size: Math.min(Math.max(total, 50), 1000),
                })
                return result.items
              }
            : undefined
        }
        onClose={() => setRecipientSelectOpen(false)}
        onConfirm={recipients => {
          form.addRecipients(recipients)
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen}
        emails={form.recipients.filter(item => item.source === 'manual').map(item => item.email)}
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={emails => {
          form.addManualEmails(emails)
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="메일 발송"
        content="해당 내용으로 메일을 발송하시겠습니까?"
        confirmText="발송"
        cancelText="취소"
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => {
          if (!sending) setSendConfirmOpen(false)
        }}
      />
    </>
  )
}
