/**
 * 임금 정보 섹션 (프로그램 상세 공통 정보 탭)
 */

import { useEffect, useMemo } from 'react'
import { isReadOnlyAdminRoleCode } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import {
  EMPTY_PROGRAM_WAGE_INFO,
  PROGRAM_WAGE_TYPE_OPTIONS,
  PROGRAM_WAGE_PRICING_MEASURE_OPTIONS,
} from '@/features/program/shared/model/program-wage-info'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import {
  coerceProgramPaymentItemsText,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import type { Program } from '@/types/domain'
import { mapSettlementDeductionTypeToLabel } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { ProgramDetailTdSegmentWrap } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  paymentItemSelectPlaceholder,
  usePaymentItemCatalogState,
} from '@/features/template/lib/template-registration-payment-item-options'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export interface ProgramWageInfoSectionProps {
  programId: string
  program?: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  forceCompanySchoolLayout?: boolean
}

const WAGE_COMPARE_RADIO_OPTIONS = [
  { value: 'per' as const, label: '기준(당)' },
  { value: 'over' as const, label: '초과' },
  { value: 'under' as const, label: '이하' },
]

const PAYMENT_LABEL_TRANSPORT_CATALOG = '강사 교통비'
const PAYMENT_LABEL_LODGING_CATALOG = '숙박비 (1사1교)'
/** 1사1교 표시 라벨 — 등록 폼(`registration-form/1c-1s/paragraphs/wage-info-paragraph.tsx`)과 동일. 옵션 value(정산 키)는 그대로 */
const PAYMENT_LABEL_TRANSPORT_1C1S = '강사 교통비'
const PAYMENT_LABEL_LODGING_1C1S = '숙박비(1사1교)'
/** 저장된 라벨 토큰(예전 표시 라벨·카탈로그 라벨) → 현재 1사1교 표시 라벨. 매칭·표시에만 쓴다 */
const COMPANY_SCHOOL_PAYMENT_LABEL_ALIASES: Record<string, string> = {
  '교통비(일사일교)': PAYMENT_LABEL_TRANSPORT_1C1S,
  '숙박비(일사일교)': PAYMENT_LABEL_LODGING_1C1S,
  [PAYMENT_LABEL_LODGING_CATALOG]: PAYMENT_LABEL_LODGING_1C1S,
}

function normalizeCompanySchoolPaymentToken(token: string): string {
  return COMPANY_SCHOOL_PAYMENT_LABEL_ALIASES[token] ?? token
}

/**
 * 1사1교 상세 표시 — 교통비·숙박비는 1사1교 전용 항목이므로 「강사 교통비」「숙박비(1사1교)」로 보인다.
 * 서버 표시명(`교통비`, `숙박비`, `교통비(일사일교)` 등)이 그대로 와도 같은 표기로 맞춘다(QA 2026-11-13 1사1교 #2).
 */
function toCompanySchoolPaymentDisplayLabel(label: string): string {
  const compact = label.replace(/\s+/g, '')
  if (/^교통비(\((일사일교|1사1교)\))?$/.test(compact)) return PAYMENT_LABEL_TRANSPORT_1C1S
  if (/^숙박비(\((일사일교|1사1교)\))?$/.test(compact)) return PAYMENT_LABEL_LODGING_1C1S
  return label
}

const COMPANY_SCHOOL_WAGE_ROWS = [
  {
    gradeLabel: '1급',
    regularLabel: '1급 강사비',
    longDistanceLabel: '1급 장거리비',
    regularField: 'wageGrade1Amount' as const,
    longDistanceField: 'wageGrade1LongDistanceAmount' as const,
    regularValue: '500,000',
    longDistanceValue: '500,000',
    maxAmount: 500000,
    maxText: '최대 500,000원',
  },
  {
    gradeLabel: '2급',
    regularLabel: '2급 강사비',
    longDistanceLabel: '2급 장거리비',
    regularField: 'wageGrade2Amount' as const,
    longDistanceField: 'wageGrade2LongDistanceAmount' as const,
    regularValue: '400,000',
    longDistanceValue: '400,000',
    maxAmount: 400000,
    maxText: '최대 400,000원',
  },
  {
    gradeLabel: '3급',
    regularLabel: '3급 강사비',
    longDistanceLabel: '3급 장거리비',
    regularField: 'wageGrade3Amount' as const,
    longDistanceField: 'wageGrade3LongDistanceAmount' as const,
    regularValue: '300,000',
    longDistanceValue: '300,000',
    maxAmount: 300000,
    maxText: '최대 300,000원',
  },
]

