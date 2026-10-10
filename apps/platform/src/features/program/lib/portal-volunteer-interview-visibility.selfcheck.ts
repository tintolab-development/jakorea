import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { resolveVolunteerPortalInterviewEnabledForHidden } from './portal-volunteer-interview-visibility.ts'

const interviewId = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          hiddenQuestionKeys: [interviewId],
        },
      },
      paragraphs: [{ id: interviewId, items: [{ id: 'interview-option:x', label: 'x' }] }],
    },
  }),
  false,
)

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          dynamicQuestions: {
            [interviewId]: { optionCount: 2 },
          },
        },
      },
      paragraphs: [{ id: interviewId, runtimeInputMode: 'dynamic_interview_slots' }],
    },
  }),
  true,
)

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          dynamicQuestions: {
            [interviewId]: { optionCount: 0 },
          },
        },
      },
      paragraphs: [{ id: interviewId }],
    },
  }),
  false,
)

console.log('portal-volunteer-interview-visibility.selfcheck: ok')
