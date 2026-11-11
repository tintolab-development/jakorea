import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import {
  draftToBasicInfoPatch,
  userToAdminProvisionedBasicDraft,
} from './admin-provisioned-member-basic-info-draft'
import {
  mapAdminProfileFormToBasicInfoDraftPartial,
  mapUserToAdminProfileFormValues,
} from './map-user-to-admin-profile-form'
import {
  mapInstructorProfileFormToBasicInfoDraftPartial,
  mapUserToInstructorProfileFormValues,
} from './map-user-to-instructor-profile-form'
import { genderPatchValue, toProfileFormGender } from './profile-form-gender'

type MemberUser = Omit<User, 'password'>
function member(gender: string | undefined, role: User['role'] = 'ADMIN'): MemberUser {
  return {
    id: 'u-1',
    memberId: 1,
    role,
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'hong@example.test',
    birthDate: '1990-01-15',
    gender,
  } as unknown as MemberUser
}

describe('수정 폼 성별 — 추정·덮어쓰기 금지 (Step 6.1 P1)', () => {
  it.each([[undefined], [''], ['**'], ['-'], ['UNKNOWN']])(
    '미등록·마스킹 성별 %s 은 폼에서 선택되지 않는다(남성 추정 없음)',
    gender => {
      expect(toProfileFormGender(gender)).toBeUndefined()
      expect(mapUserToAdminProfileFormValues(member(gender)).gender).toBeUndefined()
      expect(mapUserToInstructorProfileFormValues(member(gender, 'INSTRUCTOR'), null).gender).toBeUndefined()
    }
  )

  it('실제 성별은 그대로 폼에 들어간다', () => {
    expect(mapUserToAdminProfileFormValues(member('여성')).gender).toBe('female')
    expect(mapUserToAdminProfileFormValues(member('MALE')).gender).toBe('male')
  })

  it('미등록 성별 폼을 그대로 저장하면 draft 성별은 비어 있고 payload에 성별이 없다', () => {
    const values = mapUserToAdminProfileFormValues(member('**'))
    expect(mapAdminProfileFormToBasicInfoDraftPartial(values).gender).toBe('')
    const instructorValues = mapUserToInstructorProfileFormValues(member(undefined, 'INSTRUCTOR'), null)
    expect(mapInstructorProfileFormToBasicInfoDraftPartial(instructorValues).gender).toBe('')

    const draft = userToAdminProvisionedBasicDraft(member('**'))
    expect(draft.gender).toBe('')
    expect(draftToBasicInfoPatch(draft)).not.toHaveProperty('gender', expect.anything())
    expect(draftToBasicInfoPatch(draft).gender).toBeUndefined()
  })

  it('기존 성별을 바꾸지 않고 저장하면 payload에 성별을 보내지 않는다', () => {
    const draft = userToAdminProvisionedBasicDraft(member('남성'))
    const formPartial = mapAdminProfileFormToBasicInfoDraftPartial(mapUserToAdminProfileFormValues(member('남성')))
    expect(draftToBasicInfoPatch({ ...draft, ...formPartial }).gender).toBeUndefined()
  })

  it('사용자가 성별을 명시적으로 바꾼 경우에만 변경값을 보낸다', () => {
    const draft = userToAdminProvisionedBasicDraft(member('남성'))
    const values = { ...mapUserToAdminProfileFormValues(member('남성')), gender: 'female' as const }
    expect(draftToBasicInfoPatch({ ...draft, ...mapAdminProfileFormToBasicInfoDraftPartial(values) }).gender).toBe('여성')

    const unknownDraft = userToAdminProvisionedBasicDraft(member(undefined))
    const chosen = { ...mapUserToAdminProfileFormValues(member(undefined)), gender: 'male' as const }
    expect(
      draftToBasicInfoPatch({ ...unknownDraft, ...mapAdminProfileFormToBasicInfoDraftPartial(chosen) }).gender
    ).toBe('남성')
  })

  it('genderPatchValue: 빈 값·원래 값과 같으면 보내지 않는다', () => {
    expect(genderPatchValue('', '')).toBeUndefined()
    expect(genderPatchValue('남성', '남성')).toBeUndefined()
    expect(genderPatchValue('여성', '남성')).toBe('여성')
  })
})
