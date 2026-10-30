import { describe, expect, it } from 'vitest'
import { resolveCatalogOriginalSaveRestrictionNotice } from './template-preview-modal-editor'

describe('resolveCatalogOriginalSaveRestrictionNotice', () => {
  it('기본 등록 양식은 등록 안내를 띄운다', () => {
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({ templateId: 'registration-general' })
    ).toEqual({
      title: '양식 수정 제한 안내',
      content: '등록 양식은 항목 추가 및 삭제, 수정이 불가합니다.',
    })
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({ templateId: 'registration-ujat' })?.content
    ).toBe('등록 양식은 항목 추가 및 삭제, 수정이 불가합니다.')
  })

  it('기본 모집 양식은 모집 안내를 줄바꿈 그대로 띄운다', () => {
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({
        templateId: 'recruitment-participant-individual',
      })
    ).toEqual({
      title: '양식 수정 제한 안내',
      content:
        '모집 폼 기본 양식은 항목 추가 및 삭제, 수정이 불가합니다.\n신규 템플릿 생성으로 복사본 생성 후 수정해주세요.',
    })
  })

  it('기본 신청 양식은 신청 안내를 줄바꿈 그대로 띄운다', () => {
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({ templateId: 'application-participant-school' })
    ).toEqual({
      title: '양식 수정 제한 안내',
      content:
        '신청 폼 기본 양식은 항목 추가 및 삭제, 수정이 불가합니다.\n신규 템플릿 생성으로 복사본 생성 후 수정해주세요.',
    })
  })

  it('복사본·사용자 등록 모드·다른 분류는 안내 없이 기존 저장', () => {
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({
        templateId: 'recruitment-participant-individual-copy-2',
      })
    ).toBeNull()
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({ templateId: 'application-volunteer-custom-01' })
    ).toBeNull()
    expect(
      resolveCatalogOriginalSaveRestrictionNotice({
        templateId: 'registration-general',
        registrationUserMode: true,
      })
    ).toBeNull()
    expect(resolveCatalogOriginalSaveRestrictionNotice({ templateId: undefined })).toBeNull()
  })
})
