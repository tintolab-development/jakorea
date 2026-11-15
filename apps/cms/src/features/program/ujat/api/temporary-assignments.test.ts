import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())
const moduleEnabled = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/orval-mutator', () => ({
  default: request,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: moduleEnabled,
}))

import {
  assignUjatOrganizationApplicationsTemporarilyIfRemote,
  buildTemporaryAssignmentFailureLines,
  cancelUjatOrganizationTemporaryAssignmentsIfRemote,
  normalizeTemporaryAssignmentBulkResponse,
  readTemporaryScheduleAssigned,
} from './temporary-assignments'

const PARTIAL_RESPONSE = {
  requestedCount: 2,
  successCount: 1,
  failureCount: 1,
  processed: [
    {
      applicationId: 123,
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      temporaryScheduleAssigned: false,
    },
  ],
  failures: [
    {
      applicationId: 124,
      code: 'UJAT_TEMPORARY_ASSIGNMENT_STATUS_NOT_ALLOWED',
      message: '평가 대기 상태가 아닌 신청기관은 임시 배정할 수 없습니다.',
    },
  ],
}

describe('UJAT 임시 배정 POST', () => {
  beforeEach(() => {
    request.mockReset()
    moduleEnabled.mockReset()
    moduleEnabled.mockReturnValue(true)
  })

  it('단건·일괄 모두 temporary-assignments에 applicationIds만 보낸다', async () => {
    request.mockResolvedValue({ success: true, data: PARTIAL_RESPONSE })

    const response = await assignUjatOrganizationApplicationsTemporarilyIfRemote({
      programId: '186330',
      applicationIds: ['123', '124'],
    })

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186330/ujat/organization-applications/temporary-assignments',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { applicationIds: [123, 124] },
    })
    expect(response?.successCount).toBe(1)
    expect(response?.processed[0]).toEqual({
      applicationId: 123,
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      temporaryScheduleAssigned: false,
    })
    expect(response?.failures[0]?.code).toBe('UJAT_TEMPORARY_ASSIGNMENT_STATUS_NOT_ALLOWED')
  })

  it('임시 배정 취소는 temporary-assignments:cancel을 쓴다(temporary-rejections:cancel 아님)', async () => {
    request.mockResolvedValue({
      success: true,
      data: {
        requestedCount: 1,
        successCount: 1,
        failureCount: 0,
        processed: [
          {
            applicationId: 123,
            temporaryAssignmentStatus: 'EVALUATION_PENDING',
            temporaryScheduleAssigned: null,
          },
        ],
        failures: [],
      },
    })

    const response = await cancelUjatOrganizationTemporaryAssignmentsIfRemote({
      programId: 186330,
      applicationIds: [123],
    })

    const url = request.mock.calls[0]?.[0]?.url as string
    expect(url).toBe(
      '/api/admin/programs/186330/ujat/organization-applications/temporary-assignments:cancel'
    )
    expect(url).not.toContain('temporary-rejections')
    expect(response?.processed[0]?.temporaryAssignmentStatus).toBe('EVALUATION_PENDING')
    expect(response?.processed[0]?.temporaryScheduleAssigned).toBeNull()
  })

  it('원격 모듈이 꺼져 있으면 호출하지 않고 null을 돌려준다', async () => {
    moduleEnabled.mockReturnValue(false)

    const response = await assignUjatOrganizationApplicationsTemporarilyIfRemote({
      programId: '186330',
      applicationIds: ['123'],
    })

    expect(response).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it('전체 400/403은 그대로 throw해 화면의 기존 오류 안내로 넘긴다', async () => {
    const error = {
      response: {
        status: 403,
        data: { success: false, error: { code: 'PERMISSION_DENIED', message: '권한이 없습니다.' } },
      },
    }
    request.mockRejectedValue(error)

    await expect(
      assignUjatOrganizationApplicationsTemporarilyIfRemote({
        programId: '186330',
        applicationIds: ['123'],
      })
    ).rejects.toBe(error)
  })
})

describe('normalizeTemporaryAssignmentBulkResponse', () => {
  it('processed·failures가 빠져도 빈 배열로 읽는다', () => {
    expect(normalizeTemporaryAssignmentBulkResponse({ requestedCount: 1, successCount: 0 })).toEqual({
      requestedCount: 1,
      successCount: 0,
      failureCount: 0,
      processed: [],
      failures: [],
    })
  })
})

describe('buildTemporaryAssignmentFailureLines', () => {
  it('failures[].message를 그대로 쓰고 일괄이면 기관명만 앞에 붙인다', () => {
    const response = normalizeTemporaryAssignmentBulkResponse(PARTIAL_RESPONSE)

    expect(
      buildTemporaryAssignmentFailureLines(response.failures, { fallback: '실패' })
    ).toEqual(['평가 대기 상태가 아닌 신청기관은 임시 배정할 수 없습니다.'])
    expect(
      buildTemporaryAssignmentFailureLines(response.failures, {
        namesById: { '124': 'B초' },
        fallback: '실패',
      })
    ).toEqual(['· B초: 평가 대기 상태가 아닌 신청기관은 임시 배정할 수 없습니다.'])
  })
})

describe('readTemporaryScheduleAssigned', () => {
  it('boolean만 읽고 없거나 다른 값이면 null', () => {
    expect(readTemporaryScheduleAssigned({ temporaryScheduleAssigned: false })).toBe(false)
    expect(readTemporaryScheduleAssigned({ temporaryScheduleAssigned: true })).toBe(true)
    expect(readTemporaryScheduleAssigned({ temporaryScheduleAssigned: null })).toBeNull()
    expect(readTemporaryScheduleAssigned({})).toBeNull()
  })
})
