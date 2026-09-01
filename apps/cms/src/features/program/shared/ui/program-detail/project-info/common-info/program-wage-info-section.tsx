/**
 * 임금 정보 섹션 (프로그램 상세 공통 정보 탭)
 */

import { useEffect, useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import {
  getProgramWageInfoMock,
  PROGRAM_WAGE_TYPE_OPTIONS,
  PROGRAM_WAGE_PRICING_MEASURE_OPTIONS,
} from '@/data/mock/program-wage-info'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import type { Program } from '@/types/domain'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export interface ProgramWageInfoSectionProps {
  programId: string
  program?: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const WAGE_COMPARE_RADIO_OPTIONS = [
  { value: 'per' as const, label: '기준(당)' },
  { value: 'over' as const, label: '초과' },
  { value: 'under' as const, label: '이하' },
]

const COMPANY_SCHOOL_WAGE_DEDUCTION_VIEW = '일용근로자 원천징수세액'
const COMPANY_SCHOOL_PAYMENT_ID_TRANSPORT = 'p-1'
const COMPANY_SCHOOL_PAYMENT_ID_LODGING = 'p-7'

const COMPANY_SCHOOL_WAGE_ROWS = [
  {
    gradeLabel: '1급',
    regularLabel: '1급 강사비 책정',
    longDistanceLabel: '1급 강사 장거리비 책정',
    regularField: 'wageGrade1Amount' as const,
    longDistanceField: 'wageGrade1LongDistanceAmount' as const,
    regularValue: '500,000',
    longDistanceValue: '500,000',
    maxAmount: 500000,
    maxText: '최대 500,000원',
  },
  {
    gradeLabel: '2급',
    regularLabel: '2급 강사비 책정',
    longDistanceLabel: '2급 강사 장거리비 책정',
    regularField: 'wageGrade2Amount' as const,
    longDistanceField: 'wageGrade2LongDistanceAmount' as const,
    regularValue: '400,000',
    longDistanceValue: '400,000',
    maxAmount: 400000,
    maxText: '최대 400,000원',
  },
  {
    gradeLabel: '3급',
    regularLabel: '3급 강사비 책정',
    longDistanceLabel: '3급 강사 장거리비 책정',
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

function getCompanySchoolPaymentItemOptions(): CmsSelectMultipleOption[] {
  return getTemplateRegistrationPaymentItemOptions().map(opt => {
    if (opt.value === COMPANY_SCHOOL_PAYMENT_ID_TRANSPORT) {
      return { ...opt, label: '교통비(일사일교)' }
    }
    if (opt.value === COMPANY_SCHOOL_PAYMENT_ID_LODGING) {
      return { ...opt, label: '숙박비(일사일교)' }
    }
    return opt
  })
}

function companySchoolWageView(amount: string, maxText: string) {
  return (
    <>
      1시간 당
      <DetailInfoForm.InputsSeparator />
      {amount}원 ({maxText})
    </>
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
            inputSize="medium"
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

function parseCompanySchoolWageAmount(
  pricing: string | undefined,
  kind: 'regular' | 'longDistance'
): string | undefined {
  if (!pricing?.trim()) return undefined
  const parts = pricing.split(/\s*\|\s*/).map(part => part.trim())
  const target = parts.find(part =>
    kind === 'regular'
      ? part.includes('기본') || !part.includes('장거리')
      : part.includes('장거리')
  )
  return target?.match(/([\d,]+)\s*원/)?.[1]
}

function resolveCompanySchoolWageRows(program: Program | undefined) {
  const savedRows = program?.generalCommonInfo?.wageGradeRows ?? []
  return COMPANY_SCHOOL_WAGE_ROWS.map(row => {
    const saved = savedRows.find(savedRow => savedRow.grade.startsWith(row.gradeLabel))
    return {
      ...row,
      regularValue:
        parseCompanySchoolWageAmount(saved?.pricing, 'regular') ?? row.regularValue,
      longDistanceValue:
        parseCompanySchoolWageAmount(saved?.pricing, 'longDistance') ?? row.longDistanceValue,
    }
  })
}

function WageValueParts({ text }: { text: string }) {
  const parts = text.split(/\s*\|\s*/)
  if (parts.length <= 1) return <>{text}</>
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {p}
        </span>
      ))}
    </>
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
}: ProgramWageInfoSectionProps) {
  const data = useMemo(() => getProgramWageInfoMock(programId), [programId])
  const isCompanySchool = isCompanySchoolProgramId(programId)
  const companySchoolPaymentItemOptions = useMemo(() => getCompanySchoolPaymentItemOptions(), [])
  const isFormEdit = isEditMode && form
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
    for (const row of COMPANY_SCHOOL_WAGE_ROWS) {
      if (!current[row.regularField]) form.setValue(row.regularField, row.regularValue)
      if (!current[row.longDistanceField]) {
        form.setValue(row.longDistanceField, row.longDistanceValue)
      }
    }
    if (!current.wagePaymentItemIds?.length) {
      form.setValue('wagePaymentItemIds', [
        COMPANY_SCHOOL_PAYMENT_ID_TRANSPORT,
        COMPANY_SCHOOL_PAYMENT_ID_LODGING,
      ])
    }
  }, [isCompanySchool, isFormEdit, form])

  if (isCompanySchool) {
    const wageRows = resolveCompanySchoolWageRows(program)
    const paymentItemsView = '교통비(일사일교), 숙박비(일사일교)'

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
              edit={isFormEdit && form ? companySchoolWageEdit(form, row.regularField, row.maxAmount, row.maxText) : undefined}
            />
            <DetailInfoForm.Field
              label={row.longDistanceLabel}
              view={companySchoolWageView(row.longDistanceValue, row.maxText)}
              edit={isFormEdit && form ? companySchoolWageEdit(form, row.longDistanceField, row.maxAmount, row.maxText) : undefined}
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
                        mode="multiple"
                        withAllOption={false}
                        value={field.value ?? []}
                        onChange={next => field.onChange(next as string[])}
                        options={companySchoolPaymentItemOptions}
                        placeholder="지급 항목을 선택하세요"
                        style={{ width: '100%', minWidth: 0 }}
                      />
                    )}
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field label="공제 항목" view={COMPANY_SCHOOL_WAGE_DEDUCTION_VIEW} />
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
                        width={96}
                        style={{ flexShrink: 0 }}
                        value={field.value || '시간'}
                        options={PROGRAM_WAGE_PRICING_MEASURE_OPTIONS}
                        onChange={v => {
                          field.onChange(
                            v === '' || v == null ? '시간' : (v as string)
                          )
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
                        mode="integer"
                        width={112}
                        style={{ flexShrink: 0 }}
                        min={0}
                        value={field.value == null ? '' : String(field.value)}
                        onBlur={field.onBlur}
                        onValueChange={raw => {
                          field.onChange(raw === '' ? undefined : Number(raw))
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
        <DetailInfoForm.Field label="공제 항목" required view={data.deductionItems} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
