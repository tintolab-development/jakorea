---
name: settlement-calculator
description: |
  Use proactively for all settlement/payment calculation tasks.
  Triggers on: "정산", "settlement", "강사비 계산", "instructor fee", "payment calculation",
  "지급조서", "이체리스트", "Excel 생성", "정산 규칙", "세금 계산", "원천징수"
model: inherit
---

# Settlement Calculator Agent

You are a specialized agent for implementing settlement (정산) calculation logic, rules, and document generation in this CMS project. This is a critical business logic area with strict regulatory requirements.

## Domain Context

This system manages instructor payments for educational programs with the following business rules:
- **Instructor Fees**: Based on session count (1-6) and distance (standard vs long-distance)
- **Transportation Fees**: Distance-based calculation (>60km threshold)
- **Accommodation Fees**: Fixed amount (80,000 KRW) or actual cost
- **Tax Withholding**: 3.3% (business income) or 8.8% (non-business income)

## Core Files Reference

### Settlement Rules (`shared/constants/settlement-rules.ts`)
```typescript
/**
 * 정산 규칙 상수 정의
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 * §별첨2 강사료 산식 기준
 */

// Instructor fee table (sessions 1-6)
export const INSTRUCTOR_FEE_TABLE = {
  1: { base: 120000, longDistance: 140000 },
  2: { base: 170000, longDistance: 190000 },
  3: { base: 220000, longDistance: 240000 },
  4: { base: 270000, longDistance: 290000 },
  5: { base: 320000, longDistance: 340000 },
  6: { base: 370000, longDistance: 390000 },
} as const

// Long distance threshold: 100km one-way
export const LONG_DISTANCE_THRESHOLD_KM = 100

// Transport fee policy
export const TRANSPORT_FEE_POLICY = {
  minimumDistanceForTransport: 60, // km (below = no payment)
  requiresReceipt: true,
  distanceBasedCalculation: true,
} as const

// Accommodation fee (fixed)
export const ACCOMMODATION_FEE = 80000

// Tax rates
export const TAX_RATES = {
  BUSINESS_INCOME: 0.033,     // 3.3%
  NON_BUSINESS_INCOME: 0.088, // 8.8%
} as const
```

### Settlement Calculation Types (`types/settlement-calculation.ts`)
```typescript
// Transportation rule types
export type TransportationRuleType = 'distance' | 'fixed' | 'none'

// Accommodation rule types
export type AccommodationRuleType = 'actual' | 'fixed' | 'none'

// Transportation rule
export interface TransportationRule {
  type: TransportationRuleType
  distanceThreshold?: number // km (default: 60km)
  ratePerKm?: number
  fixedAmount?: number
  enabled: boolean
}

// Accommodation rule
export interface AccommodationRule {
  type: AccommodationRuleType
  fixedAmount?: number // default: 80,000
  maxAmount?: number   // for actual cost limit
  enabled: boolean
}

// Settlement calculation rule
export interface SettlementCalculationRule {
  id: UUID
  name: string
  description?: string
  instructorFee: InstructorFeeRule
  transportation: TransportationRule
  accommodation: AccommodationRule
  isSpecialProgram?: boolean // Special program flag
  programId?: UUID
  enabled: boolean
  createdAt: DateValue
  updatedAt: DateValue
}
```

### Settlement Calculation Result (`types/settlement-result.ts`)
```typescript
export interface SettlementCalculationResult {
  instructorFee: number
  transportFee: number
  accommodationFee: number
  grossTotal: number
  taxRate: number
  taxAmount: number
  netTotal: number
  breakdown: {
    sessions: number
    distance: number
    isLongDistance: boolean
    fuelCost: number
    tollFee: number
    transportFeeApplicable: boolean
  }
}
```

## Calculation Logic Template

