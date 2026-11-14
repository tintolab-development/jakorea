import { describe, expect, it } from 'vitest'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { RECRUIT_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/recruit-form-instructor-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { buildOperationalImmutableFormSchemaDraft } from '@/features/template/lib/operational-form-schema-copy-merge'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'

describe('buildOperationalImmutableFormSchemaDraft', () => {
  it('모집 강사 시드 구조를 유지하고 단락 타이틀·설명만 에디터 값으로 반영한다', () => {
    const seed = createRecruitFormInstructorDraft()
    const targetId = seed.paragraphs[0]?.id
    expect(targetId).toBeTruthy()

    const editorDraft = {
      ...seed,
      paragraphs: seed.paragraphs.map(p =>
        p.id === targetId
          ? { ...p, paragraphTitle: '맞춤 모집 안내', paragraphDescription: '맞춤 설명' }
          : p
      ),
    }

    const merged = buildOperationalImmutableFormSchemaDraft({
      templateCode: 'recruitment-instructor-custom-01',
      editorDraft,
      baseTemplateCode: 'recruitment-instructor',
    })
    expect(merged).not.toBeNull()

    const paragraph = merged!.paragraphs.find(p => p.id === targetId)
    expect(paragraph?.paragraphTitle).toBe('맞춤 모집 안내')
    expect(paragraph?.paragraphDescription).toBe('맞춤 설명')

    const seedParagraph = seed.paragraphs.find(p => p.id === targetId)!
    expect(paragraph?.kind).toBe(seedParagraph.kind)
    expect(paragraph?.variant).toBe(seedParagraph.variant)
  })

  it('개인 참여 신청 COPY — 표 값은 에디터 입력을 보내고, baseline에 없는 키만 뺀다', () => {
    const seed = createProgramParticipantApplicationDraft()
    const thirdPartyId = PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
    const selfIntroId = PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro
    const editorDraft = JSON.parse(JSON.stringify(seed)) as typeof seed
    const editorThird = editorDraft.paragraphs.find(p => p.id === thirdPartyId)
    if (
      editorThird?.kind === 'single_item' &&
      editorThird.variant === 'horizontal_table' &&
      editorThird.fieldDataRows?.[0]?.[0]
    ) {
      editorThird.fieldDataRows[0][0] = { kind: 'text', value: 'JA코리아' }
    }
    editorDraft.paragraphs = editorDraft.paragraphs.map(p =>
      p.id === selfIntroId ? { ...p, maxLength: 2000 } : p
    )

    const merged = buildOperationalImmutableFormSchemaDraft({
      templateCode: 'application-participant-individual-copy-1',
      editorDraft,
      baseTemplateCode: 'application-participant-individual',
      catalogBaseline: seed,
    })
    const third = merged?.paragraphs.find(p => p.id === thirdPartyId)
    const selfIntro = merged?.paragraphs.find(p => p.id === selfIntroId)
    expect(
      third?.kind === 'single_item' && third.variant === 'horizontal_table'
        ? third.fieldDataRows?.[0]?.[0]
        : null
    ).toEqual({ kind: 'text', value: 'JA코리아' })
    expect('maxLength' in (selfIntro ?? {})).toBe(false)
  })

  it('개인 참여 신청 COPY — short_essay maxLength 등 시드에 없는 키는 PUT에 넣지 않는다', () => {
    const seed = createProgramParticipantApplicationDraft()
    const selfIntroId = PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro
    const editorDraft = {
      ...seed,
      paragraphs: [
        ...seed.paragraphs.map(p =>
          p.id === selfIntroId
            ? {
                ...p,
                paragraphTitle: '자기소개 수정',
                maxLength: 2000,
                items: [{ id: 'x', label: 'leak', placeholder: '', bodyText: '' }],
              }
            : p
        ),
        {
          ...seed.paragraphs[0]!,
          id: 'program-participant-application-seed-interview-schedule',
          paragraphTitle: '면접 진행 가능 일정',
        },
      ],
    }

    const merged = buildOperationalImmutableFormSchemaDraft({
      templateCode: 'application-participant-individual-copy-1',
      editorDraft,
      baseTemplateCode: 'application-participant-individual',
    })
    const selfIntro = merged?.paragraphs.find(p => p.id === selfIntroId)
    expect(selfIntro?.paragraphTitle).toBe('자기소개 수정')
    expect('maxLength' in (selfIntro ?? {})).toBe(false)
    expect('items' in (selfIntro ?? {})).toBe(false)
    const leaked = merged!.paragraphs.find(p =>
      p.id.includes('interview-schedule')
    )
    expect(leaked).toBeUndefined()
  })

  it('API normalize 시 모집 양식 카피를 시드 위에 병합한다', () => {
    const seed = createRecruitFormInstructorDraft()
    const detailInfo = seed.paragraphs.find(
      p => p.id === RECRUIT_FORM_INSTRUCTOR_IDS.detailInfo
    )
    expect(detailInfo).toBeTruthy()

    const fromApi = {
      ...seed,
      paragraphs: seed.paragraphs.map(p =>
        p.id === RECRUIT_FORM_INSTRUCTOR_IDS.detailInfo
          ? { ...p, paragraphTitle: '상세 정보 — 수정', paragraphDescription: '설명 수정' }
          : p
      ),
    }

    const loaded = normalizeWritingFormDraftFromApi(
      'recruitment-instructor-custom-99',
      fromApi,
      'recruitment-instructor'
    )
    const loadedParagraph = loaded.paragraphs.find(
      p => p.id === RECRUIT_FORM_INSTRUCTOR_IDS.detailInfo
    )
    expect(loadedParagraph?.paragraphTitle).toBe('상세 정보 — 수정')
    expect(loadedParagraph?.paragraphDescription).toBe('설명 수정')
  })

  it('UJAT 봉사자 신청 COPY — 제출 확인 선택지 구조는 카탈로그를 유지한다', () => {
    const seed = createUjatProgramApplicationFormVolunteerDraft()
    const submitId = UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation
    const seedParagraph = seed.paragraphs.find(p => p.id === submitId)
    expect(seedParagraph).toBeTruthy()

    const editorDraft = {
      ...seed,
      paragraphs: seed.paragraphs.map(p =>
        p.id === submitId && p.kind === 'single_item' && p.variant === 'multiple_choice'
          ? {
              ...p,
              paragraphTitle: '제출 확인 안내 수정',
              items: p.items.map(item => ({
                ...item,
                label: `${item.label} 31기로 지원합니다.`,
              })),
            }
          : p
      ),
    }

    const merged = buildOperationalImmutableFormSchemaDraft({
      templateCode: 'application-ujat-volunteer-copy-1',
      editorDraft,
      baseTemplateCode: 'application-ujat-volunteer',
      catalogBaseline: seed,
    })
    const mergedParagraph = merged?.paragraphs.find(p => p.id === submitId)
    expect(mergedParagraph?.paragraphTitle).toBe('제출 확인 안내 수정')
    expect(
      mergedParagraph?.kind === 'single_item' && mergedParagraph.variant === 'multiple_choice'
        ? mergedParagraph.items
        : null
    ).toEqual(
      seedParagraph?.kind === 'single_item' && seedParagraph.variant === 'multiple_choice'
        ? seedParagraph.items
        : null
    )
  })

  it('서버 저장본에 남은 예전 시드 설명은 현재 시드 문구로 바꾸고, 관리자가 고친 설명은 유지한다', () => {
    const seed = createUjatRecruitFormVolunteerDraft()
    const recruitInfoId = 'ujat-recruit-form-volunteer-seed-recruit-info'
    const detailId = 'ujat-recruit-form-volunteer-seed-detail-info'
    const editorDraft = {
      ...seed,
      paragraphs: seed.paragraphs.map(p => {
        if (p.id === recruitInfoId) {
          return {
            ...p,
            paragraphDescription:
              '봉사자 모집은 프로그램 등록 시 상반기/하반기 구분되어 진행되며, 양식 내용은 동일하게 노출됩니다. (모집 공고 노출 시점은 하반기 모집 폼에서만 노출됩니다.)',
          }
        }
        if (p.id === detailId) return { ...p, paragraphDescription: '관리자가 고친 설명' }
        return p
      }),
    }
    const merged = buildOperationalImmutableFormSchemaDraft({
      templateCode: 'recruitment-ujat-volunteer',
      editorDraft,
    })
    const byId = new Map(merged?.paragraphs.map(p => [p.id, p]))
    expect(byId.get(recruitInfoId)?.paragraphDescription).toBe('설명 입력')
    expect(byId.get(detailId)?.paragraphDescription).toBe('관리자가 고친 설명')
  })
})
