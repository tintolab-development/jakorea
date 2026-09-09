import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  CmsPhoneInput,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import {
  getNotificationSendBatchErrorMessage,
  getNotificationsApiErrorMessage,
} from '@/features/notifications/api/get-notifications-api-error'
import {
  getSmsRecipientCandidates,
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
import { useNotificationSendProgramsQuery } from '@/features/notifications/hooks/use-send-programs-query'
import {
  canSelectNotificationSendTemplate,
  isNotificationSendAllProgram,
  isNotificationSendProgramUnset,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import { canUseNotificationSendTemplateForProgram } from '@/features/notifications/model/shared/template-usable-for-program'
import { SMS_SEND_ALL_PROGRAM_ID } from '@/features/notifications/model/sms-send/types'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'
import {
  buildNotificationTemplateVariablesQuery,
  inferUniqueRecipientTypeValue,
} from '@/features/notifications/model/shared/template-variables-query'
import {
  createManualRecipient,
  resolveSmsSendRecipientTypeMode,
  smsSendRecipientTypeColumnTitle,
  toSmsSendMemberTypeApi,
  toSmsSendParticipantTypeApi,
} from '@/features/notifications/model/sms-send/recipients'
import { type SmsSendRecipientSearchParams } from '@/features/notifications/model/sms-send/types'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import { PreviewModal } from '@/features/notifications/ui/sms-template/preview-modal'
import { ProgramSelectField } from '@/features/notifications/ui/mail-send/program-select-field'
import { SendScheduleField } from '@/features/notifications/ui/shared/send-schedule-field'
import { SmsSendComposeFields } from './compose-fields'
import { RecipientManualModal } from './recipient-manual-modal'
import { RecipientSelectModal } from './recipient-select-modal'
import { RecipientTable } from './recipient-table'
import { TemplateSelectField } from './template-select-field'
import { useSmsSendForm } from './use-form'
import '@/features/notifications/ui/mail-send/fullpage-modal.css'
import './fullpage-modal.css'

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sms-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function recipientTotalPages(total: number, size: number, totalPages?: number): number {
  if (totalPages != null && totalPages > 0) return totalPages
  return Math.max(Math.ceil((total || 0) / (size || 50)), 1)
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
  initialTemplateId?: string
}

export function SendFullpageModal({
  open,
  onClose,
  initialTemplateId,
}: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const invalidateHistory = useInvalidateSmsSendHistory()
  const form = useSmsSendForm(open, initialTemplateId)
  const remote = shouldUseSmsSendRemoteApi()
  const canLoadProgramScoped = !isNotificationSendProgramUnset(form.programId)
  const templatesQuery = useSmsSendTemplatePickerQuery(open && remote && canLoadProgramScoped)
  const templates = templatesQuery.data ?? []
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBodyText, setPreviewBodyText] = useState('')
  const [previewAt, setPreviewAt] = useState<string | undefined>()
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
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

  useEffect(() => {
    if (!open) return
    const first = senderProfilesQuery.data?.[0]
    if (!first) return
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

  const resolvedSenderProfileId = useMemo(() => {
    return resolveSmsSenderProfileId(senderProfilesQuery.data ?? [], form.senderPhone)
  }, [form.senderPhone, senderProfilesQuery.data])
  const programNumericId = parseNotificationSendProgramId(form.programId)
  const recipientTypeMode = resolveSmsSendRecipientTypeMode(form.programId)
  const typeColumnTitle = smsSendRecipientTypeColumnTitle(recipientTypeMode)

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
        toParticipantTypeApi: toSmsSendParticipantTypeApi,
        toMemberTypeApi: toSmsSendMemberTypeApi,
      }),
    [programNumericId, recipientTypeMode, variablesTypeValue]
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
        recipientTypeMode === 'member' ? toSmsSendMemberTypeApi(recipientSearch.typeValue) : undefined,
      page: recipientSearch.page,
      size: 50,
    },
    open && recipientSelectOpen && programNumericId != null
  )
  const variablesQuery = useSmsTemplateVariablesQuery(
    templateVariablesQuery,
    open && remote && canLoadProgramScoped
  )
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const isCatalogItemDisabled = useCallback(
    (label: string) => {
      const found = (variablesQuery.data ?? []).find(item => item.key === label)
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
        texts: [template.subject, template.bodyText],
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
      showAlert({ title: '안내', content: '삭제할 수신자를 선택하세요.' })
      return
    }
    form.removeRecipients(selectedRecipientIds)
    setSelectedRecipientIds([])
  }

  function handleOpenRecipientSelect() {
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

  function handleOpenRecipientManual() {
    if (isProgramUnset) {
      showAlert({ title: '안내', content: '대상 프로그램을 선택하세요.' })
      return
    }
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
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }

    if (remote && senderProfilesQuery.data && senderProfilesQuery.data.length > 0) {
      if (!resolvedSenderProfileId) {
        showAlert({
          title: '필수 입력 안내',
          content: 'NHN에 등록된 발신 번호를 입력하세요.',
        })
        return
      }
    }

    setSendConfirmOpen(true)
  }

  async function handleConfirmSend() {
    if (sending) return
    setSending(true)
    try {
      const draft = form.getDraft()
      await submitSmsSend({
        draft,
        templateDisplayName: selectedTemplate?.templateName,
        idempotencyKey: createIdempotencyKey(),
        senderProfileId: resolvedSenderProfileId,
      })
      setSendConfirmOpen(false)
      await invalidateHistory()
      showAlert({
        title: '문자 발송 완료',
        content: '문자 발송이 완료되었습니다.',
        confirmLabel: '닫기',
      })
      handleClose()
    } catch (error) {
      setSendConfirmOpen(false)
      showAlert({
        title: '문자 발송 실패',
        content: getNotificationSendBatchErrorMessage(error, '문자 발송에 실패했습니다.'),
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
        title="문자 발송"
        size="full"
        hideHeader
        className="mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="mail-send-fullpage-modal__shell">
          <header className="mail-send-fullpage-modal__title-row">
            <span className="mail-send-fullpage-modal__title-text">문자 발송</span>
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
                프로그램 선택이 필요합니다. 템플릿을 선택하면 메시지 유형, 발신 번호,
                제목/내용이 자동 반영됩니다.
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
                  disabled={sending}
                  onClick={handleSend}
                >
                  문자 발송
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
                            value={form.programId || undefined}
                            programs={programs}
                            onSelect={program => {
                              form.setProgramId(program.id)
                              form.clearRecipients()
                              setSelectedRecipientIds([])
                            }}
                            onClearProgram={() => {
                              form.setProgramId(SMS_SEND_ALL_PROGRAM_ID)
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
                        required
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
                        label="메시지 유형"
                        view={form.messageType}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            value={form.messageType}
                            disabled
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
                          <CmsPhoneInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="발신 번호를 입력하세요"
                            value={form.senderPhone}
                            onChange={event => form.setSenderPhone(event.target.value)}
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
                  <h3 className="mail-send-fullpage__section-title">3. 문자 작성</h3>
                  <SmsSendComposeFields
                    composeVersion={form.composeVersion}
                    initialSubject={form.composeSeed.subject}
                    initialBodyText={form.composeSeed.bodyText}
                    showSubject={form.showSubject}
                    bodyByteLimit={form.bodyByteLimit}
                    subjectRef={form.subjectRef}
                    bodyTextRef={form.bodyTextRef}
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
            selectedTemplate?.attachments?.length
              ? selectedTemplate.attachments.map(item => ({
                  name: item.fileName,
                  sizeBytes: item.byteSize,
                }))
              : selectedTemplate?.attachmentFileNames.map(name => ({ name }))
          }
          previewAt={previewAt}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidatesQuery.data?.items}
        initialSelected={form.recipients}
        typeMode={recipientTypeMode}
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
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
          remote && programNumericId != null
            ? async () => {
                const total = Math.max(candidatesQuery.data?.total ?? 0, 1)
                const result = await candidatesQuery.refetch({
                  throwOnError: true,
                })
                if (!result.data) return []
                if (result.data.total <= result.data.items.length) return result.data.items
                const all = await getSmsRecipientCandidates({
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
                  page: 0,
                  size: Math.min(Math.max(total, 50), 1000),
                })
                return all.items
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
        phones={form.recipients.filter(item => item.source === 'manual').map(item => item.phone)}
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={phones => {
          form.replaceManualRecipients(phones.map(phone => createManualRecipient(phone)))
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="문자 발송 확인"
        content="해당 내용으로 문자를 발송하시겠습니까?"
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