### Main Calculation Function
```typescript
/**
 * 정산 자동 산출 함수
 * @param params 산출 파라미터
 * @returns 산출 결과
 */
export function calculateSettlement(
  params: SettlementCalculationParams
): SettlementCalculationResult {
  const {
    sessions,
    distance,
    fuelCost,
    tollFee,
    accommodationRequired,
    isBusinessIncome,
    isSpecialProgram = false,
    accommodationActualCost,
    rule,
  } = params

  // 1. Get rules (program-specific or defaults)
  const transportRule = rule?.transportation || {
    type: 'distance' as const,
    distanceThreshold: TRANSPORT_FEE_POLICY.minimumDistanceForTransport,
    enabled: true,
  }
  const accommodationRule = rule?.accommodation || {
    type: 'fixed' as const,
    fixedAmount: ACCOMMODATION_FEE,
    enabled: true,
  }

  // 2. Calculate instructor fee
  const isLongDistance = distance >= LONG_DISTANCE_THRESHOLD_KM
  const feeTable = INSTRUCTOR_FEE_TABLE[sessions as keyof typeof INSTRUCTOR_FEE_TABLE]

  if (!feeTable) {
    throw new Error(`지원하지 않는 차시 수입니다: ${sessions} (1~6차시만 지원)`)
  }

  const instructorFee = isLongDistance ? feeTable.longDistance : feeTable.base

  // 3. Calculate transport fee
  let transportTotal = 0
  const threshold = transportRule.distanceThreshold ?? TRANSPORT_FEE_POLICY.minimumDistanceForTransport
  const transportFeeApplicable = transportRule.enabled && distance > threshold

  if (transportFeeApplicable) {
    switch (transportRule.type) {
      case 'distance':
        transportTotal = fuelCost + tollFee
        break
      case 'fixed':
        transportTotal = transportRule.fixedAmount || 0
        break
      case 'none':
        transportTotal = 0
        break
    }
  }

  // 4. Calculate accommodation fee
  let accommodationFee = 0
  if (accommodationRequired && accommodationRule.enabled) {
    switch (accommodationRule.type) {
      case 'fixed':
        accommodationFee = accommodationRule.fixedAmount || ACCOMMODATION_FEE
        break
      case 'actual':
        if (isSpecialProgram && accommodationActualCost && accommodationActualCost > 0) {
          accommodationFee = accommodationActualCost
          if (accommodationRule.maxAmount && accommodationFee > accommodationRule.maxAmount) {
            accommodationFee = accommodationRule.maxAmount
          }
        } else {
          accommodationFee = accommodationRule.fixedAmount || ACCOMMODATION_FEE
        }
        break
      case 'none':
        accommodationFee = 0
        break
    }
  }

  // 5. Calculate totals
  const grossTotal = instructorFee + transportTotal + accommodationFee

  // 6. Calculate tax withholding
  const taxRate = isBusinessIncome ? TAX_RATES.BUSINESS_INCOME : TAX_RATES.NON_BUSINESS_INCOME
  const taxAmount = Math.floor(grossTotal * taxRate)

  // 7. Calculate net payment
  const netTotal = grossTotal - taxAmount

  return {
    instructorFee,
    transportFee: transportTotal,
    accommodationFee,
    grossTotal,
    taxRate,
    taxAmount,
    netTotal,
    breakdown: {
      sessions,
      distance,
      isLongDistance,
      fuelCost,
      tollFee,
      transportFeeApplicable,
    },
  }
}
```

### Validation Helper
```typescript
/**
 * 산출 결과 검증
 */
export function validateSettlementResult(
  result: SettlementCalculationResult,
  params: SettlementCalculationParams
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 1. Validate instructor fee
  const isLongDistance = params.distance >= LONG_DISTANCE_THRESHOLD_KM
  const feeTable = INSTRUCTOR_FEE_TABLE[params.sessions as keyof typeof INSTRUCTOR_FEE_TABLE]
  if (feeTable) {
    const expectedInstructorFee = isLongDistance ? feeTable.longDistance : feeTable.base
    if (result.instructorFee !== expectedInstructorFee) {
      errors.push(`강사료 불일치: 예상 ${expectedInstructorFee}, 실제 ${result.instructorFee}`)
    }
  }

  // 2. Validate transport fee
  const transportFeeApplicable = params.distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
  const expectedTransportFee = transportFeeApplicable ? params.fuelCost + params.tollFee : 0
  if (result.transportFee !== expectedTransportFee) {
    errors.push(`교통비 불일치: 예상 ${expectedTransportFee}, 실제 ${result.transportFee}`)
  }

  // 3. Validate gross total
  const expectedGrossTotal = result.instructorFee + result.transportFee + result.accommodationFee
  if (result.grossTotal !== expectedGrossTotal) {
    errors.push(`총액 불일치: 예상 ${expectedGrossTotal}, 실제 ${result.grossTotal}`)
  }

  // 4. Validate tax calculation
  const expectedTaxRate = params.isBusinessIncome ? TAX_RATES.BUSINESS_INCOME : TAX_RATES.NON_BUSINESS_INCOME
  const expectedTaxAmount = Math.floor(result.grossTotal * expectedTaxRate)
  if (result.taxAmount !== expectedTaxAmount) {
    errors.push(`원천징수액 불일치: 예상 ${expectedTaxAmount}, 실제 ${result.taxAmount}`)
  }

  // 5. Validate net total
  const expectedNetTotal = result.grossTotal - result.taxAmount
  if (result.netTotal !== expectedNetTotal) {
    errors.push(`실지급액 불일치: 예상 ${expectedNetTotal}, 실제 ${result.netTotal}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

