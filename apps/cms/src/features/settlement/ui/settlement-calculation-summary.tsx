/**
 * 정산 산출내역 요약 컴포넌트
 * Phase 0.4.1: 강사 정산 신청 (FR-G01)
 */

import { Descriptions, Tag, Typography, Space } from 'antd'
import type { SettlementCalculationResult } from '@/entities/settlement/lib/settlement-calculation'

const { Text } = Typography

interface SettlementCalculationSummaryProps {
  result: SettlementCalculationResult
}

/**
 * 금액 포맷팅
 */
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
    <Descriptions bordered column={1} size="middle">
      <Descriptions.Item label="강사료">
        <Space>
          <Text strong>{formatCurrency(result.instructorFee)}</Text>
          {result.breakdown.isLongDistance && (
            <Tag color="orange">장거리 가산</Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({result.breakdown.sessions}차시)
          </Text>
        </Space>
      </Descriptions.Item>
      
      <Descriptions.Item label="교통비">
        {result.breakdown.transportFeeApplicable ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{formatCurrency(result.transportFee)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              주유비 {formatCurrency(result.breakdown.fuelCost)} + 통행료 {formatCurrency(result.breakdown.tollFee)}
            </Text>
            {!result.breakdown.transportFeeApplicable && (
              <Tag color="default" style={{ fontSize: 11 }}>
                60km 이하로 교통비 미지급
              </Tag>
            )}
          </Space>
        ) : (
          <Space>
            <Text type="secondary">-</Text>
            <Tag color="default" style={{ fontSize: 11 }}>
              60km 이하로 교통비 미지급
            </Tag>
          </Space>
        )}
      </Descriptions.Item>
      
      <Descriptions.Item label="숙박비">
        {result.accommodationFee > 0 ? (
          <Text strong>{formatCurrency(result.accommodationFee)}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )}
      </Descriptions.Item>
      
      <Descriptions.Item label="총액 (세전)">
        <Text strong style={{ fontSize: 16 }}>
          {formatCurrency(result.grossTotal)}
        </Text>
      </Descriptions.Item>
      
      <Descriptions.Item label="원천징수">
        <Space>
          <Text strong>{formatCurrency(result.taxAmount)}</Text>
          <Tag color="blue">
            {(result.taxRate * 100).toFixed(1)}%
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {result.taxRate === 0.033 ? '사업소득자' : '비사업소득자'}
          </Text>
        </Space>
      </Descriptions.Item>
      
      <Descriptions.Item label="실지급액">
        <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
          {formatCurrency(result.netTotal)}
        </Text>
      </Descriptions.Item>
    </Descriptions>
  )
}
