import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { fetchProgramMediaThumbnail } from '@/features/program/shared/api/program-media-target'

describe('fetchProgramMediaThumbnail', () => {
  it('모집 행 썸네일은 GET에 파일명이 없어도 overlay 파일명을 쓴다', async () => {
    const thumbnail = await fetchProgramMediaThumbnail({
      id: '186076',
      backendProgramType: 'GENERAL_INDIVIDUAL',
      activeRecruitmentId: 186150,
      programRecruitments: [{ id: 186150, thumbnailFileObjectId: 2055850 }],
      registrationOverlay: {
        'recruit.detailInfo.thumbFileObjectId': 2055850,
        'recruit.detailInfo.thumbFileName':
          'KakaoTalk_Photo_2026-09-23-15-45-05 (1) (1).jpeg',
      },
    } as unknown as Program)

    expect(thumbnail.fileObjectId).toBe(2055850)
    expect(thumbnail.originalFileName).toBe(
      'KakaoTalk_Photo_2026-09-23-15-45-05 (1) (1).jpeg'
    )
  })
})
