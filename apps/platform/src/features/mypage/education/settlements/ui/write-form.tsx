import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EducationSettlementItem } from '../model/types'
import type { SettlementWriteDraftLocationState } from '../model/write-draft'
import { buildSettlementWriteDraft, hydrateSettlementWriteFormState } from '../lib/build-write-draft'
import {
  formatSettlementAmountInput,
  parseSettlementAmount,
} from '../lib/format-write-draft'
import {
  SETTLEMENT_BANK_OPTIONS,
  SETTLEMENT_TRANSIT_OPTIONS,
  SETTLEMENT_TRIP_TYPE_OPTIONS,
} from '../lib/settlement-options'
import {
  resolveSettlementWriteValidationMessage,
  validateSettlementWriteDraft,
} from '../lib/validate-write-draft'
import { saveSettlementWriteDraft } from '../lib/write-draft-storage'
import { buildSettlementConfirmPath } from '../lib/write-path'
import { EducationSettlementSessionBanner } from './settlement-session-banner'
import { useInstructorApplyLockedBasic } from '@/features/mypage/instructor-apply'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { isInstructorMypageProfile } from '@/features/mypage/lib/member-profile'
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

const MOCK_RESIDENT_FRONT = '000915'
const MOCK_RESIDENT_BACK = '1234567'