function isCompanySchoolProgramId(programId: string): boolean {
  return (
    programId.startsWith('economy-prog-') ||
    programId.startsWith('company-school-prog-') ||
    programId.startsWith('company-school-local-')
  )
}

function remapCompanySchoolPaymentItemOptions(
  options: CmsSelectMultipleOption[]
): CmsSelectMultipleOption[] {
  return options.map(opt => {
    const label = opt.label.trim()
    const compact = label.replace(/\s+/g, '')
    if (label === PAYMENT_LABEL_TRANSPORT_CATALOG || /^교통비\((일사일교|1사1교)\)$/.test(compact)) {
      return { ...opt, label: PAYMENT_LABEL_TRANSPORT_1C1S }
    }
    if (label === PAYMENT_LABEL_LODGING_CATALOG || /^숙박비\((일사일교|1사1교)\)$/.test(compact)) {
      return { ...opt, label: PAYMENT_LABEL_LODGING_1C1S }
    }
    return opt
  })
}

function companySchoolWageView(amount: string | undefined, maxText: string) {
  if (!amount?.trim()) return '-'
  return (
    <ProgramDetailTdSegmentWrap>
      1시간 당
      <DetailInfoForm.InputsSeparator />
      {amount}원 ({maxText})
    </ProgramDetailTdSegmentWrap>
  )
}

function companySchoolWageEdit(
  form: UseFormReturn<ProgramDetailEditFormValues>,
  name: keyof ProgramDetailEditFormValues,
  maxAmount: number,
  maxText: string
) {
  return (
    <div className="detail-info-form-inputs-wrapper">
      <span className="detail-info-form--text">1시간 당</span>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <CmsNumericInput
            mode="currency"
            inputSize="small"
            placeholder="직접 입력"
            width={120}
            min={0}
            max={maxAmount}
            precision={0}
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
          />
        )}
      />
      <span className="detail-info-form--text">원 ({maxText})</span>
    </div>
  )
}

function resolveCompanySchoolWageRows(program: Program | undefined) {
  const savedRows = program?.generalCommonInfo?.wageGradeRows ?? []
  return COMPANY_SCHOOL_WAGE_ROWS.map(row => {
    const saved = savedRows.find(savedRow => savedRow.grade.startsWith(row.gradeLabel))
    return {
      ...row,
      regularValue: parseCompanySchoolWageAmountFromPricing(saved?.pricing, 'regular'),
      longDistanceValue: parseCompanySchoolWageAmountFromPricing(saved?.pricing, 'longDistance'),
    }
  })
}

function formatCompanySchoolPaymentItemsView(
  paymentItems: unknown,
  options: CmsSelectMultipleOption[]
): string {
  const text = coerceProgramPaymentItemsText(paymentItems)
  if (!text.trim()) return '-'
  const tokens = text
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
  if (tokens.length === 0) return '-'
  const labels = tokens.map(rawToken => {
    const token = normalizeCompanySchoolPaymentToken(rawToken)
    const matched = options.find(option => option.value === token || option.label === token)
    if (matched?.label) return matched.label
    if (token === 'LONG_DISTANCE_TRANSPORTATION') return '장거리 교통비'
    if (token === 'STUDENT_TRANSPORTATION') return '학생 교통비'
    if (token === 'TRANSPORTATION') return '강사 교통비'
    return token
  }).map(toCompanySchoolPaymentDisplayLabel)
  const resolvedIds = resolveProgramPaymentItemIdsFromLabels(text)
  if (labels.every(label => /^p-\d+$/i.test(label)) && resolvedIds.length > 0) {
    return programPaymentItemLabelsFromIds(resolvedIds) || labels.join(', ')
  }
  return labels.join(', ')
}

