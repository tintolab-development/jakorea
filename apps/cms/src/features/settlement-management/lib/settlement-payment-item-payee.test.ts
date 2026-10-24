import { describe, expect, it } from 'vitest'
import type { SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import {
  filterProgramWagePaymentItemOptionsForPayees,
  GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES,
} from '@/features/settlement-management/lib/settlement-payment-item-payee'

const testSections: SettlementItemSettingSection[] = [
  {
    kind: 'payment',
    sectionTitle: '지급',
    items: [
      {
        id: 'pay-student-transport',
        title: '학생 교통비',
        description: '',
        iconKey: 'pay_transport',
        paymentItemType: 'TRANSPORT_STUDENT',
        eligiblePayeeTypes: ['STUDENT'],
      },
      {
        id: 'pay-participant-activity',
        title: '참여자 활동비',
        description: '',
        iconKey: 'pay_activity',
        paymentItemType: 'ACTIVITY',
        eligiblePayeeTypes: ['PARTICIPANT_INDIVIDUAL', 'PARTICIPANT_ORGANIZATION'],
      },
      {
        id: 'pay-lodging',
        title: '숙박비',
        description: '',
        iconKey: 'pay_lodging',
        paymentItemType: 'LODGING_GENERAL',
        eligiblePayeeTypes: ['INSTRUCTOR'],
      },
      {
        id: 'pay-instructor-transport',
        title: '강사 교통비',
        description: '',
        iconKey: 'pay_transport',
        paymentItemType: 'TRANSPORT_INSTRUCTOR',
        eligiblePayeeTypes: ['INSTRUCTOR'],
      },
      {
        id: 'pay-student-transport-policy',
        title: '학생 교통비(정책)',
        description: '',
        iconKey: 'pay_transport',
        paymentItemType: 'STUDENT_TRANSPORTATION',
      },
    ],
  },
]

describe('filterProgramWagePaymentItemOptionsForPayees — 지급 실행 자격 (프로그램 설정 UI에서는 사용하지 않음)', () => {
  const paymentSection = testSections.find(s => s.kind === 'payment')
  const options = (paymentSection?.items ?? []).map(item => ({
    value: item.id,
    label: item.title,
  }))

  it('hides instructor lodging for student/participant payees', () => {
    const filtered = filterProgramWagePaymentItemOptionsForPayees(
      options,
      testSections,
      GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES
    )
    const labels = filtered.map(o => o.label)
    expect(labels).toContain('학생 교통비')
    expect(labels).toContain('학생 교통비(정책)')
    expect(labels).toContain('참여자 활동비')
    expect(labels).not.toContain('숙박비')
    expect(labels).not.toContain('강사 교통비')
  })

  it('keeps instructor transport and lodging for INSTRUCTOR payee', () => {
    const filtered = filterProgramWagePaymentItemOptionsForPayees(
      options,
      testSections,
      ['INSTRUCTOR']
    )
    const labels = filtered.map(o => o.label)
    expect(labels).toContain('강사 교통비')
    expect(labels).toContain('숙박비')
    expect(labels).not.toContain('학생 교통비')
    expect(labels).not.toContain('학생 교통비(정책)')
  })
})
