import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { ADMIN_FILE_PURPOSE } from '@/shared/lib/admin-file-upload'
import {
  fetchProgramMediaThumbnail,
  hasProgramMediaTarget,
  isUjatTypedRecruitmentDraftProgram,
  resolveProgramMediaThumbnailUploadOwner,
} from '@/features/program/shared/api/program-media-target'

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

describe('resolveProgramMediaThumbnailUploadOwner', () => {
  it('UJAT 등록 초안은 가짜 programId 대신 ownerId null draft로 올린다', () => {
    expect(
      resolveProgramMediaThumbnailUploadOwner({
        id: 'ujat-local-draft',
        backendProgramType: 'UJAT',
      } as Program)
    ).toEqual({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: null,
      filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL,
    })
  })

  it('저장된 프로그램은 실제 programId를 넣는다', () => {
    expect(
      resolveProgramMediaThumbnailUploadOwner({
        id: '186076',
        backendProgramType: 'UJAT',
      } as Program)
    ).toMatchObject({
      ownerId: 186076,
      filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL,
    })
  })
})

describe('isUjatTypedRecruitmentDraftProgram', () => {
  it('등록 위저드 초안만 typed 미디어 SSOT로 본다', () => {
    expect(
      isUjatTypedRecruitmentDraftProgram({
        id: 'ujat-registration-linked',
        backendProgramType: 'UJAT',
      } as Program)
    ).toBe(true)
    expect(hasProgramMediaTarget({ id: 'ujat-registration-linked' } as Program)).toBe(false)
    expect(
      isUjatTypedRecruitmentDraftProgram({
        id: '186076',
        backendProgramType: 'UJAT',
      } as Program)
    ).toBe(false)
  })
})
