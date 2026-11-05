import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EducationSettlementItem } from '../model/types'
import type {
  SettlementAmountItemDraft,
  SettlementReceiptAttachment,
  SettlementWriteDraftLocationState,
} from '../model/write-draft'
import {
  buildSettlementWriteDraft,
  createEmptyAmountItemDraft,
  hydrateSettlementWriteFormState,
} from '../lib/build-write-draft'
import {
  INSTRUCTOR_MEAL_MAX_WON,
  formatSettlementAmountInput,
  parseSettlementAmount,
} from '../lib/format-write-draft'
import { findIndividualScheduleForSession } from '../lib/assigned-settlement-items'
import {
  individualIneligibleMessage,
  isEvidencePolicyUnconfigured,
  shouldUseIndividualSettlementSchedulesApi,
} from '../lib/individual-settlement-contract'
import {
  isReceiptEvidenceRequired,
  isReceiptWageItemType,
  normalizePayableItems,
  overlayPayableEvidenceRequired,
  pickAmountPayableItems,
  pickTransportPayableItem,
  readPayableMaxLimitWon,
  receiptPaymentItemLabel,
  sortReceiptPayableItems,
} from '../lib/payment-items'
import {
  RECEIPT_UPLOAD_ACCEPT,
  RECEIPT_UPLOAD_HINTS,
  RECEIPT_UPLOAD_POLICY,
} from '../lib/receipt-upload-policy'
import { toSeoulIsoDate } from '../lib/seoul-deadline'
import {
  SETTLEMENT_TRANSIT_OPTIONS,
  SETTLEMENT_TRIP_TYPE_OPTIONS,
} from '../lib/settlement-options'
import type { SettlementDocumentKind } from '../lib/settlement-status-ui'
import {
  SETTLEMENT_WRITE_ALERT_TITLE,
  resolveSettlementWriteValidationAlert,
  validateSettlementWriteDraft,
} from '../lib/validate-write-draft'
import { saveSettlementWriteDraft } from '../lib/write-draft-storage'
import {
  buildSettlementConfirmPath,
  resolveSettlementAreaFromPathname,
} from '../lib/write-path'
import { EducationSettlementSessionBanner } from './settlement-session-banner'
import { mapIndividualSettlementDetailToDraft } from '../lib/map-individual-settlement-detail'
import { useSettlementConsentSidecar } from '../hooks/use-payment-statement-consent-basic-info'
import {
  composeSettlementWriteBasic,
  readSettlementMemberProfileBasic,
} from '../lib/map-payment-statement-basic-info'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import {
  useIndividualSettlementDetailQuery,
  useIndividualSettlementSchedulesQuery,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { isInstructorMypageProfile } from '@/features/mypage/lib/member-profile'
import { validateUploadBatch } from '@/shared/lib/file-upload-policy'
import {
  MemberFileTooLargeError,
  MemberFileTypeNotAllowedError,
  uploadMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  PFAlertModal,
  PFButton,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormHomeAddressFields,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFFormResidentNumberInput,
  PFFormSection,
  PFItemDeleteButton,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import styles from './write-form.module.css'

type TripType = 'one_way' | 'round_trip'

type EducationSettlementWriteFormProps = {
  applicationId: string
  sessionId: string
  programTitle?: string
  session?: EducationSettlementItem
  documentKind?: SettlementDocumentKind
  applicationType?: string | null
  programType?: string | null
}

function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={name}>
      {options.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

function AmountWithWon({
  width = 160,
  value,
  onChange,
  disabled = false,
  placeholder = '직접 입력',
  ariaLabel,
  maxWon,
}: {
  width?: number
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
  maxWon?: number | null
}) {
  return (
    <div className={styles.amountRow}>
      <PFTextInput
        className={styles.amountInput}
        width={width}
        style={{ flex: `0 0 ${width}px`, width }}
        variant="formPage"
        size="large"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        aria-label={ariaLabel}
        onValueChange={next => onChange(formatSettlementAmountInput(next, maxWon))}
      />
      <PFText as="span" typo="bd-md-rg" color="black">
        원
      </PFText>
    </div>
  )
}

function ReceiptUpload({
  fileNames,
  onFileNamesChange,
  attachments,
  onAttachmentsChange,
  uploadEnabled,
  ariaLabel,
  onError,
}: {
  fileNames: string[]
  onFileNamesChange: (next: string[]) => void
  attachments?: SettlementReceiptAttachment[]
  onAttachmentsChange?: (next: SettlementReceiptAttachment[]) => void
  uploadEnabled: boolean
  ariaLabel: string
  onError: (message: string) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const visibleNames = uploadEnabled
    ? (attachments ?? []).map(item => item.fileName)
    : fileNames
  const hints = RECEIPT_UPLOAD_HINTS

  const removeName = (index: number) => {
    if (uploadEnabled) {
      onAttachmentsChange?.((attachments ?? []).filter((_, i) => i !== index))
      return
    }
    onFileNamesChange(fileNames.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.receiptStack}>
      {visibleNames.length > 0 ? (
        <ul className={styles.fileList}>
          {visibleNames.map((name, index) => (
            <li key={`${index}-${name}`} className={styles.fileChip}>
              <PFText as="span" typo="bd-md-md" color="black" className={styles.fileName}>
                {name}
              </PFText>
              <PFItemDeleteButton
                aria-label={`${name} 삭제`}
                onClick={() => removeName(index)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.fileRow}>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept={uploadEnabled ? RECEIPT_UPLOAD_ACCEPT : RECEIPT_UPLOAD_ACCEPT}
          multiple
          aria-label={ariaLabel}
          disabled={uploading}
          onChange={event => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            if (files.length === 0) return
            const policyError = validateUploadBatch({
              currentCount: visibleNames.length,
              currentTotalBytes: 0,
              incoming: files,
            })
            if (policyError) {
              onError(policyError)
              return
            }
            if (!uploadEnabled) {
              onFileNamesChange([...fileNames, ...files.map(file => file.name)])
              return
            }
            void (async () => {
              setUploading(true)
              const uploaded: SettlementReceiptAttachment[] = [...(attachments ?? [])]
              try {
                for (const file of files) {
                  const fileObjectId = await uploadMemberPortalFile({
                    file,
                    filePurpose: 'EXPENSE_RECEIPT',
                    policy: RECEIPT_UPLOAD_POLICY,
                  })
                  uploaded.push({ fileObjectId, fileName: file.name })
                }
                onAttachmentsChange?.(uploaded)
              } catch (error) {
                if (error instanceof MemberFileTooLargeError) {
                  onError(error.message)
                } else if (error instanceof MemberFileTypeNotAllowedError) {
                  onError('JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.')
                } else {
                  onError('영수증 업로드에 실패했습니다. 다시 시도해 주세요.')
                }
              } finally {
                setUploading(false)
              }
            })()
          }}
        />
        <PFButton
          type="button"
          variant="secondary"
          size="large"
          className={styles.fileButton}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? '업로드 중' : '파일 추가'}
        </PFButton>
        <div className={styles.receiptHints}>
          {hints.map(hint => (
            <PFText
              key={hint}
              as="p"
              typo="bd-sm-rg"
              color="neutral-cool-500"
              className={styles.receiptHint}
            >
              - {hint}
            </PFText>
          ))}
        </div>
      </div>
    </div>
  )
}

function TripLegBlock({
  prefix,
  heading,
  transit,
  amount,
  fileNames,
  attachments,
  uploadEnabled,
  showReceiptUpload = true,
  amountMaxWon,
  onTransitChange,
  onAmountChange,
  onFileNamesChange,
  onAttachmentsChange,
  onError,
}: {
  prefix: string
  heading?: string
  transit: string
  amount: string
  fileNames: string[]
  attachments?: SettlementReceiptAttachment[]
  uploadEnabled: boolean
  showReceiptUpload?: boolean
  amountMaxWon?: number | null
  onTransitChange: (next: string) => void
  onAmountChange: (next: string) => void
  onFileNamesChange: (next: string[]) => void
  onAttachmentsChange?: (next: SettlementReceiptAttachment[]) => void
  onError: (message: string) => void
}) {
  return (
    <div className={styles.legBlock}>
      {heading ? (
        <PFText as="p" typo="bd-lg-sb" color="black" className={styles.legHeading}>
          {heading}
        </PFText>
      ) : null}
      <PFFormFieldTable>
        <PFFormFieldRow type="double">
          <PFFormField label="대중교통 수단">
            <PFSelect
              variant="formPage"
              size="large"
              placeholder="선택"
              aria-label={`${prefix} 대중교통 수단`}
              options={[...SETTLEMENT_TRANSIT_OPTIONS]}
              value={transit || undefined}
              onValueChange={onTransitChange}
            />
          </PFFormField>
          <PFFormField label="지출 금액">
            <AmountWithWon
              value={amount}
              onChange={onAmountChange}
              ariaLabel={`${prefix} 지출 금액`}
              maxWon={amountMaxWon}
            />
          </PFFormField>
        </PFFormFieldRow>
        {showReceiptUpload ? (
          <PFFormFieldRow type="single">
            <PFFormField label="영수증 제출">
              <ReceiptUpload
                fileNames={fileNames}
                onFileNamesChange={onFileNamesChange}
                attachments={attachments}
                onAttachmentsChange={onAttachmentsChange}
                uploadEnabled={uploadEnabled}
                ariaLabel={`${prefix} 영수증 제출`}
                onError={onError}
              />
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </div>
  )
}

function AmountReceiptSection({
  id,
  title,
  required,
  description,
  footer,
  amountLabel,
  item,
  maxWon,
  onChange,
  onError,
}: {
  id: string
  title: string
  required?: boolean
  description?: string
  footer?: string
  amountLabel: string
  item: SettlementAmountItemDraft
  maxWon?: number | null
  onChange: (next: SettlementAmountItemDraft) => void
  onError: (message: string) => void
}) {
  return (
    <PFFormSection
      id={id}
      title={title}
      required={required}
      description={description}
      footer={
        [
          footer,
          maxWon != null
            ? `최대 ${maxWon.toLocaleString('ko-KR')}원까지 지급됩니다.`
            : null,
        ]
          .filter((part): part is string => Boolean(part))
          .join(' ') || undefined
      }
    >
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label={amountLabel}>
            <AmountWithWon
              value={item.amount}
              onChange={amount => onChange({ ...item, amount })}
              ariaLabel={amountLabel}
              maxWon={maxWon}
            />
          </PFFormField>
        </PFFormFieldRow>
        {isReceiptEvidenceRequired(item.evidenceRequired) ? (
          <PFFormFieldRow type="single">
            <PFFormField label="영수증 제출">
              <ReceiptUpload
                fileNames={[]}
                onFileNamesChange={() => undefined}
                attachments={item.attachments}
                onAttachmentsChange={attachments => onChange({ ...item, attachments })}
                uploadEnabled
                ariaLabel={`${amountLabel} 영수증 제출`}
                onError={onError}
              />
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </PFFormSection>
  )
}

export function EducationSettlementWriteForm({
  applicationId,
  sessionId,
  programTitle,
  session,
  documentKind = 'payment_statement',
  applicationType,
  programType,
}: EducationSettlementWriteFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useMypageMember()
  const profileQuery = usePortalProfileQuery({ enabled: true })
  const existingDetail = useIndividualSettlementDetailQuery(session?.settlementApplicationId)
  const isInstructor = isInstructorMypageProfile(profile)
  const isReceipt = documentKind === 'receipt'
  const consentSidecarQuery = useSettlementConsentSidecar(documentKind)
  const individualSchedules = useIndividualSettlementSchedulesQuery(
    shouldUseIndividualSettlementSchedulesApi(applicationType, programType) ? applicationId : null,
  )
  const matchedIndividual = useMemo(
    () =>
      findIndividualScheduleForSession(individualSchedules.schedules, {
        id: session?.id ?? sessionId,
        scheduleId: session?.scheduleId,
      }),
    [individualSchedules.schedules, session, sessionId],
  )
  const payableItems = useMemo(() => {
    if (session?.payableItems && session.payableItems.length > 0) {
      return normalizePayableItems(session.payableItems)
    }
    return normalizePayableItems(matchedIndividual?.payableItems)
  }, [matchedIndividual?.payableItems, session?.payableItems])
  const evidencePolicyUnconfigured = isEvidencePolicyUnconfigured(
    matchedIndividual?.ineligibleReason,
    payableItems,
  )
  const submittedItems = session?.submittedItems ?? matchedIndividual?.submittedItems ?? []
  const receiptSubmitBlocked =
    isReceipt &&
    (payableItems.length === 0 ||
      evidencePolicyUnconfigured ||
      session?.eligible === false ||
      matchedIndividual?.eligible === false)
  const transportItem = pickTransportPayableItem(payableItems)
  const amountItems = useMemo(() => pickAmountPayableItems(payableItems), [payableItems])

  const initialDraft = (location.state as SettlementWriteDraftLocationState | null)?.draft
  const hydrated = initialDraft ? hydrateSettlementWriteFormState(initialDraft) : null
  const composedBasic = useMemo(
    () =>
      composeSettlementWriteBasic({
        kind: documentKind,
        member: readSettlementMemberProfileBasic(profileQuery.data),
        consent: consentSidecarQuery.sidecar,
      }),
    [consentSidecarQuery.sidecar, documentKind, profileQuery.data],
  )

  const [tripType, setTripType] = useState<TripType>(hydrated?.tripType ?? 'round_trip')
  const transportMaxWon = readPayableMaxLimitWon(transportItem)
  const [departTransit, setDepartTransit] = useState(hydrated?.departTransit ?? '')
  const [departAmount, setDepartAmount] = useState(
    formatSettlementAmountInput(hydrated?.departAmount ?? '', transportMaxWon),
  )
  const [departFiles, setDepartFiles] = useState<string[]>(hydrated?.departFiles ?? [])
  const [departAttachments, setDepartAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.departAttachments ?? []
  )
  const [returnTransit, setReturnTransit] = useState(hydrated?.returnTransit ?? '')
  const [returnAmount, setReturnAmount] = useState(
    formatSettlementAmountInput(hydrated?.returnAmount ?? '', transportMaxWon),
  )
  const [returnFiles, setReturnFiles] = useState<string[]>(hydrated?.returnFiles ?? [])
  const [returnAttachments, setReturnAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.returnAttachments ?? []
  )
  const [extraItems, setExtraItems] = useState<SettlementAmountItemDraft[]>(() => {
    if (hydrated?.extraItems?.length) {
      return amountItems.map(item => {
        const existing = hydrated.extraItems.find(row => row.itemType === item.itemType)
        const base = existing ?? createEmptyAmountItemDraft(item)
        return {
          ...base,
          itemName: item.itemName,
          evidenceRequired: isReceiptEvidenceRequired(item.evidenceRequired),
          amount: formatSettlementAmountInput(base.amount, item.maxLimitWon),
        }
      })
    }
    return amountItems.map(createEmptyAmountItemDraft)
  })
  const [mealAmount, setMealAmount] = useState(
    formatSettlementAmountInput(hydrated?.mealAmount ?? '', INSTRUCTOR_MEAL_MAX_WON),
  )
  const [mealFiles, setMealFiles] = useState<string[]>(hydrated?.mealFiles ?? [])
  const [activityAmount, setActivityAmount] = useState(hydrated?.activityAmount ?? '')
  const [activityFiles, setActivityFiles] = useState<string[]>(hydrated?.activityFiles ?? [])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState(SETTLEMENT_WRITE_ALERT_TITLE)
  const [alertMessage, setAlertMessage] = useState('')
  const prefilledFromDetail = useRef(Boolean(hydrated))

  const name = composedBasic.name
  const nameEn = composedBasic.nameEn
  const residentFront = composedBasic.residentFront
  const residentBack = composedBasic.residentBack
  const homeAddress = composedBasic.homeAddress
  const homeAddressDetail = composedBasic.homeAddressDetail
  const bank = composedBasic.bank
  const accountNumber = composedBasic.accountNumber
  const accountHolder = composedBasic.accountHolder

  const amountItemTypeKey = amountItems.map(item => item.itemType).join('|')
  useEffect(() => {
    if (prefilledFromDetail.current) return
    if (existingDetail.detail) {
      const mapped = mapIndividualSettlementDetailToDraft({
        detail: existingDetail.detail,
        applicationId,
        name,
        homeAddress,
        homeAddressDetail,
      })
      if (mapped) {
        prefilledFromDetail.current = true
        setTripType(mapped.transport.tripType)
        setDepartTransit(mapped.transport.depart.transit)
        setDepartAmount(formatSettlementAmountInput(mapped.transport.depart.amount, transportMaxWon))
        setDepartAttachments(mapped.transport.depart.attachments)
        setReturnTransit(mapped.transport.return.transit)
        setReturnAmount(formatSettlementAmountInput(mapped.transport.return.amount, transportMaxWon))
        setReturnAttachments(mapped.transport.return.attachments)
        setExtraItems(
          amountItems.map(item => {
            const existing = mapped.extraItems.find(row => row.itemType === item.itemType)
            const base = existing ?? createEmptyAmountItemDraft(item)
            return {
              ...base,
              itemName: item.itemName,
              evidenceRequired: isReceiptEvidenceRequired(item.evidenceRequired),
              amount: formatSettlementAmountInput(base.amount, item.maxLimitWon),
            }
          })
        )
        return
      }
    }
    if (!amountItemTypeKey) return
    setExtraItems(pickAmountPayableItems(payableItems).map(createEmptyAmountItemDraft))
  }, [
    amountItemTypeKey,
    amountItems,
    applicationId,
    existingDetail.detail,
    homeAddress,
    homeAddressDetail,
    name,
    payableItems,
    transportMaxWon,
  ])

  const transportTotal = useMemo(() => {
    const depart = parseSettlementAmount(departAmount)
    const back = tripType === 'round_trip' ? parseSettlementAmount(returnAmount) : 0
    return depart + back
  }, [departAmount, returnAmount, tripType])

  const showAlert = (message: string, title = SETTLEMENT_WRITE_ALERT_TITLE) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertOpen(true)
  }

  const extraItemsForUi = overlayPayableEvidenceRequired(extraItems, payableItems)
  const orderedExtras = sortReceiptPayableItems(extraItemsForUi)
  const wageExtras = orderedExtras.filter(item => isReceiptWageItemType(item.itemType, item.itemName))
  const restExtras = orderedExtras.filter(item => !isReceiptWageItemType(item.itemType, item.itemName))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (consentSidecarQuery.isLoading || profileQuery.isPending) {
      showAlert(
        isReceipt
          ? '영수증 발급 사전 동의서 정보를 불러오는 중입니다.'
          : '지급조서 사전 동의서 정보를 불러오는 중입니다.',
      )
      return
    }
    if (isReceipt && payableItems.length === 0) {
      showAlert(
        individualIneligibleMessage('NO_PAYABLE_ITEMS') ??
          '이 프로그램에 신청할 수 있는 지급 항목이 없습니다.',
      )
      return
    }
    if (isReceipt && evidencePolicyUnconfigured) {
      showAlert(
        individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED') ??
          '증빙 정책을 확인할 수 없어 신청할 수 없습니다',
      )
      return
    }
    if (isReceipt && (session?.eligible === false || matchedIndividual?.eligible === false)) {
      showAlert(
        session?.submitBlockedReason ??
          individualIneligibleMessage(matchedIndividual?.ineligibleReason) ??
          '지금은 영수증을 제출할 수 없습니다.',
      )
      return
    }

    const draft = buildSettlementWriteDraft({
      applicationId,
      sessionId,
      scheduleId: session?.scheduleId ?? matchedIndividual?.scheduleId,
      assignmentId: session?.assignmentId ?? undefined,
      isInstructor,
      documentKind,
      programTitle,
      settlementApplicationId:
        session?.settlementApplicationId ??
        matchedIndividual?.settlementApplicationId ??
        undefined,
      currentRevisionNo:
        session?.currentRevisionNo ?? matchedIndividual?.currentRevisionNo ?? undefined,
      resubmit:
        session?.canResubmitReceipt === true ||
        matchedIndividual?.canResubmit === true ||
        session?.status === 'rejected',
      idempotencyKey: hydrated?.idempotencyKey,
      expenseDate: toSeoulIsoDate(session?.heldAt),
      enabledItemTypes: payableItems.map(item => item.itemType),
      name,
      nameEn,
      residentFront,
      residentBack,
      homeAddress,
      homeAddressDetail,
      bank,
      accountNumber,
      accountHolder,
      transportItemType: transportItem?.itemType ?? (!isReceipt ? 'TRANSPORTATION' : undefined),
      transportItemName: transportItem?.itemName,
      transportEvidenceRequired: isReceiptEvidenceRequired(transportItem?.evidenceRequired),
      tripType,
      departTransit,
      departAmount: formatSettlementAmountInput(departAmount, transportMaxWon),
      departFiles,
      departAttachments,
      returnTransit,
      returnAmount: formatSettlementAmountInput(returnAmount, transportMaxWon),
      returnFiles,
      returnAttachments,
      extraItems: isReceipt
        ? extraItemsForUi.map(item => ({
            ...item,
            amount: formatSettlementAmountInput(
              item.amount,
              readPayableMaxLimitWon(
                payableItems.find(payable => payable.itemType === item.itemType),
              ),
            ),
          }))
        : [],
      mealAmount: formatSettlementAmountInput(mealAmount, INSTRUCTOR_MEAL_MAX_WON),
      mealFiles,
      activityAmount,
      activityFiles,
    })

    const validationError = validateSettlementWriteDraft(draft)
    if (validationError) {
      const alert = resolveSettlementWriteValidationAlert(validationError, documentKind)
      showAlert(alert.description, alert.title)
      return
    }

    saveSettlementWriteDraft(draft)
    navigate(
      buildSettlementConfirmPath({
        applicationId,
        sessionId,
        area: resolveSettlementAreaFromPathname(location.pathname),
        applicationType: applicationType ?? undefined,
      }),
      { state: { draft } },
    )
  }

  let sectionNo = 1
  const basicSectionNo = sectionNo++
  const showTransportSection = Boolean((!isReceipt || transportItem) && (transportItem || !isReceipt))
  const wageSectionNos = wageExtras.map(() => sectionNo++)
  const transportSectionNo = showTransportSection ? sectionNo++ : null
  const restSectionNos = restExtras.map(() => sectionNo++)

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <EducationSettlementSessionBanner
          programTitle={programTitle}
          session={session}
          institutionTitle={!isReceipt}
        />
        {isReceipt && evidencePolicyUnconfigured ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED')}
          </PFText>
        ) : null}
        {isReceipt && submittedItems.length > 0 ? (
          <PFFormSection id="settlement-submitted" title="제출된 항목">
            {sortReceiptPayableItems(submittedItems).map((item, index) => (
              <PFText key={`${item.itemType ?? 'item'}-${index}`} as="p" typo="bd-md-rg" color="black">
                {receiptPaymentItemLabel(
                  payableItems.find(payable => payable.itemType === item.itemType) ?? {
                    itemType: item.itemType,
                  },
                )}
                {item.amount != null ? ` ${item.amount.toLocaleString('ko-KR')}원` : ''}
              </PFText>
            ))}
          </PFFormSection>
        ) : null}

        <PFFormSection
          id="settlement-basic"
          title={`${basicSectionNo}. 기본 정보`}
          required
          description={
            consentSidecarQuery.isLoading
              ? isReceipt
                ? '영수증 발급 사전 동의서 정보를 불러오는 중입니다.'
                : '지급조서 사전 동의서 정보를 불러오는 중입니다.'
              : undefined
          }
        >
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="성명">
                <PFTextInput variant="formPage" size="large" disabled value={name} />
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="single">
              <PFFormField label="영문명">
                <PFTextInput variant="formPage" size="large" disabled value={nameEn} />
              </PFFormField>
            </PFFormFieldRow>
            {isReceipt ? null : (
              <PFFormFieldRow type="single">
                <PFFormField label="주민등록번호">
                  <PFFormResidentNumberInput
                    disabled
                    fillRow
                    frontValue={residentFront}
                    backValue={residentBack}
                    onFrontChange={() => undefined}
                    onBackChange={() => undefined}
                  />
                </PFFormField>
              </PFFormFieldRow>
            )}
            <PFFormFieldRow type="single">
              <PFFormField label="자택 주소">
                <PFFormHomeAddressFields
                  disabled
                  fillRow
                  roadValue={homeAddress}
                  detailValue={homeAddressDetail}
                  onRoadChange={() => undefined}
                  onDetailChange={() => undefined}
                />
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="single">
              <PFFormField label="정산 계좌 정보">
                <PFFormInlineRow>
                  <PFFormInlineSegment>
                    <PFFormControlCluster>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={200}
                        placeholder="은행명"
                        disabled
                        value={bank}
                        onValueChange={() => undefined}
                      />
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={200}
                        inputMode="numeric"
                        placeholder="계좌번호를 입력해 주세요."
                        disabled
                        value={accountNumber}
                        onValueChange={() => undefined}
                      />
                    </PFFormControlCluster>
                  </PFFormInlineSegment>
                  <PFFormInlineSeparator />
                  <PFFormInlineSegment>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={200}
                      placeholder="예금주명"
                      disabled
                      value={accountHolder}
                      onValueChange={() => undefined}
                    />
                  </PFFormInlineSegment>
                </PFFormInlineRow>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        {isReceipt
          ? wageExtras.map((item, index) => (
              <AmountReceiptSection
                key={item.itemType}
                id={`settlement-item-${item.itemType}`}
                title={`${wageSectionNos[index]}. ${item.itemName} 신청`}
                required={isReceiptEvidenceRequired(item.evidenceRequired)}
                description="사전에 담당자와 협의되지 않은 비용은 지급이 반려될 수 있습니다. 반드시 사전 협의 후 신청해 주세요."
                amountLabel={item.itemName}
                item={item}
                maxWon={readPayableMaxLimitWon(
                  payableItems.find(payable => payable.itemType === item.itemType),
                )}
                onChange={next => {
                  setExtraItems(current =>
                    current.map(row => (row.itemType === next.itemType ? next : row))
                  )
                }}
                onError={showAlert}
              />
            ))
          : null}

        {showTransportSection && transportSectionNo != null ? (
          <PFFormSection
            id="settlement-transport"
            title={`${transportSectionNo}. 교통비 신청`}
            required={!isReceipt && isInstructor}
            description={
              isReceipt
                ? '가는 편과 오는 편을 구분해 실제 사용한 교통비를 신청해 주세요.'
                : '강의 과정에서 발생한 교통비에 한해 신청해 주세요.'
            }
          >
            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="신청 구분">
                  <RadioGroup
                    name="trip-type"
                    value={tripType}
                    onChange={setTripType}
                    options={SETTLEMENT_TRIP_TYPE_OPTIONS}
                  />
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>

            <TripLegBlock
              prefix="가는 편"
              heading={tripType === 'round_trip' ? '가는 편(출발)' : undefined}
              transit={departTransit}
              amount={departAmount}
              fileNames={departFiles}
              attachments={departAttachments}
              uploadEnabled={isReceipt && isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
              showReceiptUpload={!isReceipt || isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
              amountMaxWon={transportMaxWon}
              onTransitChange={setDepartTransit}
              onAmountChange={setDepartAmount}
              onFileNamesChange={setDepartFiles}
              onAttachmentsChange={setDepartAttachments}
              onError={showAlert}
            />

            {tripType === 'round_trip' ? (
              <TripLegBlock
                prefix="오는 편"
                heading="오는 편(귀가)"
                transit={returnTransit}
                amount={returnAmount}
                fileNames={returnFiles}
                attachments={returnAttachments}
                uploadEnabled={isReceipt && isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
              showReceiptUpload={!isReceipt || isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
              amountMaxWon={transportMaxWon}
              onTransitChange={setReturnTransit}
              onAmountChange={setReturnAmount}
                onFileNamesChange={setReturnFiles}
                onAttachmentsChange={setReturnAttachments}
                onError={showAlert}
              />
            ) : null}

            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="총 산정 교통비">
                  <AmountWithWon
                    placeholder=" "
                    disabled
                    value={transportTotal > 0 ? transportTotal.toLocaleString('ko-KR') : ''}
                    onChange={() => undefined}
                    ariaLabel="총 산정 교통비"
                  />
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          </PFFormSection>
        ) : null}

        {isReceipt
          ? restExtras.map((item, index) => (
              <AmountReceiptSection
                key={item.itemType}
                id={`settlement-item-${item.itemType}`}
                title={`${restSectionNos[index]}. ${item.itemName} 신청`}
                required={isReceiptEvidenceRequired(item.evidenceRequired)}
                description="사전에 담당자와 협의되지 않은 비용은 지급이 반려될 수 있습니다. 반드시 사전 협의 후 신청해 주세요."
                footer={
                  item.itemType === 'ACTIVITY' && isReceiptEvidenceRequired(item.evidenceRequired)
                    ? '사용한 금액의 영수증을 제출해 주세요.'
                    : undefined
                }
                amountLabel={item.itemName}
                item={item}
                maxWon={readPayableMaxLimitWon(
                  payableItems.find(payable => payable.itemType === item.itemType),
                )}
                onChange={next => {
                  setExtraItems(current =>
                    current.map(row => (row.itemType === next.itemType ? next : row))
                  )
                }}
                onError={showAlert}
              />
            ))
          : null}

        {!isReceipt ? (
          <>
            <PFFormSection
              id="settlement-meal"
              title="3. 식사비 신청"
              description="사전에 담당자와 협의되지 않은 비용은 지급이 반려될 수 있습니다. 반드시 사전 협의 후 신청해 주세요."
              footer="1인 기준, 시간 당 최대 3만원까지 지급됩니다."
            >
              <PFFormFieldTable>
                <PFFormFieldRow type="single">
                  <PFFormField label="식사비">
                    <AmountWithWon
                      value={mealAmount}
                      onChange={setMealAmount}
                      ariaLabel="식사비"
                      maxWon={INSTRUCTOR_MEAL_MAX_WON}
                    />
                  </PFFormField>
                </PFFormFieldRow>
                <PFFormFieldRow type="single">
                  <PFFormField label="영수증 제출">
                    <ReceiptUpload
                      fileNames={mealFiles}
                      onFileNamesChange={setMealFiles}
                      uploadEnabled={false}
                      ariaLabel="식사비 영수증 제출"
                      onError={showAlert}
                    />
                  </PFFormField>
                </PFFormFieldRow>
              </PFFormFieldTable>
            </PFFormSection>

            <PFFormSection
              id="settlement-activity"
              title="4. 활동비 신청"
              description="사전에 담당자와 협의되지 않은 비용은 지급이 반려될 수 있습니다. 반드시 사전 협의 후 신청해 주세요."
              footer="사용한 금액의 영수증을 제출해 주세요."
            >
              <PFFormFieldTable>
                <PFFormFieldRow type="single">
                  <PFFormField label="활동비">
                    <AmountWithWon
                      value={activityAmount}
                      onChange={setActivityAmount}
                      ariaLabel="활동비"
                    />
                  </PFFormField>
                </PFFormFieldRow>
                <PFFormFieldRow type="single">
                  <PFFormField label="영수증 제출">
                    <ReceiptUpload
                      fileNames={activityFiles}
                      onFileNamesChange={setActivityFiles}
                      uploadEnabled={false}
                      ariaLabel="활동비 영수증 제출"
                      onError={showAlert}
                    />
                  </PFFormField>
                </PFFormFieldRow>
              </PFFormFieldTable>
            </PFFormSection>
          </>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            type="submit"
            size="xlarge"
            width={240}
            disabled={receiptSubmitBlocked}
          >
            신청하기
          </PFButton>
        </div>
      </form>
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
