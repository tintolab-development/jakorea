import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  fetchProgramMaterialCandidates,
  fetchProgramMaterials,
  saveProgramMaterials,
} from './program-materials-api-client'

describe('program materials API client', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('assignmentStatus를 최종 표시값으로 유지한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: {
        programId: 186101,
        assignmentStatus: 'NONE',
        noneYn: true,
        items: [],
      },
    })

    await expect(fetchProgramMaterials('186101')).resolves.toEqual({
      programId: 186101,
      assignmentStatus: 'NONE',
      noneYn: true,
      items: [],
    })
  })

  it('material-candidates는 배열 및 items 응답을 모두 읽는다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { items: [{ textbookId: 12, kitId: 2 }] },
    })

    await expect(fetchProgramMaterialCandidates('186101')).resolves.toEqual([
      { textbookId: 12, kitId: 2 },
    ])
  })

  it('저장 요청은 서버가 계산할 수 있도록 전달값을 그대로 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { programId: 186101, assignmentStatus: 'UNDECIDED', noneYn: false, items: [] },
    })

    await saveProgramMaterials('186101', {
      noneYn: false,
      items: [],
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/186101/materials',
      method: 'PUT',
      data: { noneYn: false, items: [] },
    })
  })
})
