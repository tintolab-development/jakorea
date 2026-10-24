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
  formatSettlementAmountInput,
  parseSettlementAmount,
} from '../lib/format-write-draft'
import { findIndividualScheduleForSession } from '../lib/assigned-settlement-items'
import {
  individualIneligibleMessage,
  isEvidencePolicyUnconfigured,
  isIndividualScheduleSettlementAudience,
} from '../lib/individual-settlement-contract'
import {
  normalizePayableItems,
  pickAmountPayableItems,
  pickTransportPayableItem,
  receiptPaymentItemLabel,
  type ReceiptPayableItem,
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
  resolveSettlementWriteValidationMessage,
  validateSettlementWriteDraft,
} from '../lib/validate-write-draft'
import { saveSettlementWriteDraft } from '../lib/write-draft-storage'
import {
  buildSettlementConfirmPath,
  resolveSettlementAreaFromPathname,
} from '../lib/write-path'
import { EducationSettlementSessionBanner } from './settlement-session-banner'
import { mapIndividualSettlementDetailToDraft } from '../lib/map-individual-settlement-detail'
import { useInstructorApplyLockedBasic } from '@/features/mypage/instructor-apply'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import {
  useIndividualSettlementDetailQuery,
  useIndividualSettlementSchedulesQuery,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { isInstructorMypageProfile } from '@/features/mypage/lib/member-profile'
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

const INSTRUCTOR_RECEIPT_HINTS = [
  '파일은 최대 15M까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

type TripType = 'one_way' | 'round_trip'

type EducationSettlementWriteFormProps = {
  applicationId: string
  sessionId: string
  programTitle?: string
  session?: EducationSettlementItem
  documentKind?: SettlementDocumentKind
  applicationType?: string | null
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
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
}: {
  width?: number
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
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
        onValueChange={next => onChange(formatSettlementAmountInput(next))}
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
  const hints = uploadEnabled ? RECEIPT_UPLOAD_HINTS : INSTRUCTOR_RECEIPT_HINTS

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
              width={160}
              variant="formPage"
              size="large"
              placeholder="선택"
              aria-label={`${prefix} 대중교통 수단`}
              options={SETTLEMENT_TRANSIT_OPTIONS}
              value={transit || undefined}
              onValueChange={onTransitChange}
            />
          </PFFormField>
          <PFFormField label="지출 금액">
            <AmountWithWon
              value={amount}
              onChange={onAmountChange}
              ariaLabel={`${prefix} 지출 금액`}
            />
          </PFFormField>
        </PFFormFieldRow>
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
  onChange: (next: SettlementAmountItemDraft) => void
  onError: (message: string) => void
}) {
  return (
    <PFFormSection id={id} title={title} required={required} description={description} footer={footer}>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label={amountLabel}>
            <AmountWithWon
              value={item.amount}
              onChange={amount => onChange({ ...item, amount })}
              ariaLabel={amountLabel}
            />
          </PFFormField>
        </PFFormFieldRow>
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
      </PFFormFieldTable>
    </PFFormSection>
  )
}

function resolvePayableItems(session: EducationSettlementItem | undefined): ReceiptPayableItem[] {
  return (session?.payableItems ?? []).map(item => ({
    itemType: item.itemType,
    itemName: item.itemName,
    evidenceRequired: item.evidenceRequired,
  }))
}

export function EducationSettlementWriteForm({
  applicationId,
  sessionId,
  programTitle,
  session,
  documentKind = 'payment_statement',
  applicationType,
}: EducationSettlementWriteFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const { profile } = useMypageMember()
  const profileQuery = usePortalProfileQuery({ enabled: true })
  const existingDetail = useIndividualSettlementDetailQuery(
    documentKind === 'receipt' ? session?.settlementApplicationId : null,
  )
  const isInstructor = isInstructorMypageProfile(profile)
  const isReceipt = documentKind === 'receipt'
  const individualSchedules = useIndividualSettlementSchedulesQuery(
    isReceipt && isIndividualScheduleSettlementAudience(applicationType) ? applicationId : null,
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
    const fromSession = resolvePayableItems(session)
    if (fromSession.length > 0) return fromSession
    return normalizePayableItems(matchedIndividual?.payableItems)
  }, [matchedIndividual?.payableItems, session])
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
  const settlement = profileQuery.data?.instructorProfile?.settlement

  const [bank, setBank] = useState(hydrated?.bank ?? settlement?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(
    hydrated?.accountNumber || settlement?.accountNumber || ''
  )
  const [accountHolder, setAccountHolder] = useState(
    hydrated?.accountHolder || settlement?.accountHolder || lockedBasic.name
  )
  const [tripType, setTripType] = useState<TripType>(hydrated?.tripType ?? 'round_trip')
  const [departTransit, setDepartTransit] = useState(hydrated?.departTransit ?? '')
  const [departAmount, setDepartAmount] = useState(hydrated?.departAmount ?? '')
  const [departFiles, setDepartFiles] = useState<string[]>(hydrated?.departFiles ?? [])
  const [departAttachments, setDepartAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.departAttachments ?? []
  )
  const [returnTransit, setReturnTransit] = useState(hydrated?.returnTransit ?? '')
  const [returnAmount, setReturnAmount] = useState(hydrated?.returnAmount ?? '')
  const [returnFiles, setReturnFiles] = useState<string[]>(hydrated?.returnFiles ?? [])
  const [returnAttachments, setReturnAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.returnAttachments ?? []
  )
  const [extraItems, setExtraItems] = useState<SettlementAmountItemDraft[]>(() => {
    if (hydrated?.extraItems?.length) {
      return amountItems.map(
        item =>
          hydrated.extraItems.find(existing => existing.itemType === item.itemType) ??
          createEmptyAmountItemDraft(item)
      )
    }
    return amountItems.map(createEmptyAmountItemDraft)
  })
  const [mealAmount, setMealAmount] = useState(hydrated?.mealAmount ?? '')
  const [mealFiles, setMealFiles] = useState<string[]>(hydrated?.mealFiles ?? [])
  const [activityAmount, setActivityAmount] = useState(hydrated?.activityAmount ?? '')
  const [activityFiles, setActivityFiles] = useState<string[]>(hydrated?.activityFiles ?? [])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const prefilledFromDetail = useRef(Boolean(hydrated))

  const name = lockedBasic.name
  const residentFront = ''
  const residentBack = ''

  useEffect(() => {
    setAccountHolder(prev => (prev === '' && name ? name : prev))
  }, [name])

  useEffect(() => {
    if (hydrated?.bank || !settlement?.bankName) return
    setBank(prev => prev || settlement.bankName || '')
    setAccountNumber(prev => prev || settlement.accountNumber || '')
    setAccountHolder(prev => prev || settlement.accountHolder || name)
  }, [hydrated?.bank, name, settlement])

  const amountItemTypeKey = amountItems.map(item => item.itemType).join('|')
  useEffect(() => {
    if (prefilledFromDetail.current) return
    if (existingDetail.detail) {
      const mapped = mapIndividualSettlementDetailToDraft({
        detail: existingDetail.detail,
        applicationId,
        name,
        homeAddress: lockedBasic.homeAddress,
        homeAddressDetail: lockedBasic.homeAddressDetail,
      })
      if (mapped) {
        prefilledFromDetail.current = true
        setTripType(mapped.transport.tripType)
        setDepartTransit(mapped.transport.depart.transit)
        setDepartAmount(mapped.transport.depart.amount)
        setDepartAttachments(mapped.transport.depart.attachments)
        setReturnTransit(mapped.transport.return.transit)
        setReturnAmount(mapped.transport.return.amount)
        setReturnAttachments(mapped.transport.return.attachments)
        setExtraItems(
          amountItems.map(
            item =>
              mapped.extraItems.find(existing => existing.itemType === item.itemType) ??
              createEmptyAmountItemDraft(item)
          )
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
    lockedBasic.homeAddress,
    lockedBasic.homeAddressDetail,
    name,
    payableItems,
  ])

  const transportTotal = useMemo(() => {
    const depart = parseSettlementAmount(departAmount)
    const back = tripType === 'round_trip' ? parseSettlementAmount(returnAmount) : 0
    return depart + back
  }, [departAmount, returnAmount, tripType])

  const showAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
          '증빙 정책이 설정되지 않아 제출할 수 없습니다. 관리자에게 문의해 주세요.',
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
      residentFront,
      residentBack,
      homeAddress: lockedBasic.homeAddress,
      homeAddressDetail: lockedBasic.homeAddressDetail,
      bank,
      accountNumber,
      accountHolder,
      transportItemType: transportItem?.itemType,
      transportItemName: transportItem?.itemName,
      transportEvidenceRequired: transportItem?.evidenceRequired === true,
      tripType,
      departTransit,
      departAmount,
      departFiles,
      departAttachments,
      returnTransit,
      returnAmount,
      returnFiles,
      returnAttachments,
      extraItems: isReceipt ? extraItems : [],
      mealAmount,
      mealFiles,
      activityAmount,
      activityFiles,
    })

    const validationError = validateSettlementWriteDraft(draft)
    if (validationError) {
      showAlert(resolveSettlementWriteValidationMessage(validationError, documentKind))
      return
    }

    saveSettlementWriteDraft(draft)
    navigate(
      buildSettlementConfirmPath({
        applicationId,
        sessionId,
        area: resolveSettlementAreaFromPathname(location.pathname),
      }),
      { state: { draft } },
    )
  }

  let sectionNo = 1
  const basicSectionNo = sectionNo++
  const transportSectionNo = transportItem || !isReceipt ? sectionNo++ : null

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <EducationSettlementSessionBanner programTitle={programTitle} session={session} />
        {isReceipt && evidencePolicyUnconfigured ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED')}
          </PFText>
        ) : null}
        {isReceipt && submittedItems.length > 0 ? (
          <PFFormSection id="settlement-submitted" title="제출된 항목">
            {submittedItems.map((item, index) => (
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
          description={isReceipt ? undefined : '설명이 노출됩니다.'}
        >
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="성명">
                <PFTextInput variant="formPage" size="large" disabled value={name} />
              </PFFormField>
            </PFFormFieldRow>
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
            <PFFormFieldRow type="single">
              <PFFormField label="자택 주소">
                <PFFormHomeAddressFields
                  disabled
                  fillRow
                  roadValue={lockedBasic.homeAddress}
                  detailValue={lockedBasic.homeAddressDetail}
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
                        value={bank}
                        onValueChange={setBank}
                      />
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={200}
                        inputMode="numeric"
                        placeholder="계좌번호를 입력해 주세요."
                        value={accountNumber}
                        onValueChange={value => setAccountNumber(digitsOnly(value))}
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
                      value={accountHolder}
                      onValueChange={setAccountHolder}
                    />
                  </PFFormInlineSegment>
                </PFFormInlineRow>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        {(!isReceipt || transportItem) && transportSectionNo != null ? (
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
              uploadEnabled={isReceipt}
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
                uploadEnabled={isReceipt}
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
          ? extraItems.map((item, index) => (
              <AmountReceiptSection
                key={item.itemType}
                id={`settlement-item-${item.itemType}`}
                title={`${transportSectionNo != null ? transportSectionNo + 1 + index : basicSectionNo + 1 + index}. ${item.itemName} 신청`}
                required={item.evidenceRequired === true}
                description="사전에 담당자와 협의되지 않은 비용은 지급이 반려될 수 있습니다. 반드시 사전 협의 후 신청해 주세요."
                footer={
                  item.itemType === 'ACTIVITY' ? '사용한 금액의 영수증을 제출해 주세요.' : undefined
                }
                amountLabel={item.itemName}
                item={item}
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
                    <AmountWithWon value={mealAmount} onChange={setMealAmount} ariaLabel="식사비" />
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
        title="안내"
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
