import assert from 'node:assert/strict'
import { createUjatProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { preparePortalUjatApplicationDraft } from './ujat-application-fill-placeholders.ts'

const now = new Date('2026-04-03T00:00:00+09:00')

function submitConfirmLabel(draft: ReturnType<typeof preparePortalUjatApplicationDraft>): string {
  const paragraph = draft.paragraphs.find(
    item => item.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation,
  )
  assert.equal(paragraph?.kind, 'single_item')
  if (paragraph?.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
    throw new Error('expected volunteer submit confirmation multiple_choice')
  }
  return paragraph.items[0]?.label ?? ''
}

const institution = preparePortalUjatApplicationDraft(
  createUjatProgramApplicationFormInstitutionDraft(),
  now,
)
const institutionConfirm = institution.paragraphs.find(
  paragraph => paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
)
assert.equal(institutionConfirm?.kind, 'single_item')
if (institutionConfirm?.kind === 'single_item' && institutionConfirm.variant === 'multiple_choice') {
  assert.match(institutionConfirm.items[0]?.label ?? '', /2026년/)
  assert.equal(institutionConfirm.items[0]?.label.includes('2NNN'), false)
}

// activityTerm 누락(omit) → N기·placeholder 없이 "UJAT로 지원합니다"
const volunteerUnknown = preparePortalUjatApplicationDraft(
  createUjatProgramApplicationFormVolunteerDraft(),
  now,
)
{
  const label = submitConfirmLabel(volunteerUnknown)
  assert.equal(label.includes('N기'), false)
  assert.equal(label.includes('{{UJAT_COHORT}}'), false)
  assert.match(label, /UJAT로 지원합니다/)
}

// BE H1 binding — runtimeContext.activityTerm "1기"
{
  const label = submitConfirmLabel(
    preparePortalUjatApplicationDraft(createUjatProgramApplicationFormVolunteerDraft(), now, {
      activityTerm: '1기',
    }),
  )
  assert.match(label, /UJAT 1기로 지원합니다/)
}

// BE H2 binding — runtimeContext.activityTerm "2기"
{
  const label = submitConfirmLabel(
    preparePortalUjatApplicationDraft(createUjatProgramApplicationFormVolunteerDraft(), now, {
      activityTerm: '2기',
    }),
  )
  assert.match(label, /UJAT 2기로 지원합니다/)
}

// 카탈로그에 남은 구 N기 문구도 누락 시 기수를 뺀다
{
  const draft = createUjatProgramApplicationFormVolunteerDraft()
  const withLegacy = {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation) {
        return paragraph
      }
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
        return paragraph
      }
      return {
        ...paragraph,
        items: paragraph.items.map(item => ({
          ...item,
          label:
            '네, 상기 내용 모두 확인하였으며, 대학생경제교육봉사단 UJAT N기로 지원합니다.',
        })),
      }
    }),
  }
  const label = submitConfirmLabel(preparePortalUjatApplicationDraft(withLegacy, now))
  assert.equal(label.includes('N기'), false)
  assert.match(label, /UJAT로 지원합니다/)
}

const volunteerBasic = preparePortalUjatApplicationDraft(
  createUjatProgramApplicationFormVolunteerDraft(),
  now,
  { activityTerm: '1기' },
).paragraphs.find(paragraph => paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo)
assert.equal((volunteerBasic?.paragraphDescription ?? '').includes('202N'), false)

console.log('ujat-application-fill-placeholders: ok')