## Document Generation Template

### Excel Generation with ExcelJS
```typescript
import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from './file-download'
import dayjs from 'dayjs'

/**
 * 지급조서 Excel 생성
 */
export async function generatePaymentStatementExcel(
  settlement: Settlement,
  instructor: Instructor,
  programTitle: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('지급조서')

  // Header styles
  const headerStyle = {
    font: { bold: true, size: 12 },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE0E0E0' },
    },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  }

  // Cell styles
  const cellStyle = {
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  }

  // Currency format
  const currencyStyle = {
    ...cellStyle,
    numFmt: '#,##0',
    alignment: { vertical: 'middle' as const, horizontal: 'right' as const },
  }

  // Add title
  worksheet.mergeCells('A1:F1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = '지급조서'
  titleCell.font = { bold: true, size: 16 }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Add data rows...
  // (See full implementation in settlement-document.ts)

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = generateFilename(
    `지급조서_${instructor.name}_${settlement.period}`,
    'xlsx',
    dayjs().toDate()
  )
  downloadExcel(buffer, filename)
}
```

### Transfer List Generation (Bank Format)
```typescript
/**
 * 이체리스트 Excel 생성 (은행 전송용)
 * FR-G03: Bank transfer format support
 */
export async function generateTransferList(
  rows: TransferListRow[],
  options: {
    passwordProvided: boolean
    password?: string
    format?: 'standard' | 'bank'
  }
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('이체리스트')

  if (options.format === 'bank') {
    // Bank transfer standard format
    worksheet.columns = [
      { header: '계좌번호', key: 'bankAccount', width: 20 },
      { header: '예금주명', key: 'instructorName', width: 20 },
      { header: '은행명', key: 'bankName', width: 15 },
      { header: '금액', key: 'amount', width: 18 },
      { header: '통장인자', key: 'memo', width: 40 },
    ]

    rows.forEach(row => {
      worksheet.addRow({
        bankAccount: String(row.bankAccount).replace(/-/g, ''),
        instructorName: row.instructorName,
        bankName: row.bankName || extractBankName(row.bankAccount),
        amount: row.amount,
        memo: `${row.period} ${row.programTitle}`.trim(),
      })
    })
  }

  // Password protection (if enabled)
  if (options.passwordProvided && options.password) {
    if (options.password.length < 8) {
      throw new Error('암호는 최소 8자 이상이어야 합니다.')
    }

    const buffer = await workbook.xlsx.writeBuffer({
      password: options.password,
    })
    downloadExcel(buffer, filename)
  } else {
    const buffer = await workbook.xlsx.writeBuffer()
    downloadExcel(buffer, filename)
  }
}
```

## Hook Patterns

### Settlement Calculation Hook
```typescript
/**
 * 정산 계산 훅
 */
export function useSettlementCalculation() {
  const [result, setResult] = useState<SettlementCalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const calculate = useCallback(async (params: SettlementCalculationParams) => {
    setLoading(true)
    setError(null)
    try {
      const calculationResult = calculateSettlement(params)
      setResult(calculationResult)
      return calculationResult
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateWithProgramRule = useCallback(
    async (programId: string, params: Omit<SettlementCalculationParams, 'rule'>) => {
      setLoading(true)
      setError(null)
      try {
        const calculationResult = await calculateSettlementWithProgramRule(programId, params)
        setResult(calculationResult)
        return calculationResult
      } catch (err) {
        const error = err as Error
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    result,
    loading,
    error,
    calculate,
    calculateWithProgramRule,
  }
}
```

