/** @vitest-environment jsdom */
/**
 * 모집 라디오 기본값 회귀 가드 — 화면에 보이는 기본값과 검사·저장 값이 어긋나는 버그가 여러 번 재발해서,
 * (QA-0121·B-14 이후 등록 기본값: 공고 게시·면접 유무·강사 모집 대상 미선택. 상세 수정은 기존 등록분 해석값 유지)
 * 모든 라디오 키 × 프로그램 유형을 한 표(RADIO_MATRIX)로 묶어 단락 화면 기본값·등록 필수 검사·등록 생성 payload·
 * 로컬 저장·상세 수정 초기값·상세 수정 저장 payload 가 서로 같은지 검사한다.
 * 새 라디오를 추가하면 표에 행을 넣지 않는 한 「표가 모든 키를 덮는다」 테스트가 실패한다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import * as RadioDefaults from '@/features/program/general/lib/recruit-radio-defaults'
import {
  GENERAL_RECRUIT_RADIO_KEYS,
  RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
  RECRUIT_INTERVIEW_REQUIRED_DEFAULT,
  RECRUIT_NEED_OR_NOT_DEFAULT,
  withGeneralRecruitRadioDefaults,
} from '@/features/program/general/lib/recruit-radio-defaults'
import {
  DETAIL_EDIT_RECRUIT_RADIO_DEFAULTS,
  listDetailEditRecruitRadioFields,
  type DetailEditRecruitRadioValues,
} from '@/features/program/general/lib/recruit-radio-edit-prefill'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'
import { listIncompleteEconomyProgramRecruitmentRequiredFields } from '@/features/program/general/lib/economy-program-registration-required-fields'
import { buildGeneralProgramCreateFromWizardRhf } from '@/features/program/general/lib/overlay-phase1/build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'
import {
  registerGeneralRegistrationWizardRhf,
  type GeneralRegistrationWizardRhfApi,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { buildGeneralProgramListRowFromRegistrationSnapshot } from '@/features/program/general/lib/registration-local-save'
import { buildCompanySchoolProgramFromRhf } from '@/features/program/1c-1s/lib/build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from '@/features/program/1c-1s/lib/registration-rhf-values'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { buildGeneralRecruitmentNestedSnapshotServiceDetailJson } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import {
  replaceApplicantRecruitInstitutionOverlayForScope,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { clearRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'
import { clearOperationalSeedDefaultSuppression } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

vi.mock('@/shared/ui', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showUpdateCompletedAlert: vi.fn(),
}))

type Tab = 'institution' | 'individual' | 'instructor' | 'volunteer'
type Participant = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

const NO_TABS: Participant = {
  individual: false,
  organization: false,
  teacherInstructor: false,
  volunteer: false,
}
const PARTICIPANT_FOR_TAB: Record<Tab, Participant> = {
  institution: { ...NO_TABS, organization: true },
  individual: { ...NO_TABS, individual: true },
  instructor: { ...NO_TABS, teacherInstructor: true },
  volunteer: { ...NO_TABS, volunteer: true },
}

const RECRUIT_FORM_DIR = resolve(process.cwd(), 'src/features/template/ui/form-set/recruit-form')
const P = {
  institution: 'institution/paragraphs/applicant-recruit-participant-info-overlay-fields.tsx',
  individual:
    'individual/paragraphs/applicant-recruit-individual-participant-info-paragraph.tsx',
  instructor: 'instructor/paragraphs/recruit-form-instructor-info-paragraph.tsx',
  volunteer: 'volunteer/paragraphs/recruit-form-volunteer-info-paragraph.tsx',
} as const

type RadioRow = {
  tab: Tab
  overlayKey: string
  /** 등록 필수 검사 진단 키 */
  validationKey: string
  defaultValue: string
  /** `''` 도 화면에서 기본값으로 그리는가 — QA-0121 이후 모든 라디오 false(`''` = 미선택) */
  blankMeansDefault: boolean
  /** 미조작(키 없음)도 필수 검사에서 막는가 — 기본값이 미선택(`''`)인 공고 게시·면접 유무 */
  requiredUntilChosen?: boolean
  /** 단락 소스에서 기본값 인자(식별자)를 잡는 패턴 — 리터럴이면 잡히지 않아 실패한다 */
  paragraph: { file: string; pattern: RegExp }[]
  /** 상세 수정 폼 필드 (없으면 수정 화면에 해당 라디오 없음) */
  editField?: keyof DetailEditRecruitRadioValues
  editDefault?: string
}