function WageValueParts({ text }: { text: string }) {
  const parts = text.split(/\s*\|\s*/)
  if (parts.length <= 1) return <>{text}</>
  return (
    <ProgramDetailTdSegmentWrap>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {p}
        </span>
      ))}
    </ProgramDetailTdSegmentWrap>
  )
}

function parsePricingDisplay(text: string): {
  timeUnit: string
  basePrice: string
  longDistancePrice: string
} {
  const parts = text.split(/\s*\|\s*/).map(v => v.trim())
  const timeUnit = parts[0] ?? '1시간 당'
  const basePrice =
    parts.find(v => v.startsWith('기본'))?.replace(/^기본(?: 강사비)?\s*:\s*/, '') ?? '240,000원'
  const longDistancePrice =
    parts.find(v => v.startsWith('장거리'))?.replace(/^장거리(?: 강사비)?\s*:\s*/, '') ??
    '300,000원'
  return { timeUnit, basePrice, longDistancePrice }
}

type WageCompareMode = 'per' | 'over' | 'under'

/** "1시간 당" 등 → 단위·수량·비교 모드 */
function parseWagePricingBasis(timeUnitPart: string): {
  measureLabel: string
  quantity: number
  compareMode: WageCompareMode
} {
  const s = timeUnitPart.replace(/\s+/g, ' ').trim()
  const re = /^(\d+)\s*시간\s*(당|초과|이하)?$/
  const m = s.match(re)
  if (m) {
    const qty = Math.max(0, parseInt(m[1], 10) || 1)
    const tail = m[2]
    const compareMode: WageCompareMode =
      tail === '초과' ? 'over' : tail === '이하' ? 'under' : 'per'
    return { measureLabel: '시간', quantity: qty, compareMode }
  }
  const numMatch = s.match(/(\d+)/)
  const qty = numMatch ? Math.max(0, parseInt(numMatch[1], 10) || 1) : 1
  let compareMode: WageCompareMode = 'per'
  if (s.includes('초과')) compareMode = 'over'
  else if (s.includes('이하')) compareMode = 'under'
  return { measureLabel: '시간', quantity: qty, compareMode }
}

function composeWagePricingTimeUnit(
  measureLabel: string | undefined,
  quantity: number | undefined,
  compareMode: WageCompareMode | undefined
): string {
  const q = quantity != null && !Number.isNaN(Number(quantity)) ? Math.max(0, Number(quantity)) : 1
  const measure = measureLabel?.trim() || '시간'
  const mode: WageCompareMode = compareMode ?? 'per'
  const suffix = mode === 'over' ? '초과' : mode === 'under' ? '이하' : '당'
  if (measure === '시간') {
    return `${q}시간 ${suffix}`.replace(/\s+/g, ' ').trim()
  }
  return `${q}${measure} ${suffix}`.replace(/\s+/g, ' ').trim()
}

function syncWagePricingTimeUnit(form: UseFormReturn<ProgramDetailEditFormValues>) {
  const v = form.getValues()
  form.setValue(
    'wagePricingTimeUnit',
    composeWagePricingTimeUnit(
      v.wagePricingMeasureLabel,
      v.wagePricingQuantity,
      v.wagePricingCompareMode
    )
  )
}

