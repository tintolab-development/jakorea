import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
  APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL,
} from '@jakorea/form-schema/paragraph-ids/application-form-privacy-retention'

export const PARTICIPATING_INSTRUCTOR_ADD_CONSENT_IDS = {
  personalInfoCollection: 'participating-instructor-add-consent-personal-info',
  thirdPartyConsent: 'participating-instructor-add-consent-third-party',
} as const

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createParticipatingInstructorPersonalInfoTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: '이름, 연락처, 성별, 이메일, 소속(학교)',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램 강사활동 안내 및 진행에 필요한 정보 안내',
    },
    {
      kind: 'text' as const,
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 프로그램 종료로부터 1년 보관 후 폐기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PARTICIPATING_INSTRUCTOR_ADD_CONSENT_IDS.personalInfoCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 수집·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    tableFlavor: 'field',
    columnHeaders: ['수집 항목', '수집·이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: PERSONAL_INFO_COLLECTION_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createParticipatingInstructorThirdPartyTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow = [
    { kind: 'text' as const, value: '배정된 교육 대상 학교' },
    {
      kind: 'text' as const,
      value: '이름, 연락처, 성별, 이메일, 소속(학교)',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램 강사활동 안내 및 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: '해당 프로그램이 진행되는 기간' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PARTICIPATING_INSTRUCTOR_ADD_CONSENT_IDS.thirdPartyConsent,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 제3자 정보 제공·이용 동의',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: PERSONAL_INFO_THIRD_PARTY_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

export function createParticipatingInstructorAddConsentParagraphs(): HorizontalTableParagraph[] {
  return [createParticipatingInstructorPersonalInfoTable(), createParticipatingInstructorThirdPartyTable()]
}

/** 일반 프로그램(기관형) Figma 03-2 (9762:77457) — 수집 항목 */
const GENERAL_INSTITUTION_COLLECTION_ITEMS_CELL = '이름, 개인 연락처, e-mail'

/** 일반 프로그램(기관형) Figma 03-2 — 수집·이용 목적 (「및」 뒤 줄바꿈) */
const GENERAL_INSTITUTION_COLLECTION_PURPOSE_CELL =
  'JA 프로그램 강사활동 안내 및\n진행에 필요한 정보 안내'

/** 일반 프로그램(기관형) Figma 03-2 — 제3자 「제공받는 곳」 입력 placeholder */
export const PARTICIPATING_INSTRUCTOR_THIRD_PARTY_RECIPIENT_PLACEHOLDER =
  '제공받는 기관명을 입력해 주세요'

/**
 * 일반 프로그램(기관형) 참여 강사 추가 등록 동의서 — Figma 03-2 문구.
 * 동의 라디오는 미선택(`bottomConsent` 생략)으로 시작한다(약관·동의 정책: 모든 항목 동의/미동의 직접 선택).
 */
export function createGeneralInstitutionParticipatingInstructorAddConsentParagraphs(): HorizontalTableParagraph[] {
  const [personal, thirdParty] = createParticipatingInstructorAddConsentParagraphs()
  return [
    normalizeHorizontalTableParagraph({
      ...personal,
      fieldDataRows: [
        [
          { kind: 'text' as const, value: GENERAL_INSTITUTION_COLLECTION_ITEMS_CELL },
          { kind: 'text' as const, value: GENERAL_INSTITUTION_COLLECTION_PURPOSE_CELL },
          // 일반 프로그램(기관형) Figma 03-2 — 신청서 공통 보유기간(FE·BE 공통 상수)
          { kind: 'text' as const, value: APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL },
        ],
      ],
      bottomConsent: undefined,
    }),
    normalizeHorizontalTableParagraph({
      ...thirdParty,
      columnFields: [
        { kind: 'text' as const, placeholder: PARTICIPATING_INSTRUCTOR_THIRD_PARTY_RECIPIENT_PLACEHOLDER },
        { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
        { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
        { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
      ],
      fieldDataRows: [
        [
          { kind: 'text' as const, value: '' },
          { kind: 'text' as const, value: GENERAL_INSTITUTION_COLLECTION_ITEMS_CELL },
          { kind: 'text' as const, value: GENERAL_INSTITUTION_COLLECTION_PURPOSE_CELL },
          { kind: 'text' as const, value: APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL },
        ],
      ],
      bottomConsent: undefined,
    }),
  ]
}
