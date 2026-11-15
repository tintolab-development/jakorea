import { describe, expect, it } from 'vitest'
import {
  buildUjatInstitutionInfoUpdateRequest,
  hasUjatInstitutionInfoUpdateFields,
} from './application-info-update'

const baselineContact = {
  teacherName: '김제이',
  tel: '02-123-4567',
  mobile: '010-1234-5678',
  email: 'teacher@example.com',
}

describe('buildUjatInstitutionInfoUpdateRequest', () => {
  it('바뀐 값이 없으면 빈 요청을 만든다', () => {
    const body = buildUjatInstitutionInfoUpdateRequest({
      addressDetailDraft: '1층 교무실',
      addressDetailBaseline: '1층 교무실',
      teacherContactDraft: baselineContact,
      teacherContactBaseline: baselineContact,
    })
    expect(body).toEqual({})
    expect(hasUjatInstitutionInfoUpdateFields(body)).toBe(false)
  })

  it('상세 주소·연락처 중 바뀐 키만 보내고 Tel/M을 API 필드에 맞게 넣는다', () => {
    const body = buildUjatInstitutionInfoUpdateRequest({
      addressDetailDraft: ' 2층 행정실 ',
      addressDetailBaseline: '1층 교무실',
      teacherContactDraft: { ...baselineContact, tel: '02-999-0000', mobile: '010-0000-1111' },
      teacherContactBaseline: baselineContact,
    })
    expect(body).toEqual({
      organizationAddressDetail: '2층 행정실',
      teacherTel: '02-999-0000',
      teacherPhone: '010-0000-1111',
    })
  })

  it('비운 상세 주소는 null로 보내고, 마스킹된 연락처는 보내지 않는다', () => {
    const masked = { ...baselineContact, mobile: '010-****-5678', email: 't*****@example.com' }
    const body = buildUjatInstitutionInfoUpdateRequest({
      addressDetailDraft: '  ',
      addressDetailBaseline: '1층 교무실',
      teacherContactDraft: masked,
      teacherContactBaseline: masked,
    })
    expect(body).toEqual({ organizationAddressDetail: null })
  })

  it('담당 교사 이름 변경은 요청에 넣지 않는다', () => {
    const body = buildUjatInstitutionInfoUpdateRequest({
      addressDetailDraft: '1층 교무실',
      addressDetailBaseline: '1층 교무실',
      teacherContactDraft: { ...baselineContact, teacherName: '박제이' },
      teacherContactBaseline: baselineContact,
    })
    expect(body).toEqual({})
  })
})