export function ProgramWageInfoSection({
  programId,
  program,
  isEditMode = false,
  form,
  forceCompanySchoolLayout = false,
}: ProgramWageInfoSectionProps) {
  const data = useMemo(() => EMPTY_PROGRAM_WAGE_INFO, [])
  const isCompanySchool =
    forceCompanySchoolLayout ||
    (program != null && isCompanySchoolProgram(program)) ||
    isCompanySchoolProgramId(programId)
  const isFormEdit = isEditMode && form
  const roleCode = useSessionAdminRoleCode()
  // 지급 항목 목록(정산 설정)은 수정 모드와 1사1교 보기 모드 라벨에만 쓴다.
  // Program Viewer는 정산 설정 조회가 403이라 보기 모드에서는 부르지 않고 대체 라벨을 쓴다.
  const paymentCatalog = usePaymentItemCatalogState(
    Boolean(isFormEdit) || (isCompanySchool && !isReadOnlyAdminRoleCode(roleCode))
  )
  const companySchoolPaymentItemOptions = useMemo(
    () => remapCompanySchoolPaymentItemOptions(paymentCatalog.options),
    [paymentCatalog.options]
  )
  const parsedPricing = useMemo(
    () => parsePricingDisplay(data.pricingDisplay),
    [data.pricingDisplay]
  )

  useEffect(() => {
    if (!isFormEdit || !form) return
    const current = form.getValues()
    if (!current.wageType) form.setValue('wageType', data.wageType)
    if (!current.wagePricingTimeUnit) form.setValue('wagePricingTimeUnit', parsedPricing.timeUnit)
    const basis = parseWagePricingBasis(parsedPricing.timeUnit)
    if (current.wagePricingMeasureLabel === undefined) {
      form.setValue('wagePricingMeasureLabel', basis.measureLabel)
    }
    if (current.wagePricingQuantity === undefined) {
      form.setValue('wagePricingQuantity', basis.quantity)
    }
    if (current.wagePricingCompareMode === undefined) {
      form.setValue('wagePricingCompareMode', basis.compareMode)
    }
    if (!current.wagePricingBase) form.setValue('wagePricingBase', parsedPricing.basePrice)
    if (!current.wagePricingLongDistance) {
      form.setValue('wagePricingLongDistance', parsedPricing.longDistancePrice)
    }
  }, [isFormEdit, form, data, parsedPricing])

  useEffect(() => {
    if (!isCompanySchool || !isFormEdit || !form) return
    const current = form.getValues()
    const apiRows = resolveCompanySchoolWageRows(program)
    for (const [index, row] of COMPANY_SCHOOL_WAGE_ROWS.entries()) {
      const apiRow = apiRows[index]
      if (!current[row.regularField] && apiRow?.regularValue) {
        form.setValue(row.regularField, apiRow.regularValue)
      }
      if (!current[row.longDistanceField] && apiRow?.longDistanceValue) {
        form.setValue(row.longDistanceField, apiRow.longDistanceValue)
      }
    }
    if (current.wagePaymentItemIds !== undefined) return
    const savedTokens = program?.generalCommonInfo?.paymentItems
      ?.split(',')
      .map(part => part.trim())
      .filter(Boolean)
    const matchedIds = (savedTokens ?? [])
      .map(rawToken => {
        const token = normalizeCompanySchoolPaymentToken(rawToken)
        return companySchoolPaymentItemOptions.find(
          opt => opt.value === token || opt.label === token
        )?.value
      })
      .filter((id): id is string => Boolean(id))
    if (matchedIds.length > 0) {
      form.setValue('wagePaymentItemIds', matchedIds)
    }
  }, [isCompanySchool, isFormEdit, form, program, companySchoolPaymentItemOptions])

  if (isCompanySchool) {
    const wageRows = resolveCompanySchoolWageRows(program)
    const paymentItemsView = formatCompanySchoolPaymentItemsView(
      program?.generalCommonInfo?.paymentItems,
      companySchoolPaymentItemOptions
    )
    const deductionItemsView =
      mapSettlementDeductionTypeToLabel(program?.generalCommonInfo?.deductionItems) ??
      program?.generalCommonInfo?.deductionItems?.trim() ??
      '-'

    return (
      <DetailInfoForm
        title="임금 정보"
        mode={isFormEdit ? 'edit' : 'view'}
        className="detail-info-form--gap"
      >
        {wageRows.map(row => (
          <DetailInfoForm.Row key={row.gradeLabel} type="double">
            <DetailInfoForm.Field
              label={row.regularLabel}
              view={companySchoolWageView(row.regularValue, row.maxText)}
              edit={
                isFormEdit && form
                  ? companySchoolWageEdit(form, row.regularField, row.maxAmount, row.maxText)
                  : undefined
              }
            />
            <DetailInfoForm.Field
              label={row.longDistanceLabel}
              view={companySchoolWageView(row.longDistanceValue, row.maxText)}
              edit={
                isFormEdit && form
                  ? companySchoolWageEdit(form, row.longDistanceField, row.maxAmount, row.maxText)
                  : undefined
              }
            />
          </DetailInfoForm.Row>
        ))}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 항목"
            view={paymentItemsView}
            edit={
              isFormEdit && form ? (
                <div className="detail-info-form-inputs-wrapper-no-gap">
                  <Controller
                    name="wagePaymentItemIds"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        inputSize="small"
                        mode="multiple"
                        withAllOption={false}
                        value={field.value ?? []}
                        onChange={next => field.onChange(next as string[])}
                        options={companySchoolPaymentItemOptions}
                        disabled={!paymentCatalog.ready}
                        placeholder={paymentItemSelectPlaceholder(paymentCatalog)}
                        style={{ width: '100%', minWidth: 0 }}
                      />
                    )}
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field label="공제 항목" view={deductionItemsView} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm
      title="임금 정보"
      mode={isFormEdit ? 'edit' : 'view'}
      className="detail-info-form--gap"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사비 유형"
          required
          view={data.wageType}
          edit={
            isFormEdit && form ? (
              <Controller
                name="wageType"
                control={form.control}
                render={({ field }) => {
                  const current = field.value?.trim() ?? ''
                  const inPreset = PROGRAM_WAGE_TYPE_OPTIONS.some(o => o.value === current)
                  const options =
                    current && !inPreset
                      ? [...PROGRAM_WAGE_TYPE_OPTIONS, { value: current, label: current }]
                      : PROGRAM_WAGE_TYPE_OPTIONS
                  return (
                    <CmsSelect
                      inputSize="small"
                      value={current || undefined}
                      options={options}
                      placeholder="강사비 유형 선택"
                      showSearch
                      optionFilterProp="label"
                      onChange={v => field.onChange(v == null || v === '' ? undefined : v)}
                    />
                  )
                }}
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="강사비 책정"
          required
          view={<WageValueParts text={data.pricingDisplay} />}
          edit={
            isFormEdit && form ? (
              <div>
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name="wagePricingMeasureLabel"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        inputSize="small"
                        width={96}
                        style={{ flexShrink: 0 }}
                        withAllOption={false}
                        placeholder="단위"
                        value={field.value || undefined}
                        options={PROGRAM_WAGE_PRICING_MEASURE_OPTIONS}
                        onChange={v => {
                          field.onChange(v === '' || v == null ? '' : (v as string))
                          syncWagePricingTimeUnit(form)
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="wagePricingQuantity"
                    control={form.control}
                    render={({ field }) => (
                      <CmsNumericInput
                        inputSize="small"
                        mode="integer"
                        width={112}
                        style={{ flexShrink: 0 }}
                        min={0}
                        value={field.value == null ? '' : String(field.value)}
                        onBlur={field.onBlur}
                        onValueChange={raw => {
                          field.onChange(raw === '' ? null : Number(raw))
                          syncWagePricingTimeUnit(form)
                        }}
                      />
                    )}
                  />
                  <div style={{ flexShrink: 0 }}>
                    {form.watch('wagePricingMeasureLabel') || '시간'}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 4 }}>
                    <Controller
                      name="wagePricingCompareMode"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadio.Group
                          size="medium"
                          value={field.value ?? 'per'}
                          options={WAGE_COMPARE_RADIO_OPTIONS}
                          onChange={e => {
                            field.onChange(e.target.value as WageCompareMode)
                            syncWagePricingTimeUnit(form)
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      {isFormEdit && form ? (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="기본 강사비"
            required
            view="-"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <Controller
                  name="wagePricingBase"
                  control={form.control}
                  render={({ field }) => (
                    <CmsNumericInput
                      inputSize="small"
                      mode="currency"
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                      placeholder="직접 입력"
                    />
                  )}
                />
                <span>원</span>
              </div>
            }
          />
          <DetailInfoForm.Field
            label="장거리 강사비"
            required
            view="-"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <Controller
                  name="wagePricingLongDistance"
                  control={form.control}
                  render={({ field }) => (
                    <CmsNumericInput
                      inputSize="small"
                      mode="currency"
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                      placeholder="직접 입력"
                    />
                  )}
                />
                <span>원</span>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="지급 항목" required view={data.paymentItems} />
        <DetailInfoForm.Field
          label="공제 항목"
          required
          view={mapSettlementDeductionTypeToLabel(data.deductionItems) ?? data.deductionItems}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
