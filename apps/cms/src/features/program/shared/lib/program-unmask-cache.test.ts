import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  cacheProjectedProgramPrivacy,
  evictProgramUnmaskDetailCaches,
  resetTrackedProgramUnmaskCaches,
} from './program-my-assignment'

const rawDto = { id: 1, teacherName: '김선생', teacherPhone: '010-1234-5678' }

describe('신청 상세 원문 캐시 정리 (CMS-29)', () => {
  it('다시 가리기 시 programId 없는 상세 키까지 원문을 비운다', async () => {
    const client = new QueryClient()
    const orgKey = generalApplicationsQueryKeys.organizationDetail('501')
    const inProgramKey = generalApplicationsQueryKeys.organizationDetailInProgram('77', '501')
    cacheProjectedProgramPrivacy(client, orgKey, 77, rawDto)
    cacheProjectedProgramPrivacy(client, inProgramKey, 77, rawDto)
    expect(client.getQueryData(orgKey)).toMatchObject({ teacherPhone: '010-1234-5678' })

    resetTrackedProgramUnmaskCaches(77)
    await Promise.resolve()

    expect(client.getQueryData(orgKey)).toBeUndefined()
    expect(client.getQueryData(inProgramKey)).toBeUndefined()
  })

  it('다른 프로그램의 원문 캐시는 건드리지 않는다', () => {
    const client = new QueryClient()
    const keyA = generalApplicationsQueryKeys.instructorDetail('11')
    const keyB = generalApplicationsQueryKeys.individualDetail('22')
    cacheProjectedProgramPrivacy(client, keyA, 1, rawDto)
    cacheProjectedProgramPrivacy(client, keyB, 2, rawDto)

    resetTrackedProgramUnmaskCaches(1)

    expect(client.getQueryData(keyA)).toBeUndefined()
    expect(client.getQueryData(keyB)).toMatchObject({ teacherPhone: '010-1234-5678' })
    resetTrackedProgramUnmaskCaches(2)
  })

  it('권한 회수 정리도 programId 없는 상세 키를 제거한다', () => {
    const client = new QueryClient()
    const key = generalApplicationsQueryKeys.individualDetail('33')
    cacheProjectedProgramPrivacy(client, key, 5, rawDto)

    evictProgramUnmaskDetailCaches(5)

    expect(client.getQueryCache().find({ queryKey: key, exact: true })).toBeUndefined()
  })
})