const IK = GENERAL_RECRUIT_RADIO_KEYS
const RADIO_MATRIX: RadioRow[] = [
  {
    tab: 'institution',
    overlayKey: IK.institution.announcementPublished,
    validationKey: 'recruit.institution.announcementPublished',
    defaultValue: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.institution,
        pattern: /APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS\.announcementPublished,\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'participantRecruitmentAnnouncementPublished',
    editDefault: 'published',
  },
  {
    tab: 'institution',
    overlayKey: IK.institution.studentListRequired,
    validationKey: 'recruit.institution.studentListRequired',
    defaultValue: RECRUIT_NEED_OR_NOT_DEFAULT,
    blankMeansDefault: false,
    paragraph: [
      {
        file: P.institution,
        pattern: /function ApplicantRecruitStudentListRequiredField\(\{\s*defaultValue = ([A-Za-z_$][\w$]*)/,
      },
    ],
    // 수정 화면 studentListRequired 는 schema 에서 `?? 'required'` 로 이미 채운다(별도 필드)
  },
  {
    tab: 'institution',
    overlayKey: IK.institution.preguidanceRequired,
    validationKey: 'recruit.institution.preguidanceRequired',
    defaultValue: RECRUIT_NEED_OR_NOT_DEFAULT,
    blankMeansDefault: false,
    paragraph: [
      {
        file: P.institution,
        pattern: /function ApplicantRecruitPreguidanceRequiredField\(\{\s*defaultValue = ([A-Za-z_$][\w$]*)/,
      },
      {
        file: P.institution,
        pattern: /APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS\.preguidanceRequired,\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'participantRecruitmentPreEducationRequired',
    editDefault: 'required',
  },
  {
    tab: 'individual',
    overlayKey: IK.individual.announcementPublished,
    validationKey: 'recruit.individual.announcementPublished',
    defaultValue: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.individual,
        pattern: /'recruit\.individual\.announcementPublished',\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'participantRecruitmentAnnouncementPublished',
    editDefault: 'published',
  },
  {
    tab: 'individual',
    overlayKey: IK.individual.interviewRequired,
    validationKey: 'recruit.individual.interviewRequired',
    defaultValue: RECRUIT_INTERVIEW_REQUIRED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.individual,
        pattern: /'recruit\.individual\.interviewRequired',\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'participantRecruitmentInterviewEnabled',
    editDefault: 'yes',
  },
  {
    tab: 'instructor',
    overlayKey: IK.instructor.announcementPublished,
    validationKey: 'recruit.instructor.announcementPublished',
    defaultValue: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.instructor,
        pattern: /'recruit\.instructor\.announcementPublished',\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'instructorRecruitmentAnnouncementPublished',
    editDefault: 'published',
  },
  {
    tab: 'volunteer',
    overlayKey: IK.volunteer.announcementPublished,
    validationKey: 'recruit.volunteer.announcementPublished',
    defaultValue: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.volunteer,
        pattern: /'recruit\.volunteer\.announcementPublished',\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'volunteerRecruitmentAnnouncementPublished',
    editDefault: 'published',
  },
  {
    tab: 'volunteer',
    overlayKey: IK.volunteer.interviewRequired,
    validationKey: 'recruit.volunteer.interviewRequired',
    defaultValue: RECRUIT_INTERVIEW_REQUIRED_DEFAULT,
    blankMeansDefault: false,
    requiredUntilChosen: true,
    paragraph: [
      {
        file: P.volunteer,
        pattern: /'recruit\.volunteer\.interviewRequired',\s*([A-Za-z_$][\w$]*)\s*\)/,
      },
    ],
    editField: 'volunteerRecruitmentInterviewEnabled',
    editDefault: 'yes',
  },
]

const rowsForTab = (tab: Tab) => RADIO_MATRIX.filter(row => row.tab === tab)
const ALL_TABS: Tab[] = ['institution', 'individual', 'instructor', 'volunteer']

function resetStores() {
  registerGeneralRegistrationWizardRhf(null)
  resetAllOperationalOverlayStoresForTests()
  resetApplicantRecruitInstitutionOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
  resetProgramRegistrationOverlay()
  clearRegistrationStepTemplateSelections()
  clearOperationalSeedDefaultSuppression()
}

beforeEach(resetStores)
afterEach(resetStores)

/* ── (a) 화면 기본값 ↔ 중앙 상수 ─────────────────────────────────────────── */

describe('(a) 단락 화면 기본값 = 중앙 상수', () => {
  it('표가 GENERAL_RECRUIT_RADIO_KEYS 의 모든 키를 덮는다', () => {
    const keys = Object.values(GENERAL_RECRUIT_RADIO_KEYS).flatMap(group => Object.values(group))
    expect(RADIO_MATRIX.map(row => row.overlayKey).sort()).toEqual([...keys].sort())
  })

  it.each(RADIO_MATRIX.flatMap(row => row.paragraph.map(p => [row.overlayKey, row, p] as const)))(
    '%s — 단락이 중앙 상수를 기본값으로 쓴다',
    (_key, row, p) => {
      const source = readFileSync(join(RECRUIT_FORM_DIR, p.file), 'utf8')
      const match = source.match(p.pattern)
      expect(match, `${p.file} 에서 기본값 인자를 찾지 못함(리터럴이거나 구조가 바뀜)`).not.toBeNull()
      const ident = match![1]
      expect(Object.keys(RadioDefaults)).toContain(ident)
      expect((RadioDefaults as Record<string, unknown>)[ident]).toBe(row.defaultValue)
    }
  )

  it('일반 모집 단락 어디에도 라디오 키 기본값 리터럴이 없다', () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) {
          // Gemini·UJAT 는 별도 키(geminiRecruit.*, ujat*) — 대상 아님
          if (/^(gemini|UJAT)/.test(name)) continue
          walk(full)
        } else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) {
          files.push(full)
        }
      }
    }
    walk(RECRUIT_FORM_DIR)
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const row of RADIO_MATRIX) {
        const escaped = row.overlayKey.replace(/\./g, '\\.')
        const keyName = row.overlayKey.split('.').pop()!
        const literalAfterKey = new RegExp(`'${escaped}',\\s*'[^']*'\\s*\\)`)
        const literalAfterConst = new RegExp(
          `APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS\\.${keyName},\\s*'[^']*'\\s*\\)`
        )
        if (literalAfterKey.test(source) || (row.tab === 'institution' && literalAfterConst.test(source))) {
          offenders.push(`${file.slice(RECRUIT_FORM_DIR.length + 1)} → ${row.overlayKey}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('등록 채움(withGeneralRecruitRadioDefaults)이 표의 기본값과 같다', () => {
    const all = { individual: true, organization: true, teacherInstructor: true, volunteer: true }
    const filled = withGeneralRecruitRadioDefaults({}, all, { wizardKv: true })
    for (const row of RADIO_MATRIX) expect(filled[row.overlayKey]).toBe(row.defaultValue)
  })

  it('등록 기본값: 공고 게시·면접 유무·강사 모집 대상 모두 미선택 (QA-0121, 기획 B-14)', () => {
    expect(RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT).toBe('')
    expect(RECRUIT_INTERVIEW_REQUIRED_DEFAULT).toBe('')
    expect(RadioDefaults.RECRUIT_INSTRUCTOR_TARGETS_DEFAULT).toEqual([])
  })

  it('상세 수정은 기존 등록분 해석값(게시·면접 있음·사전 안내 필요)을 등록 기본값과 따로 쓴다', () => {
    for (const row of RADIO_MATRIX) {
      if (!row.editField) continue
      expect(DETAIL_EDIT_RECRUIT_RADIO_DEFAULTS[row.editField]).toBe(row.editDefault)
    }
    // 사전 안내 사항은 등록 기본값(need)과 같은 뜻을 유지한다
    expect(RECRUIT_NEED_OR_NOT_DEFAULT).toBe('need')
  })
})

/* ── (b) 등록 필수 검사: 미조작 기본값 = 입력 완료 ───────────────────────── */

const STORE_SCOPE: Record<Tab, string> = {
  institution: 'recruitment-participant-school',
  individual: 'recruitment-participant-individual',
  instructor: 'recruitment-instructor',
  volunteer: 'recruitment-volunteer',
}

function seedStore(tab: Tab, kv: Record<string, unknown>) {
  if (tab === 'institution') replaceApplicantRecruitInstitutionOverlayForScope(STORE_SCOPE[tab], kv)
  else replaceGeneralRecruitOverlayForScope(STORE_SCOPE[tab], kv)
}

function registerWizard(kv: Record<string, unknown>, participant: Participant) {
  const values = {
    ...createDefaultRegistrationWizardUiValues({ participant }),
    recruitmentKv: kv,
  }
  const api: GeneralRegistrationWizardRhfApi = {
    getValues: () => values as never,
    getPath: () => undefined,
    setPath: vi.fn(),
    reset: vi.fn(),
    applyOverlayRecord: vi.fn(),
    isDirty: () => false,
    markBaseline: vi.fn(),
  }
  registerGeneralRegistrationWizardRhf(api)
}

function ctxFor(participant: Participant, registrationProgramType?: 'GENERAL' | 'COMPANY_SCHOOL') {
  return {
    participant,
    programType: 'schedule' as const,
    sessionRoundType: 'single' as const,
    educationScheduleMode: 'date' as const,
    volunteerExceptionScheduleCount: 0,
    ...(registrationProgramType ? { registrationProgramType } : {}),
  }
}

type ValidatorCase = {
  label: string
  tabs: Tab[]
  run: (tab: Tab, kv: Record<string, unknown>) => string[]
}

const VALIDATOR_CASES: ValidatorCase[] = [
  {
    label: '일반 · 양식 저장소 경로',
    tabs: ALL_TABS,
    run: (tab, kv) => {
      seedStore(tab, kv)
      return listIncompleteGeneralProgramRecruitmentRequiredFields(ctxFor(PARTICIPANT_FOR_TAB[tab]))
    },
  },
  {
    label: '일반 · 등록 위저드 RHF 경로',
    tabs: ALL_TABS,
    run: (tab, kv) => {
      registerWizard(kv, PARTICIPANT_FOR_TAB[tab])
      return listIncompleteGeneralProgramRecruitmentRequiredFields(ctxFor(PARTICIPANT_FOR_TAB[tab]))
    },
  },
  {
    // 1사1교 기관 탭은 1사1교 RHF(기본 '' 미선택) — 화면도 미선택이라 대상 아님
    label: '1사1교 · 강사 탭(일반 단락)',
    tabs: ['instructor'],
    run: (tab, kv) => {
      seedStore(tab, kv)
      return listIncompleteEconomyProgramRecruitmentRequiredFields(PARTICIPANT_FOR_TAB[tab])
    },
  },
]

describe('(b) 등록 필수 검사 — 미조작은 화면 기본값대로 (유형 × 탭 × 키)', () => {
  for (const vc of VALIDATOR_CASES) {
    describe(vc.label, () => {
      it.each(vc.tabs)('%s 탭: 라디오 키가 전혀 없으면(미조작) 미선택 기본값(공고 게시·면접 유무)만 미입력', tab => {
        const missing = vc.run(tab, {})
        for (const row of rowsForTab(tab)) {
          if (row.requiredUntilChosen) expect(missing).toContain(row.validationKey)
          else expect(missing).not.toContain(row.validationKey)
        }
      })

      it.each(vc.tabs)('%s 탭: 명시적 빈 값(화면 미선택)은 미입력 — 검사가 실제로 동작한다', tab => {
        const rows = rowsForTab(tab)
        const kv = Object.fromEntries(rows.map(row => [row.overlayKey, '']))
        const missing = vc.run(tab, kv)
        for (const row of rows) {
          if (row.blankMeansDefault) expect(missing).not.toContain(row.validationKey)
          else expect(missing).toContain(row.validationKey)
        }
      })
    })
  }
})

/* ── 등록 생성·로컬 저장 payload ─────────────────────────────────────────── */

function overlayOf(program: Program): Record<string, unknown> {
  return (program.registrationOverlay ?? {}) as Record<string, unknown>
}

function expectDomainDefaults(program: Program, tab: Tab) {
  const info = program.generalCommonInfo
  // 공고 게시·면접 유무는 미선택 — 「게시」·「면접 있음」으로 채우지 않는다(등록은 필수 검사가 막는다)
  if (tab === 'institution' || tab === 'individual') {
    expect(info?.participantRecruitmentInfo?.announcementPublished).not.toBe(true)
  }
  if (tab === 'instructor') expect(info?.instructorRecruitmentInfo?.announcementPublished).not.toBe(true)
  if (tab === 'volunteer') {
    expect(info?.volunteerRecruitmentInfo?.announcementPublished).not.toBe(true)
    // 면접 유무는 기본값이 없다(미선택) — 「면접 있음」으로 채우지 않는다
    expect(program.generalVolunteerInterviewEnabled).not.toBe(true)
  }
  if (tab === 'individual') expect(program.generalParticipantInterviewEnabled).not.toBe(true)
}

describe('(b′) 등록 생성 payload — 라디오 미조작이면 화면 기본값(미선택)으로 저장', () => {
  it.each(ALL_TABS)('일반 위저드 create · %s 탭', tab => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
      participant: PARTICIPANT_FOR_TAB[tab],
    })
    const built = buildGeneralProgramCreateFromWizardRhf({
      id: `parity-${tab}`,
      uiValues: { ...values, programTitleKo: '[BOT-TEST] radio parity', recruitmentKv: {} } as typeof values,
    })
    for (const row of rowsForTab(tab)) {
      expect(overlayOf(built.program)[row.overlayKey], row.overlayKey).toBe(row.defaultValue)
    }
    expectDomainDefaults(built.program, tab)
  })

  it.each(ALL_TABS)('일반 로컬 저장 · %s 탭', tab => {
    seedStore(tab, {})
    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: `general-local-parity-${tab}`,
      participant: PARTICIPANT_FOR_TAB[tab],
      programType: 'schedule',
      variant: 'general',
      sessionRoundType: 'single',
      scheduleCurriculumDetailCount: 1,
    })
    // 로컬 저장 overlay 는 양식 저장소 원본(키 없음 = 화면 기본값)을 그대로 남기고, 도메인 필드에 기본값을 싣는다.
    for (const row of rowsForTab(tab)) {
      expect(overlayOf(program)[row.overlayKey] ?? row.defaultValue, row.overlayKey).toBe(row.defaultValue)
    }
    expectDomainDefaults(program, tab)
  })

  it('1사1교 create · 강사 탭 기본값(미선택) 유지, 기관 탭도 그대로(미선택)', () => {
    const program = buildCompanySchoolProgramFromRhf({
      id: 'cs-parity',
      values: createDefaultCompanySchoolRegistrationRhfValues(),
    })
    expect(overlayOf(program)[IK.instructor.announcementPublished] ?? '').toBe('')
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).not.toBe(true)
    expect(overlayOf(program)[IK.institution.announcementPublished]).toBe('')
  })

  it('1사1교 로컬 저장 · 강사 탭 기본값 저장, 기관 탭은 채우지 않음', () => {
    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'company-school-local-parity',
      participant: { ...NO_TABS, organization: true, teacherInstructor: true },
      programType: 'curriculum',
      variant: 'economy',
      sessionRoundType: 'single',
    })
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).not.toBe(true)
    expect(overlayOf(program)[IK.institution.announcementPublished]).not.toBe('published')
  })
})

/* ── (c) 상세 수정: 초기값 + 저장 payload ───────────────────────────────── */

type EditCase = {
  label: string
  dto: () => ProgramResponse
  /** 수정 화면에 보이는 모집 탭(저장 훅 audience) */
  audiences: ('participant' | 'instructor' | 'volunteer')[]
  /** 이 유형에서 채워져야 하는 수정 폼 필드 */
  expectFields: (keyof DetailEditRecruitRadioValues)[]
}

function generalDto(programType: string | undefined, types: string[]): ProgramResponse {
  return {
    id: 990200,
    ...(programType ? { programType } : {}),
    title: '[BOT-TEST] radio edit parity',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalParticipantTypes: types,
      ...(types.includes('individual') && !types.includes('school_institution')
        ? { generalProgramAudience: 'individual' }
        : {}),
      generalCommonInfo: {},
    }),
    recruitments: [
      {
        id: 11,
        recruitmentType: 'PARTICIPANT',
        targetType: types.includes('individual') ? 'INDIVIDUAL' : 'ORGANIZATION',
        applicationType: types.includes('individual') ? 'INDIVIDUAL' : 'ORGANIZATION',
        operationStartDate: '2026-12-01',
        operationEndDate: '2027-02-28',
      },
      ...(types.includes('teacher_instructor')
        ? [
            {
              id: 12,
              recruitmentType: 'INSTRUCTOR',
              targetType: 'TEACHER',
              applicationType: 'INSTRUCTOR',
              operationStartDate: '2026-12-01',
              operationEndDate: '2027-02-28',
            },
          ]
        : []),
      ...(types.includes('volunteer')
        ? [
            {
              id: 13,
              recruitmentType: 'VOLUNTEER',
              targetType: 'COLLEGE_STUDENT',
              applicationType: 'VOLUNTEER',
              operationStartDate: '2026-12-01',
              operationEndDate: '2027-02-28',
            },
          ]
        : []),
    ],
  } as unknown as ProgramResponse
}

const EDIT_CASES: EditCase[] = [
  {
    label: '일반 기관',
    dto: () => generalDto('GENERAL_ORGANIZATION', ['school_institution']),
    audiences: ['participant'],
    expectFields: ['participantRecruitmentAnnouncementPublished', 'participantRecruitmentPreEducationRequired'],
  },
  {
    label: '일반 개인',
    dto: () => generalDto('GENERAL_INDIVIDUAL', ['individual']),
    audiences: ['participant'],
    expectFields: ['participantRecruitmentAnnouncementPublished', 'participantRecruitmentInterviewEnabled'],
  },
  {
    label: '일반 기관+강사+봉사',
    dto: () => generalDto('GENERAL', ['school_institution', 'teacher_instructor', 'volunteer']),
    audiences: ['participant', 'instructor', 'volunteer'],
    expectFields: [
      'participantRecruitmentAnnouncementPublished',
      'participantRecruitmentPreEducationRequired',
      'instructorRecruitmentAnnouncementPublished',
      'volunteerRecruitmentAnnouncementPublished',
      'volunteerRecruitmentInterviewEnabled',
    ],
  },
  {
    label: '유형 미기재(programType 없음) 일반 기관+강사',
    dto: () => generalDto(undefined, ['school_institution', 'teacher_instructor']),
    audiences: ['participant', 'instructor'],
    expectFields: [
      'participantRecruitmentAnnouncementPublished',
      'participantRecruitmentPreEducationRequired',
      'instructorRecruitmentAnnouncementPublished',
    ],
  },
]

async function saveTab(program: Program, audience: 'participant' | 'instructor' | 'volunteer') {
  const values = programToRecruitmentTabEditValues(program, audience) as ProgramDetailEditFormValues
  const saved: { draft: Program; patch: Partial<Program> }[] = []
  const { result } = renderHook(() => {
    const form = useForm<ProgramDetailEditFormValues>({ defaultValues: values })
    return useProgramDetailInfoSave({
      form,
      program,
      mapToValues: () => values,
      onSaveEdit: async (draft: Program, patch: Partial<Program>) => {
        saved.push({ draft, patch })
      },
      validateSchema: { safeParse: () => ({ success: true }) } as never,
      recruitmentAudience: audience,
    } as never)
  })
  let ok = false
  await act(async () => {
    ok = await (result.current as { triggerSave: () => Promise<boolean> }).triggerSave()
  })
  expect(ok).toBe(true)
  return { values, ...saved[0] }
}

const NESTED_INFO_FOR_AUDIENCE = {
  participant: 'participantRecruitmentInfo',
  instructor: 'instructorRecruitmentInfo',
  volunteer: 'volunteerRecruitmentInfo',
} as const

describe('(c) 상세 수정 — 서버에 라디오 값이 없으면 초기값·저장 payload 모두 기본값 (유형 × 탭)', () => {
  for (const ec of EDIT_CASES) {
    describe(ec.label, () => {
      it('보이는 탭의 라디오 필드 = 기대 필드', () => {
        const program = mapAdminProgramDetailToProgram(ec.dto())
        expect([...listDetailEditRecruitRadioFields(program)].sort()).toEqual([...ec.expectFields].sort())
      })

      it.each(ec.audiences)('%s 탭: 열기만 하면 초기값만, 저장하면 payload 에 기본값', async audience => {
        const program = mapAdminProgramDetailToProgram(ec.dto())
        const { values, draft, patch } = await saveTab(program, audience)
        for (const field of ec.expectFields) {
          expect(values[field], field).toBe(DETAIL_EDIT_RECRUIT_RADIO_DEFAULTS[field])
        }
        const nestedKey = NESTED_INFO_FOR_AUDIENCE[audience]
        expect(patch.generalCommonInfo?.[nestedKey]?.announcementPublished).toBe(true)
        // 저장 후 nested 스냅샷(BE serviceDetailJson)에도 실린다
        const json = buildGeneralRecruitmentNestedSnapshotServiceDetailJson(draft, { audience })
        const nested = json ? (JSON.parse(json) as { generalCommonInfo?: Record<string, Record<string, unknown>> }) : null
        expect(nested?.generalCommonInfo?.[nestedKey]?.announcementPublished).toBe(true)
        if (audience === 'participant' && ec.expectFields.includes('participantRecruitmentPreEducationRequired')) {
          expect(patch.generalCommonInfo?.participantRecruitmentInfo?.preEducationNoticeRequired).toBe(true)
        }
        if (audience === 'participant' && ec.expectFields.includes('participantRecruitmentInterviewEnabled')) {
          expect(patch.generalParticipantInterviewEnabled).toBe(true)
        }
        if (audience === 'volunteer') expect(patch.generalVolunteerInterviewEnabled).toBe(true)
      })
    })
  }

  it('서버 값(미게시·면접 없음)은 기본값으로 덮지 않는다', () => {
    const base = mapAdminProgramDetailToProgram(
      generalDto('GENERAL', ['school_institution', 'volunteer'])
    )
    const program: Program = {
      ...base,
      generalVolunteerInterviewEnabled: false,
      generalCommonInfo: {
        ...base.generalCommonInfo,
        participantRecruitmentInfo: { announcementPublished: false },
        volunteerRecruitmentInfo: { announcementPublished: false },
      } as Program['generalCommonInfo'],
    }
    const values = programToDetailEditValues(program)
    expect(values.participantRecruitmentAnnouncementPublished).toBe('unpublished')
    expect(values.volunteerRecruitmentAnnouncementPublished).toBe('unpublished')
    expect(values.volunteerRecruitmentInterviewEnabled).toBe('no')
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished).toBe(false)
    expect(patch.generalVolunteerInterviewEnabled).toBe(false)
  })

  it('저장 빌더 방어: 폼 값에 라디오가 빠져 있어도(다른 매핑) 보이는 탭 기본값이 payload 에 실린다', () => {
    const program = mapAdminProgramDetailToProgram(
      generalDto('GENERAL', ['school_institution', 'teacher_instructor', 'volunteer'])
    )
    const values = { ...programToDetailEditValues(program) }
    for (const field of listDetailEditRecruitRadioFields(program)) delete values[field]
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished).toBe(true)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.preEducationNoticeRequired).toBe(true)
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
    expect(patch.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished).toBe(true)
    expect(patch.generalVolunteerInterviewEnabled).toBe(true)
  })

  it('1사1교: 강사 탭만 기본값(모집 화면이 강사 탭을 항상 노출), 기관·봉사는 그대로', () => {
    const program = {
      id: 'company-school-local-parity',
      title: '[BOT-TEST]',
      backendProgramType: 'COMPANY_SCHOOL',
      generalParticipantTypes: ['school_institution'],
    } as unknown as Program
    expect(listDetailEditRecruitRadioFields(program)).toEqual([
      'instructorRecruitmentAnnouncementPublished',
    ])
    const values = programToDetailEditValues(program)
    expect(values.instructorRecruitmentAnnouncementPublished).toBe('published')
    expect(values.participantRecruitmentAnnouncementPublished).toBeUndefined()
    expect(values.volunteerRecruitmentAnnouncementPublished).toBeUndefined()
    const patch = detailEditValuesToProgramPatch(values, program, { recruitmentAudience: 'instructor' })
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
  })

  it.each([
    ['교육받은 교사', { backendProgramType: 'TRAINED_TEACHER' }],
    ['교육받은 교사(유형 미기재·로컬 id)', { id: 'trained-teachers-local-1' }],
    ['UJAT', { backendProgramType: 'UJAT' }],
    ['UJAT(유형 미기재·로컬 id)', { id: 'ujat-local-1' }],
    ['UJAT overlay', { ujatRegistrationOverlay: {} }],
    ['Gemini', { backendProgramType: 'GEMINI_VISITING_TRAINING' }],
  ])('%s: 수정 초기값·저장 payload 에 기본값을 만들지 않는다', (_label, patch) => {
    const program = {
      id: '990300',
      title: '[BOT-TEST]',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      ...patch,
    } as unknown as Program
    expect(listDetailEditRecruitRadioFields(program)).toEqual([])
    const values = programToDetailEditValues(program)
    expect(values.participantRecruitmentAnnouncementPublished).toBeUndefined()
    expect(values.instructorRecruitmentAnnouncementPublished).toBeUndefined()
    const out = detailEditValuesToProgramPatch(values, program)
    expect(out.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished).toBeUndefined()
    expect(out.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBeUndefined()
  })
})