const RECEIPT_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const RECEIPT_HINTS = [
  '파일은 최대 15M까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

type TripType = 'one_way' | 'round_trip'

type EducationSettlementWriteFormProps = {
  applicationId: string
  sessionId: string
  programTitle?: string
  session?: EducationSettlementItem
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
  ariaLabel,
}: {
  fileNames: string[]
  onFileNamesChange: (next: string[]) => void
  ariaLabel: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.receiptStack}>
      {fileNames.length > 0 ? (
        <ul className={styles.fileList}>
          {fileNames.map((name, index) => (
            <li key={`${index}-${name}`} className={styles.fileChip}>
              <PFText as="span" typo="bd-md-md" color="black" className={styles.fileName}>
                {name}
              </PFText>
              <PFItemDeleteButton
                aria-label={`${name} 삭제`}
                onClick={() => onFileNamesChange(fileNames.filter((_, i) => i !== index))}
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
          accept={RECEIPT_ACCEPT}
          multiple
          aria-label={ariaLabel}
          onChange={event => {
            const incoming = Array.from(event.target.files ?? []).map(file => file.name)
            if (incoming.length > 0) {
              onFileNamesChange([...fileNames, ...incoming])
            }
            event.target.value = ''
          }}
        />
        <PFButton
          type="button"
          variant="secondary"
          size="large"
          className={styles.fileButton}
          onClick={() => inputRef.current?.click()}
        >
          파일 추가
        </PFButton>
        <div className={styles.receiptHints}>
          {RECEIPT_HINTS.map(hint => (
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
  onTransitChange,
  onAmountChange,
  onFileNamesChange,
}: {
  prefix: string
  heading?: string
  transit: string
  amount: string
  fileNames: string[]
  onTransitChange: (next: string) => void
  onAmountChange: (next: string) => void
  onFileNamesChange: (next: string[]) => void
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
              ariaLabel={`${prefix} 영수증 제출`}
            />
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}

export function EducationSettlementWriteForm({
  applicationId,
  sessionId,
  programTitle,
  session,
}: EducationSettlementWriteFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const { profile } = useMypageMember()
  const isInstructor = isInstructorMypageProfile(profile)

  const initialDraft = (location.state as SettlementWriteDraftLocationState | null)?.draft
  const hydrated = initialDraft ? hydrateSettlementWriteFormState(initialDraft) : null

  const [bank, setBank] = useState(hydrated?.bank ?? '')
  const [accountNumber, setAccountNumber] = useState(hydrated?.accountNumber ?? '')
  const [accountHolder, setAccountHolder] = useState(
    hydrated?.accountHolder ?? lockedBasic.name
  )
  const [tripType, setTripType] = useState<TripType>(hydrated?.tripType ?? 'round_trip')
  const [departTransit, setDepartTransit] = useState(hydrated?.departTransit ?? '')
  const [departAmount, setDepartAmount] = useState(hydrated?.departAmount ?? '')
  const [departFiles, setDepartFiles] = useState<string[]>(hydrated?.departFiles ?? [])
  const [returnTransit, setReturnTransit] = useState(hydrated?.returnTransit ?? '')
  const [returnAmount, setReturnAmount] = useState(hydrated?.returnAmount ?? '')
  const [returnFiles, setReturnFiles] = useState<string[]>(hydrated?.returnFiles ?? [])
  const [mealAmount, setMealAmount] = useState(hydrated?.mealAmount ?? '')
  const [mealFiles, setMealFiles] = useState<string[]>(hydrated?.mealFiles ?? [])
  const [activityAmount, setActivityAmount] = useState(hydrated?.activityAmount ?? '')
  const [activityFiles, setActivityFiles] = useState<string[]>(hydrated?.activityFiles ?? [])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const name = lockedBasic.name

  useEffect(() => {
    setAccountHolder(prev => (prev === '' && name ? name : prev))
  }, [name])

  const transportTotal = useMemo(() => {
    const depart = parseSettlementAmount(departAmount)
    const back = tripType === 'round_trip' ? parseSettlementAmount(returnAmount) : 0
    return depart + back
  }, [departAmount, returnAmount, tripType])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const draft = buildSettlementWriteDraft({
      applicationId,
      sessionId,
      isInstructor,
      programTitle,
      name,
      homeAddress: lockedBasic.homeAddress,
      homeAddressDetail: lockedBasic.homeAddressDetail,
      bank,
      accountNumber,
      accountHolder,
      tripType,
      departTransit,
      departAmount,
      departFiles,
      returnTransit,
      returnAmount,
      returnFiles,
      mealAmount,
      mealFiles,
      activityAmount,
      activityFiles,
    })

    const validationError = validateSettlementWriteDraft(draft)
    if (validationError) {
      setAlertMessage(resolveSettlementWriteValidationMessage(validationError))
      setAlertOpen(true)
      return
    }

    saveSettlementWriteDraft(draft)
    navigate(buildSettlementConfirmPath({ applicationId, sessionId }), {
      state: { draft },
    })
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <EducationSettlementSessionBanner programTitle={programTitle} session={session} />

        <PFFormSection
          id="settlement-basic"
          title="1. 기본 정보"
          required
          description="설명이 노출됩니다."
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
                  frontValue={MOCK_RESIDENT_FRONT}
                  backValue={MOCK_RESIDENT_BACK}
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
                      <PFSelect
                        variant="formPage"
                        size="large"
                        width={200}
                        placeholder="은행 선택"
                        options={SETTLEMENT_BANK_OPTIONS}
                        value={bank || undefined}
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

        <PFFormSection
          id="settlement-transport"
          title="2. 교통비 신청"
          required={isInstructor}
          description="강의 과정에서 발생한 교통비에 한해 신청해 주세요."
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
            onTransitChange={setDepartTransit}
            onAmountChange={setDepartAmount}
            onFileNamesChange={setDepartFiles}
          />

          {tripType === 'round_trip' ? (
            <TripLegBlock
              prefix="오는 편"
              heading="오는 편(귀가)"
              transit={returnTransit}
              amount={returnAmount}
              fileNames={returnFiles}
              onTransitChange={setReturnTransit}
              onAmountChange={setReturnAmount}
              onFileNamesChange={setReturnFiles}
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
                  ariaLabel="식사비 영수증 제출"
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
                  ariaLabel="활동비 영수증 제출"
                />
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <div className={styles.actions}>
          <PFButton type="submit" size="xlarge" width={240}>
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
