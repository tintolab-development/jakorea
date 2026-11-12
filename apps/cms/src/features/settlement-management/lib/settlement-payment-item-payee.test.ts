import { describe, expect, it } from 'vitest'
import type { SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import {
  filterProgramWagePaymentItemOptionsForPayees,
  GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES,
  readPaymentItemEligiblePayeeTypes,
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
        title: '활동비',
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
    expect(labels).toContain('활동비')
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
  })

  it('eligiblePayeeTypes가 없는 행은 항목 유형으로 추론하지 않고 거르지 않는다', () => {
    const forInstructor = filterProgramWagePaymentItemOptionsForPayees(options, testSections, [
      'INSTRUCTOR',
    ]).map(o => o.label)
    const forParticipant = filterProgramWagePaymentItemOptionsForPayees(
      options,
      testSections,
      GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES
    ).map(o => o.label)
    expect(forInstructor).toContain('학생 교통비(정책)')
    expect(forParticipant).toContain('학생 교통비(정책)')
  })

  it('VOLUNTEER payee는 서버가 VOLUNTEER를 준 항목만 남긴다', () => {
    const sections: SettlementItemSettingSection[] = [
      {
        kind: 'payment',
        sectionTitle: '지급',
        items: [
          {
            id: 'pay-activity',
            title: '활동비',
            description: '',
            iconKey: 'pay_activity',
            paymentItemType: 'ACTIVITY',
            eligiblePayeeTypes: ['INSTRUCTOR', 'PARTICIPANT_INDIVIDUAL', 'VOLUNTEER'],
          },
          {
            id: 'pay-lodging',
            title: '숙박비',
            description: '',
            iconKey: 'pay_lodging',
            paymentItemType: 'LODGING_GENERAL',
            eligiblePayeeTypes: ['INSTRUCTOR'],
          },
        ],
      },
    ]
    const labels = filterProgramWagePaymentItemOptionsForPayees(
      [
        { value: 'pay-activity', label: '활동비' },
        { value: 'pay-lodging', label: '숙박비' },
      ],
      sections,
      ['VOLUNTEER']
    ).map(o => o.label)
    expect(labels).toEqual(['활동비'])
  })
})

describe('readPaymentItemEligiblePayeeTypes', () => {
  it('VOLUNTEER를 읽고 모르는 값은 버린다', () => {
    expect(
      readPaymentItemEligiblePayeeTypes({ eligiblePayeeTypes: ['volunteer', 'INSTRUCTOR', 'UNKNOWN'] })
    ).toEqual(['VOLUNTEER', 'INSTRUCTOR'])
  })
})
