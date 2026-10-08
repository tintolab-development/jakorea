import { describe, expect, it } from 'vitest'
import { INSTRUCTOR_CRIME_RECORD_GUIDE_SECTION } from '@jakorea/form-schema/program-application'
import {
  createProgramApplicationFormInstructorDraft,
  migrateProgramApplicationFormInstructorParagraphs,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'

const CRIME_RECORD_ID = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord

describe('공통_강사 신청 폼 성범죄경력 조회 동의서 제출 방법 안내 단락 migration', () => {
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
})
