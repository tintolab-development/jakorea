import { describe, expect, it } from 'vitest'
import { formatNotificationFailedReason } from './format-notification-failed-reason'
import { isNotificationCatalogVariableDisabled } from './catalog-variable-disabled'
import { buildNotificationTemplateVariablesQuery } from './template-variables-query'
import { NOTIFICATION_TEMPLATE_VARIABLES_QA_FIXTURE } from './notification-template-variables-qa-fixture'

const { programId, keys } = NOTIFICATION_TEMPLATE_VARIABLES_QA_FIXTURE

describe('QA fixture contract (template-variables enabled SSOT)', () => {
  it('builds PARTICIPANT query for seeded program', () => {
    expect(
      buildNotificationTemplateVariablesQuery({
        programId,
        recipientTypeMode: 'participation',
        typeValue: 'participant',
        toParticipantTypeApi: value =>
          value === 'participant' ? 'PARTICIPANT' : undefined,
        toMemberTypeApi: () => undefined,
      })
    ).toEqual({ programId, participantType: 'PARTICIPANT' })
  })

  it('disables catalog items when BE enabled=false (no local recalculation)', () => {
    expect(
      isNotificationCatalogVariableDisabled(
        { enabled: false, requiresProgram: true },
        programId
      )
    ).toBe(true)
    expect(
      isNotificationCatalogVariableDisabled(
        { enabled: true, requiresProgram: true },
        programId
      )
    ).toBe(false)
  })

  it('formats missing-variable failure with fixture key', () => {
    expect(
      formatNotificationFailedReason(
        `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:${keys.classTime}`
      )
    ).toBe(`템플릿 필수 변수가 없습니다: ${keys.classTime}`)
  })
})
