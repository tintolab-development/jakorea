import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllRecruitDetailDraftMedia,
  clearRecruitDetailDraftMedia,
  peekRecruitDetailDraftMedia,
  persistRecruitDetailDraftMedia,
  persistRecruitDetailDraftMediaFromOverlay,
  recruitDetailDraftMediaRestorePatch,
  setRecruitDetailDraftMediaSessionStoreForTests,
} from './recruit-detail-draft-media-session'

function memorySession() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
  }
}

describe('recruit-detail-draft-media-session', () => {
  beforeEach(() => {
    setRecruitDetailDraftMediaSessionStoreForTests(memorySession())
  })

  afterEach(() => {
    setRecruitDetailDraftMediaSessionStoreForTests(undefined)
  })

  it('업로드 성공 값을 기록하고 같은 scope/prefix에서 읽는다', () => {
    persistRecruitDetailDraftMedia('recruitment-instructor', 'recruitInstructor.detailInfo', {
      thumbFileObjectId: 42,
      thumbFileName: 'poster.png',
      attachmentFileObjectIds: [7, 8],
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    })
    expect(
      peekRecruitDetailDraftMedia('recruitment-instructor', 'recruitInstructor.detailInfo')
    ).toEqual({
      thumbFileObjectId: 42,
      thumbFileName: 'poster.png',
      attachmentFileObjectIds: [7, 8],
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    })
    expect(peekRecruitDetailDraftMedia('recruitment-participant-individual', 'recruit.detailInfo')).toBeNull()
  })

  it('overlay가 비어 있을 때만 restore patch를 만든다', () => {
    persistRecruitDetailDraftMedia('recruitment-participant-individual', 'recruit.detailInfo', {
      thumbFileObjectId: 9,
      thumbFileName: 'thumb.jpg',
    })
    expect(
      recruitDetailDraftMediaRestorePatch('recruitment-participant-individual', 'recruit.detailInfo', {})
    ).toMatchObject({
      'recruit.detailInfo.thumbFileObjectId': 9,
      'recruit.detailInfo.thumbFileName': 'thumb.jpg',
    })
    expect(
      recruitDetailDraftMediaRestorePatch('recruitment-participant-individual', 'recruit.detailInfo', {
        'recruit.detailInfo.thumbFileObjectId': 88,
      })
    ).toBeNull()
  })

  it('overlay에서 읽어 저장하고 삭제하면 비운다', () => {
    persistRecruitDetailDraftMediaFromOverlay('s', 'recruit.detailInfo', {
      'recruit.detailInfo.thumbFileObjectId': 15,
      'recruit.detailInfo.thumbFileName': 'x.png',
    })
    expect(peekRecruitDetailDraftMedia('s', 'recruit.detailInfo')?.thumbFileObjectId).toBe(15)
    clearRecruitDetailDraftMedia('s', 'recruit.detailInfo')
    expect(peekRecruitDetailDraftMedia('s', 'recruit.detailInfo')).toBeNull()
  })

  it('위저드 종료 시 전부 삭제한다', () => {
    persistRecruitDetailDraftMedia('a', 'recruit.detailInfo', { thumbFileObjectId: 1 })
    persistRecruitDetailDraftMedia('b', 'recruitInstructor.detailInfo', { thumbFileObjectId: 2 })
    clearAllRecruitDetailDraftMedia()
    expect(peekRecruitDetailDraftMedia('a', 'recruit.detailInfo')).toBeNull()
    expect(peekRecruitDetailDraftMedia('b', 'recruitInstructor.detailInfo')).toBeNull()
  })
})
