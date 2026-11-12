import { describe, expect, it } from 'vitest'
import {
  INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL,
  INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION,
  INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO,
  INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS,
  INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION,
} from '@jakorea/form-schema/program-application'
import {
  createProgramApplicationFormInstructorDraft,
  migrateProgramApplicationFormInstructorParagraphs,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'

const CRIME_RECORD_ID = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord

describe('공통_강사 신청 폼 성범죄경력 조회 동의서 제출 방법 안내 단락 migration', () => {
  it('안내 본문·불릿·확인 문구가 Figma 시안과 같다', () => {
    expect(INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO).toBe(
      '기관 배정 시 마이페이지 > 해당 프로그램 상세에서 배정된 기관이 요청한 제출 방식을 꼭 확인해 주세요.'
    )
    expect(INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS).toEqual([
      {
        title: '온라인 제출 (기관이 온라인 제출을 요청한 경우)',
        body: '기관 안내사항에 적힌 기관 ID와 검증번호로 범죄경력회보서 사이트에서 온라인으로 제출해 주세요.',
      },
      {
        title: '직접 제출 (기관이 직접 제출을 요청한 경우)',
        body: '범죄경력회보서를 출력하여 배정된 기관에 직접 제출해 주세요.',
      },
    ])
    expect(INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION).toBe(
      '※ 기관이 ‘JA 시스템 내에서 동의서 확인’을 요청한 경우, 강사 신청 시 제출하신 성범죄경력 조회 동의서 및 행정정보 공동이용 동의서가 배정된 기관에 자동 전달되어 기관에서 직접 조회합니다.'
    )
    expect(INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL).toBe('네, 상기 내용 모두 확인하였습니다.')
  })

  it('시드는 새 제목과 빈 설명을 사용', () => {
    const paragraph = createProgramApplicationFormInstructorDraft().paragraphs.find(
      p => p.id === CRIME_RECORD_ID
    )
    expect(paragraph?.paragraphTitle).toBe('성범죄경력 조회 동의서 제출 방법 안내')
    expect(paragraph?.paragraphDescription).toBe('')
  })

  it('저장본의 이전 제목·설명을 현재 값으로 교체', () => {
    const draft = createProgramApplicationFormInstructorDraft()
    const legacy = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === CRIME_RECORD_ID
          ? {
              ...p,
              paragraphTitle: '성범죄 경력 조회서 제출',
              paragraphDescription: '학교에 전달할 성범죄 경력 조회서 파일을 제출해 주세요.',
            }
          : p
      ),
    }
    const migrated = migrateProgramApplicationFormInstructorParagraphs(legacy)
    const paragraph = migrated.paragraphs.find(p => p.id === CRIME_RECORD_ID)
    expect(paragraph?.paragraphTitle).toBe(INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION.title)
    expect(paragraph?.paragraphDescription).toBe(INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION.description)
  })

  it('API 로드(application-instructor) 시에도 이전 제목·설명을 교체', () => {
    const draft = createProgramApplicationFormInstructorDraft()
    const legacy = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === CRIME_RECORD_ID
          ? { ...p, paragraphTitle: '성범죄 경력 조회서 제출', paragraphDescription: '이전 설명' }
          : p
      ),
    }
    const loaded = normalizeWritingFormDraftFromApi('application-instructor', legacy)
    const paragraph = loaded.paragraphs.find(p => p.id === CRIME_RECORD_ID)
    expect(paragraph?.paragraphTitle).toBe(INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION.title)
    expect(paragraph?.paragraphDescription).toBe(INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION.description)
  })

  it('현재 값이면 단락 변경 없음', () => {
    const draft = createProgramApplicationFormInstructorDraft()
    expect(migrateProgramApplicationFormInstructorParagraphs(draft).paragraphs).toEqual(
      draft.paragraphs
    )
  })

  it('사용자가 수정한 제목·설명은 API 로드 후에도 유지', () => {
    const draft = createProgramApplicationFormInstructorDraft()
    const customized = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === CRIME_RECORD_ID
          ? {
              ...p,
              paragraphTitle: '맞춤 제목 — 제출 방법 안내',
              paragraphDescription: '운영팀 안내 문구',
            }
          : p
      ),
    }
    const migrated = migrateProgramApplicationFormInstructorParagraphs(customized)
    const loaded = normalizeWritingFormDraftFromApi('application-instructor', customized)
    const paragraph = migrated.paragraphs.find(p => p.id === CRIME_RECORD_ID)
    const loadedParagraph = loaded.paragraphs.find(p => p.id === CRIME_RECORD_ID)
    expect(paragraph?.paragraphTitle).toBe('맞춤 제목 — 제출 방법 안내')
    expect(paragraph?.paragraphDescription).toBe('운영팀 안내 문구')
    expect(loadedParagraph?.paragraphTitle).toBe('맞춤 제목 — 제출 방법 안내')
    expect(loadedParagraph?.paragraphDescription).toBe('운영팀 안내 문구')
  })
})
