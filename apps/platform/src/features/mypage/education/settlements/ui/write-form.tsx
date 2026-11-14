import { PFCheckbox } from '@/shared/ui'
import {
  formatCompanySchoolLodgingFixedAmountNotice,
  isCompanySchoolSettlementProgram,
} from '../lib/company-school-lodging'
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
import { isInstructorTransportSectionVisible } from '../lib/instructor-transport-preview'
import {
  isLectureFeeSettlementBlocked,
  lectureFeeSettlementBlockerMessage,
} from '../lib/lecture-fee-preview'
import { InstructorTransportFeeBlock } from './instructor-transport-fee-block'
import {
  individualIneligibleMessage,
  individualTransportIneligibleNotice,
  isEvidencePolicyUnconfigured,
  resolveScheduleSettlementAudience,
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
import { paymentItemLimitError } from '../lib/payment-item-limit'
import { instructorTransportExclusionNotice } from '../lib/instructor-transport-exclusion'
import { DEFAULT_INSTRUCTOR_EXPENSE_POLICIES } from '../lib/instructor-expense-items'
import {
  INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE,
  SETTLEMENT_BUSINESS_PERIOD_CLOSED_CODE,
} from '../lib/instructor-settlement-contract'
import { useInstructorSettlementPreviewQuery } from '../api/use-instructor-settlement-preview-query'
import {
  RECEIPT_UPLOAD_ACCEPT,
  RECEIPT_UPLOAD_HINTS,
  RECEIPT_UPLOAD_POLICY,
} from '../lib/receipt-upload-policy'
import {
  RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE,
  resolveReceiptUploadServerErrorMessage,
} from '../lib/receipt-upload-errors'
import { toSeoulIsoDate } from '../lib/seoul-deadline'
import {
  SETTLEMENT_TRANSIT_OPTIONS,
  SETTLEMENT_TRIP_TYPE_OPTIONS,
} from '../lib/settlement-options'
import {
  PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE,
  type SettlementDocumentKind,
} from '../lib/settlement-status-ui'
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
import { sumUploadFileBytes, validateUploadBatch } from '@/shared/lib/file-upload-policy'
import {
  MemberFileTooLargeError,
  MemberFileTypeNotAllowedError,
  uploadMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  PFAlertModal,
  PFButton,
  PFEmptyState,
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
  error = false,
  errorMessage,
}: {
  width?: number
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
  /** 입력값을 이 금액으로 자른다(강사 식사비 등). 영수증 항목 한도는 자르지 않고 errorMessage로 알린다. */
  maxWon?: number | null
  error?: boolean
  errorMessage?: string | null
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
        aria-invalid={error || Boolean(errorMessage) || undefined}
        error={error || Boolean(errorMessage)}
        message={errorMessage ?? undefined}
        messageStatus={errorMessage ? 'error' : 'neutral'}
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
              // 총 100MB는 항목 단위 — 같은 항목에 이미 올린 첨부의 크기를 합산한다(크기를 모르는 기존 첨부는 0)
              currentTotalBytes: sumUploadFileBytes(
                (uploadEnabled ? (attachments ?? []) : []).map(item => ({ size: item.fileSize ?? 0 }))
              ),
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
                  uploaded.push({ fileObjectId, fileName: file.name, fileSize: file.size })
                }
                onAttachmentsChange?.(uploaded)
              } catch (error) {
                if (error instanceof MemberFileTooLargeError) {
                  onError(error.message)
                } else if (error instanceof MemberFileTypeNotAllowedError) {
                  onError(RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE)
                } else {
                  onError(
                    resolveReceiptUploadServerErrorMessage(error) ??
                      '영수증 업로드에 실패했습니다. 다시 시도해 주세요.'
                  )
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
  amountError = false,
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
  /** 교통비 합계가 한도를 넘으면 가는 편·오는 편 입력란을 오류 상태로 표시 */
  amountError?: boolean
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
              error={amountError}
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
              errorMessage={paymentItemLimitError(parseSettlementAmount(item.amount), maxWon)}
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
  /** 1사1교 강사 지급조서에서만 숙박비(LODGING_1C1S) 신청 */
  const showCompanySchoolLodging = !isReceipt && isCompanySchoolSettlementProgram(programType)
  const consentSidecarQuery = useSettlementConsentSidecar(documentKind)
  const scheduleSettlementAudience = resolveScheduleSettlementAudience(applicationType, programType)
  const individualSchedules = useIndividualSettlementSchedulesQuery(
    scheduleSettlementAudience ? applicationId : null,
    true,
    scheduleSettlementAudience ?? 'individual',
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
  const lectureFeeBlocked = !isReceipt && isLectureFeeSettlementBlocked(session?.lectureFeePreview)
  const lectureFeeBlockerMessage = lectureFeeSettlementBlockerMessage(session?.lectureFeePreview)
  const receiptSubmitBlocked =
    isReceipt &&
    (payableItems.length === 0 ||
      evidencePolicyUnconfigured ||
      session?.eligible === false ||
      matchedIndividual?.eligible === false)
  const transportItem = pickTransportPayableItem(payableItems)
  /** 교통비 신청란이 없을 때만 — 서버 transportPreview 사유 안내(거리 계산 없음) */
  const transportIneligibleNotice =
    isReceipt && !transportItem
      ? individualTransportIneligibleNotice(
          session?.transportPreview ?? matchedIndividual?.transportPreview,
        )
      : null
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
  const [departTransit, setDepartTransit] = useState(hydrated?.departTransit ?? '')
  const [departAmount, setDepartAmount] = useState(
    formatSettlementAmountInput(hydrated?.departAmount ?? ''),
  )
  const [departFiles, setDepartFiles] = useState<string[]>(hydrated?.departFiles ?? [])
  const [departAttachments, setDepartAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.departAttachments ?? []
  )
  const [returnTransit, setReturnTransit] = useState(hydrated?.returnTransit ?? '')
  const [returnAmount, setReturnAmount] = useState(
    formatSettlementAmountInput(hydrated?.returnAmount ?? ''),
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
          maxLimitWon: item.maxLimitWon,
          amount: formatSettlementAmountInput(base.amount),
        }
      })
    }
    return amountItems.map(createEmptyAmountItemDraft)
  })
  const [mealAmount, setMealAmount] = useState(
    formatSettlementAmountInput(hydrated?.mealAmount ?? ''),
  )
  const [mealFiles, setMealFiles] = useState<string[]>(hydrated?.mealFiles ?? [])
  const [mealAttachments, setMealAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.mealAttachments ?? []
  )
  const [activityAmount, setActivityAmount] = useState(hydrated?.activityAmount ?? '')
  const [activityFiles, setActivityFiles] = useState<string[]>(hydrated?.activityFiles ?? [])
  const [activityAttachments, setActivityAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.activityAttachments ?? []
  )
  const [lodgingRequested, setLodgingRequested] = useState(
    hydrated?.companySchoolLodgingRequested ?? false
  )
  const [lodgingFiles, setLodgingFiles] = useState<string[]>(
    hydrated?.companySchoolLodgingFiles ?? []
  )
  const [lodgingAttachments, setLodgingAttachments] = useState<SettlementReceiptAttachment[]>(
    hydrated?.companySchoolLodgingAttachments ?? []
  )
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
        setDepartAmount(formatSettlementAmountInput(mapped.transport.depart.amount))
        setDepartAttachments(mapped.transport.depart.attachments)
        setReturnTransit(mapped.transport.return.transit)
        setReturnAmount(formatSettlementAmountInput(mapped.transport.return.amount))
        setReturnAttachments(mapped.transport.return.attachments)
        setExtraItems(
          amountItems.map(item => {
            const existing = mapped.extraItems.find(row => row.itemType === item.itemType)
            const base = existing ?? createEmptyAmountItemDraft(item)
            return {
              ...base,
              itemName: item.itemName,
              evidenceRequired: isReceiptEvidenceRequired(item.evidenceRequired),
              maxLimitWon: item.maxLimitWon,
              amount: formatSettlementAmountInput(base.amount),
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
  /** 영수증 금액 항목 한도 초과(서버 PAYMENT_ITEM_LIMIT_EXCEEDED와 같은 기준) — 입력란 오류 + 제출 차단. 교통비는 한도 없음 */
  const firstExtraLimitError = isReceipt
    ? (extraItemsForUi
        .map(item =>
          paymentItemLimitError(
            parseSettlementAmount(item.amount),
            readPayableMaxLimitWon(payableItems.find(payable => payable.itemType === item.itemType)),
          ),
        )
        .find((message): message is string => Boolean(message)) ?? null)
    : null
  const receiptLimitError = firstExtraLimitError
  const orderedExtras = sortReceiptPayableItems(extraItemsForUi)
  const wageExtras = orderedExtras.filter(item => isReceiptWageItemType(item.itemType, item.itemName))
  const restExtras = orderedExtras.filter(item => !isReceiptWageItemType(item.itemType, item.itemName))
  const instructorTransportPreview = session?.instructorTransportPreview ?? null
  const showInstructorTransportSection =
    isInstructorTransportSectionVisible(instructorTransportPreview)
  /** 일반 프로그램: 지도에서 주소·경로를 못 찾으면 교통비 없이 신청 가능 — 미리보기 사유로 안내만 한다 */
  const instructorSettlementPreview = useInstructorSettlementPreviewQuery(
    isReceipt ? null : session?.assignmentId,
  )
  const transportExclusionNotice = isReceipt
    ? null
    : instructorTransportExclusionNotice(instructorSettlementPreview.transportExclusion)
  /**
   * 강사 식사비·활동비 정책(미리보기 payableItems, K14): 한도는 CMS 설정 maxLimitWon(고정 3만원 아님),
   * 영수증 필요 여부는 evidenceRequired, 프로그램에서 끈 항목은 입력 칸을 숨기고 검증·송신에서 뺀다.
   * TODO(K14 시안 대기): 식사비 하단 안내의 '최대 3만원' 문구를 한도에 맞추기
   */
  const expensePolicies = isReceipt
    ? DEFAULT_INSTRUCTOR_EXPENSE_POLICIES
    : instructorSettlementPreview.expensePolicies
  /** 미리보기 payableItems에 없는 실비 항목은 입력 칸을 숨긴다. 받기 전·오류면 기존처럼 보인다 */
  const showInstructorMeal = !isReceipt && (!expensePolicies.loaded || expensePolicies.meal.allowed)
  const showInstructorActivity =
    !isReceipt && (!expensePolicies.loaded || expensePolicies.activity.allowed)

  const settlementApplicationIdForSubmit =
    session?.settlementApplicationId ?? matchedIndividual?.settlementApplicationId ?? undefined
  const resubmitRequested =
    session?.canResubmitReceipt === true ||
    matchedIndividual?.canResubmit === true ||
    session?.status === 'rejected'
  /**
   * 강사 최초 제출만 미리보기 canSubmit=false(지급 항목 0건 등)로 막는다 — blockerMessage 그대로.
   * 반려 후 재제출은 기존 신청서 경로라 미리보기 차단(ACTIVE_APPLICATION_EXISTS)을 적용하지 않는다.
   */
  const previewSubmitBlock =
    !isReceipt && !(resubmitRequested && settlementApplicationIdForSubmit != null)
      ? instructorSettlementPreview.submitBlock
      : null

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
        transportIneligibleNotice ??
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
          individualIneligibleMessage(
            matchedIndividual?.ineligibleReason,
            scheduleSettlementAudience ?? 'individual',
          ) ??
          '지금은 영수증을 제출할 수 없습니다.',
      )
      return
    }
    if (lectureFeeBlocked) {
      showAlert(lectureFeeBlockerMessage ?? INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE)
      return
    }
    // 사업 운영 종료 후 최초 제출 차단(A1) — 서버 409와 같은 문구
    if (instructorSettlementPreview.blockerCode === SETTLEMENT_BUSINESS_PERIOD_CLOSED_CODE) {
      showAlert(PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE)
      return
    }
    if (receiptLimitError) {
      showAlert(receiptLimitError)
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
      settlementApplicationId: settlementApplicationIdForSubmit,
      currentRevisionNo:
        session?.currentRevisionNo ?? matchedIndividual?.currentRevisionNo ?? undefined,
      resubmit: resubmitRequested,
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
      transportItemType:
        transportItem?.itemType ??
        (!isReceipt && showInstructorTransportSection ? 'TRANSPORTATION' : undefined),
      transportItemName: showInstructorTransportSection
        ? (transportItem?.itemName ?? (!isReceipt ? '교통비' : undefined))
        : transportItem?.itemName,
      transportEvidenceRequired: isReceipt
        ? isReceiptEvidenceRequired(transportItem?.evidenceRequired)
        : false,
      transportAutoPreview: isReceipt ? null : (session?.instructorTransportPreview ?? null),
      tripType,
      departTransit,
      departAmount: formatSettlementAmountInput(departAmount),
      departFiles,
      departAttachments,
      returnTransit,
      returnAmount: formatSettlementAmountInput(returnAmount),
      returnFiles,
      returnAttachments,
      extraItems: isReceipt
        ? extraItemsForUi.map(item => ({
            ...item,
            maxLimitWon: readPayableMaxLimitWon(
              payableItems.find(payable => payable.itemType === item.itemType),
            ),
            amount: formatSettlementAmountInput(item.amount),
          }))
        : [],
      mealAmount: formatSettlementAmountInput(mealAmount, expensePolicies.meal.maxLimitWon),
      mealFiles:
        mealAttachments.length > 0 ? mealAttachments.map(file => file.fileName) : mealFiles,
      mealAttachments,
      activityAmount: formatSettlementAmountInput(activityAmount, expensePolicies.activity.maxLimitWon),
      activityFiles:
        activityAttachments.length > 0
          ? activityAttachments.map(file => file.fileName)
          : activityFiles,
      activityAttachments,
      ...(expensePolicies.loaded
        ? { mealPolicy: expensePolicies.meal, activityPolicy: expensePolicies.activity }
        : {}),
      companySchoolLodgingRequested: showCompanySchoolLodging && lodgingRequested,
      companySchoolLodgingFiles: showCompanySchoolLodging
        ? lodgingAttachments.length > 0
          ? lodgingAttachments.map(file => file.fileName)
          : lodgingFiles
        : [],
      companySchoolLodgingAttachments: showCompanySchoolLodging ? lodgingAttachments : [],
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
  const showTransportSection = isReceipt
    ? Boolean(transportItem)
    : showInstructorTransportSection || Boolean(transportExclusionNotice)
  const wageSectionNos = wageExtras.map(() => sectionNo++)
  const transportSectionNo = showTransportSection ? sectionNo++ : null
  const restSectionNos = restExtras.map(() => sectionNo++)
  const mealSectionNo = showInstructorMeal ? sectionNo++ : null
  const activitySectionNo = showInstructorActivity ? sectionNo++ : null
  const lodgingSectionNo = showCompanySchoolLodging ? sectionNo++ : null

  // 미리보기 canSubmit=false(지급 항목 0건 등) — 입력 폼·신청 버튼 없이 회차 배너 + 서버 사유만 보인다.
  // 입력 섹션과 같은 흰 카드 + 인라인 빈 상태(일러스트 없음) — 목록형 빈 상태보다 가볍게
  if (previewSubmitBlock) {
    return (
      <div className={styles.form}>
        <EducationSettlementSessionBanner
          programTitle={programTitle}
          session={session}
          institutionTitle={!isReceipt}
        />
        <PFEmptyState
          variant="inline"
          className={styles['blocked-state']}
          title={previewSubmitBlock.message}
        />
      </div>
    )
  }

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
        {transportIneligibleNotice ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {transportIneligibleNotice}
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

        {!isReceipt && instructorSettlementPreview.calculation ? (
          <PFFormSection id="instructor-settlement-calculation" title="기본 정산 미리보기 (추가 신청 항목 제외)">
            <div className={styles.calculationPreview} aria-live="polite">
              <PFText as="p" typo="bd-md-rg" color="black">
                {instructorSettlementPreview.calculation.lecture}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="black">
                {instructorSettlementPreview.calculation.transportation}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="black">
                {`지급 총액: ${instructorSettlementPreview.calculation.gross}`}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="black">
                {`원천징수액: ${instructorSettlementPreview.calculation.withholding}`}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="black">
                {`예상 실지급액: ${instructorSettlementPreview.calculation.net}`}
              </PFText>
              {instructorSettlementPreview.calculation.explanation ? (
                <PFText as="p" typo="bd-md-rg" color="error">
                  {instructorSettlementPreview.calculation.explanation}
                </PFText>
              ) : null}
            </div>
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
            description={
              isReceipt
                ? '편도 30km 이상 이동 시 지원되는 비용입니다. 가는 편과 오는 편을 구분해 실제 사용한 교통비를 신청해 주세요.'
                : '편도 30km 이상 이동 시 지원되는 비용입니다.'
            }
          >
            {isReceipt ? (
              <>
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
                  uploadEnabled={isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
                  showReceiptUpload={isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
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
                    uploadEnabled={isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
                    showReceiptUpload={isReceiptEvidenceRequired(transportItem?.evidenceRequired)}
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
              </>
            ) : transportExclusionNotice ? (
              <div role="note" aria-label="교통비 제외 안내" className={styles.noteLines}>
                {transportExclusionNotice.map(line => (
                  <PFText key={line} as="p" typo="bd-md-rg" color="error">
                    {line}
                  </PFText>
                ))}
              </div>
            ) : (
              <InstructorTransportFeeBlock preview={instructorTransportPreview} />
            )}
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
            {showInstructorMeal ? (
              <PFFormSection
                id="settlement-meal"
                title={`${mealSectionNo}. 식사비 신청`}
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
                        maxWon={expensePolicies.meal.maxLimitWon}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                  <PFFormFieldRow type="single">
                    <PFFormField label="영수증 제출">
                      <ReceiptUpload
                        fileNames={mealFiles}
                        onFileNamesChange={setMealFiles}
                        attachments={mealAttachments}
                        onAttachmentsChange={next => {
                          setMealAttachments(next)
                          setMealFiles(next.map(file => file.fileName))
                        }}
                        uploadEnabled
                        ariaLabel="식사비 영수증 제출"
                        onError={showAlert}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                </PFFormFieldTable>
              </PFFormSection>
            ) : null}

            {showInstructorActivity ? (
              <PFFormSection
                id="settlement-activity"
                title={`${activitySectionNo}. 활동비 신청`}
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
                        maxWon={expensePolicies.activity.maxLimitWon}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                  <PFFormFieldRow type="single">
                    <PFFormField label="영수증 제출">
                      <ReceiptUpload
                        fileNames={activityFiles}
                        onFileNamesChange={setActivityFiles}
                        attachments={activityAttachments}
                        onAttachmentsChange={next => {
                          setActivityAttachments(next)
                          setActivityFiles(next.map(file => file.fileName))
                        }}
                        uploadEnabled
                        ariaLabel="활동비 영수증 제출"
                        onError={showAlert}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                </PFFormFieldTable>
              </PFFormSection>
            ) : null}

            {showCompanySchoolLodging ? (
              <PFFormSection
                id="settlement-company-school-lodging"
                title={`${lodgingSectionNo}. 숙박비 신청`}
                footer={formatCompanySchoolLodgingFixedAmountNotice()}
              >
                <PFFormFieldTable>
                  <PFFormFieldRow type="single">
                    <PFFormField label="숙박비">
                      <PFCheckbox
                        checked={lodgingRequested}
                        onCheckedChange={setLodgingRequested}
                        label="숙박비 신청"
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                  {lodgingRequested ? (
                    <PFFormFieldRow type="single">
                      <PFFormField label="영수증 제출">
                        <ReceiptUpload
                          fileNames={lodgingFiles}
                          onFileNamesChange={setLodgingFiles}
                          attachments={lodgingAttachments}
                          onAttachmentsChange={next => {
                            setLodgingAttachments(next)
                            setLodgingFiles(next.map(file => file.fileName))
                          }}
                          uploadEnabled
                          ariaLabel="숙박비 영수증 제출"
                          onError={showAlert}
                        />
                      </PFFormField>
                    </PFFormFieldRow>
                  ) : null}
                </PFFormFieldTable>
              </PFFormSection>
            ) : null}
          </>
        ) : null}

        <div className={styles.actions}>
          {lectureFeeBlockerMessage ? (
            <PFText as="p" typo="bd-md-rg" color="error">
              {lectureFeeBlockerMessage}
            </PFText>
          ) : null}
          <PFButton
            type="submit"
            size="xlarge"
            width={240}
            disabled={receiptSubmitBlocked || lectureFeeBlocked || Boolean(receiptLimitError)}
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