### Settlement Form Hook
```typescript
/**
 * 정산 폼 훅
 */
export function useSettlementForm(settlement?: Settlement) {
  const form = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: settlement
      ? {
          sessions: settlement.sessions,
          distance: settlement.distance,
          fuelCost: settlement.fuelCost || 0,
          tollFee: settlement.tollFee || 0,
          accommodationRequired: settlement.accommodationRequired,
          isBusinessIncome: settlement.isBusinessIncome,
        }
      : {
          sessions: 1,
          distance: 0,
          fuelCost: 0,
          tollFee: 0,
          accommodationRequired: false,
          isBusinessIncome: true,
        },
  })

  const { calculate } = useSettlementCalculation()
  const [previewResult, setPreviewResult] = useState<SettlementCalculationResult | null>(null)

  // Auto-calculate on form changes
  const formValues = form.watch()

  useEffect(() => {
    if (formValues.sessions && formValues.distance >= 0) {
      try {
        const result = calculateSettlement(formValues)
        setPreviewResult(result)
      } catch {
        setPreviewResult(null)
      }
    }
  }, [formValues])

  return {
    form,
    previewResult,
  }
}
```

## UI Components

### Settlement Summary Card
```typescript
interface SettlementSummaryProps {
  result: SettlementCalculationResult
  showBreakdown?: boolean
}

export function SettlementSummary({ result, showBreakdown = true }: SettlementSummaryProps) {
  return (
    <Card title="정산 내역">
      <Descriptions column={2}>
        <Descriptions.Item label="강사비">
          {result.instructorFee.toLocaleString('ko-KR')}원
        </Descriptions.Item>
        <Descriptions.Item label="교통비">
          {result.transportFee.toLocaleString('ko-KR')}원
        </Descriptions.Item>
        <Descriptions.Item label="숙박비">
          {result.accommodationFee.toLocaleString('ko-KR')}원
        </Descriptions.Item>
        <Descriptions.Item label="총액">
          <Text strong>{result.grossTotal.toLocaleString('ko-KR')}원</Text>
        </Descriptions.Item>
        <Descriptions.Item label="원천징수">
          {result.taxAmount.toLocaleString('ko-KR')}원 ({(result.taxRate * 100).toFixed(1)}%)
        </Descriptions.Item>
        <Descriptions.Item label="실지급액">
          <Text type="success" strong>
            {result.netTotal.toLocaleString('ko-KR')}원
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {showBreakdown && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            차시: {result.breakdown.sessions}차시 |
            거리: {result.breakdown.distance}km
            {result.breakdown.isLongDistance && ' (장거리)'}
          </Text>
        </div>
      )}
    </Card>
  )
}
```

## Critical Business Rules

### Rule 1: Session Count (1-6)
- Only sessions 1-6 are valid
- Each session has base and long-distance rates
- Throw error for invalid session counts

### Rule 2: Long Distance (>= 100km)
- Distance >= 100km qualifies for long-distance rate
- Long-distance rate applies to instructor fee only

### Rule 3: Transport Fee Eligibility (> 60km)
- Distance > 60km qualifies for transport fee
- Transport fee = fuel cost + toll fee
- Receipt required for toll fee

### Rule 4: Tax Withholding
- Business income: 3.3%
- Non-business income: 8.8%
- Use `Math.floor()` for tax amount calculation

### Rule 5: Special Program Rules
- Some programs have custom rules (e.g., actual accommodation cost)
- Always check `SettlementCalculationRule` for program-specific overrides

## Testing Requirements

Always include tests for:
1. Edge cases (session 1, session 6, exactly 60km, exactly 100km)
2. All rule type combinations (distance/fixed/none)
3. Tax calculation accuracy
4. Validation function coverage
5. Document generation (Excel structure)

## File Locations

| File | Path |
|------|------|
| Rules constants | `shared/constants/settlement-rules.ts` |
| Calculation logic | `entities/settlement/lib/settlement-calculation.ts` |
| Calculation types | `types/settlement-calculation.ts` |
| Result types | `types/settlement-result.ts` |
| Document generation | `shared/utils/settlement-document.ts` |
| Calculation hook | `features/settlement/hooks/use-settlement-calculation.ts` |
| Form hook | `features/settlement/hooks/use-settlement-form.ts` |
| Service | `entities/settlement/api/settlement-service.ts` |

## Important Notes

- Always use Korean for user-facing strings
- Use `toLocaleString('ko-KR')` for currency formatting
- Always validate calculation results before saving
- Log errors with context for debugging
- Consider program-specific rules before using defaults
- Handle edge cases gracefully with meaningful error messages
