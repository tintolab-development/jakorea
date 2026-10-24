import { describe, expect, it } from 'vitest'
import {
  omitRootRegistrationOverlay,
  resolveRegistrationOverlay,
  resolvedRegistrationOverlayOrUndefined,
} from './resolve-registration-overlay'

describe('resolveRegistrationOverlay', () => {
  it('nested overlay만 있으면 nested 값을 쓴다', () => {
    expect(
      resolveRegistrationOverlay({
        registration: {
          overlay: { 'generalRegistration.basicInfo.publicProgramTitle': '중첩 공고명' },
        },
      })
    ).toEqual({ 'generalRegistration.basicInfo.publicProgramTitle': '중첩 공고명' })
  })

  it('legacy root만 있으면 화면에 그 값을 쓴다', () => {
    expect(
      resolveRegistrationOverlay({
        registrationOverlay: {
          'generalRegistration.basicInfo.publicProgramTitle': '구버전 공고명',
        },
      })
    ).toEqual({ 'generalRegistration.basicInfo.publicProgramTitle': '구버전 공고명' })
  })

  it('nested와 root가 모두 있으면 nested가 우선한다', () => {
    expect(
      resolveRegistrationOverlay({
        registration: {
          overlay: { 'generalRegistration.basicInfo.publicProgramTitle': '중첩 값' },
        },
        registrationOverlay: {
          'generalRegistration.basicInfo.publicProgramTitle': '루트 값',
          'recruit.notes': '루트에만 있는 값',
        },
      })
    ).toEqual({
      'generalRegistration.basicInfo.publicProgramTitle': '중첩 값',
      'recruit.notes': '루트에만 있는 값',
    })
  })

  it('root에만 있는 추가 키는 nested 결과에 포함한다', () => {
    expect(
      resolveRegistrationOverlay({
        registration: { overlay: { a: 1 } },
        registrationOverlay: { b: 2 },
      })
    ).toEqual({ a: 1, b: 2 })
  })

  it('nested 값이 null이면 root로 fallback하지 않는다', () => {
    expect(
      resolveRegistrationOverlay({
        registration: { overlay: { 'economyRegistration.kpi.instructor': null } },
        registrationOverlay: { 'economyRegistration.kpi.instructor': 3 },
      })
    ).toEqual({ 'economyRegistration.kpi.instructor': null })
  })

  it('nested 값이 false, 0, [], {}이면 root로 fallback하지 않는다', () => {
    expect(
      resolveRegistrationOverlay({
        registration: {
          overlay: {
            flag: false,
            count: 0,
            items: [],
            map: {},
          },
        },
        registrationOverlay: {
          flag: true,
          count: 9,
          items: ['keep'],
          map: { stale: true },
        },
      })
    ).toEqual({
      flag: false,
      count: 0,
      items: [],
      map: {},
    })
  })

  it('detail이 없거나 overlay가 없으면 빈 객체다', () => {
    expect(resolveRegistrationOverlay(undefined)).toEqual({})
    expect(resolveRegistrationOverlay(null)).toEqual({})
    expect(resolveRegistrationOverlay({})).toEqual({})
    expect(resolvedRegistrationOverlayOrUndefined({})).toBeUndefined()
    expect(resolvedRegistrationOverlayOrUndefined(undefined)).toBeUndefined()
  })
})

describe('omitRootRegistrationOverlay', () => {
  it('루트 registrationOverlay를 제거하고 다른 필드는 보존한다', () => {
    expect(
      omitRootRegistrationOverlay({
        schemaVersion: 1,
        generalProgramEducationStructure: 'curriculum',
        registration: {
          overlay: { 'generalRegistration.basicInfo.publicProgramTitle': '새 공고명' },
        },
        registrationOverlay: {
          'generalRegistration.basicInfo.publicProgramTitle': '새 공고명',
        },
      })
    ).toEqual({
      schemaVersion: 1,
      generalProgramEducationStructure: 'curriculum',
      registration: {
        overlay: { 'generalRegistration.basicInfo.publicProgramTitle': '새 공고명' },
      },
    })
  })

  it('dotted overlay 키를 유지한다', () => {
    const overlay = {
      'recruit.volunteer.interview.selectedSlotKeys': ['a'],
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원' },
    }
    expect(
      omitRootRegistrationOverlay({
        registration: { overlay },
        other: true,
      })
    ).toEqual({
      registration: { overlay },
      other: true,
    })
  })
})
