/**
 * 정산 산출내역 요약 컴포넌트
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 */

import { Tag, Typography, Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { SettlementCalculationResult } from '@/entities/settlement/lib/settlement-calculation'

const { Text } = Typography

interface SettlementCalculationSummaryProps {
  result: SettlementCalculationResult
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export function SettlementCalculationSummary({
  result,
}: SettlementCalculationSummaryProps) {
  return (
    <DetailInfoForm title="산출 내역" hideHeader mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="강사료"
          view={
            <Space>
              <Text strong>{formatCurrency(result.instructorFee)}</Text>
              {result.breakdown.isLongDistance && <Tag color="orange">장거리 가산</Tag>}
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({result.breakdown.sessions}차시)
              </Text>
            </Space>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교통비"
          view={
            result.breakdown.transportFeeApplicable ? (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{formatCurrency(result.transportFee)}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  주유비 {formatCurrency(result.breakdown.fuelCost)} + 통행료{' '}
                  {formatCurrency(result.breakdown.tollFee)}
                </Text>
              </Space>
            ) : (
              <Space>
                <Text type="secondary">-</Text>
                <Tag color="default" style={{ fontSize: 11 }}>
                  60km 이하로 교통비 미지급
                </Tag>
              </Space>
            )
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="숙박비"
          view={
            result.accommodationFee > 0 ? (
              <Text strong>{formatCurrency(result.accommodationFee)}</Text>
            ) : (
              <Text type="secondary">-</Text>
            )
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="총액 (세전)"
          view={
            <Text strong style={{ fontSize: 16 }}>
              {formatCurrency(result.grossTotal)}
            </Text>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="원천징수"
          view={
            <Space>
              <Text strong>{formatCurrency(result.taxAmount)}</Text>
              <Tag color="blue">{(result.taxRate * 100).toFixed(1)}%</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {result.taxRate === 0.033 ? '사업소득자' : '비사업소득자'}
              </Text>
            </Space>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="실지급액"
          view={
            <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
              {formatCurrency(result.netTotal)}
            </Text>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
