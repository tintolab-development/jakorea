/**
 * 일반 프로그램 통합 E2E — 단계 간 공유 실행 상태.
 * 인증 토큰·비밀번호·개인정보는 저장하지 않는다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const GENERAL_PROGRAM_E2E_RUN_STATE_PATH =
  process.env.GENERAL_PROGRAM_E2E_RUN_STATE_PATH?.trim() ||
  path.resolve(here, '../../../test-results/general-program-end-to-end/run-state.json')

export type RecordedSettlementItem = {
  kind: 'payment' | 'wage' | 'deduction'
  id: number | null
  itemName: string
  maxLimitWon: number | null
  layout: string | null
  useYn: boolean | null
}

export type RecordedSchedule = {
  sessionNo: number | null
  scheduleName: string | null
  startAt: string | null
  endAt: string | null
  allDay: boolean | null
}

export type RecordedRecruitment = {
  recruitmentId: number
  recruitmentType: string
  applicationType: string
  formBindingId: number
}

export type GeneralProgramEndToEndRunState = {
  stepCompleted: number
  savedAtKst: string
  programId: string
  programTitle: string
  programType: string
  selectedPaymentItemLabels: string[]
  schedules: RecordedSchedule[]
  recruitments: RecordedRecruitment[]
  listLifecycleLabel: string | null
  detailRecruitmentLabels: string[]
  settlementConfig: {
    settingsUiExists: boolean
    settingsUiPath: string
    settingsUiObserved: boolean
    configId: number | null
    configName: string | null
    paymentItems: RecordedSettlementItem[]
    recordedOnly: true
    saveApiCalled: false
  }
}

export function writeGeneralProgramEndToEndRunState(state: GeneralProgramEndToEndRunState) {
  fs.mkdirSync(path.dirname(GENERAL_PROGRAM_E2E_RUN_STATE_PATH), { recursive: true })
  fs.writeFileSync(GENERAL_PROGRAM_E2E_RUN_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  return GENERAL_PROGRAM_E2E_RUN_STATE_PATH
}

export function readGeneralProgramEndToEndRunState(): GeneralProgramEndToEndRunState | null {
  if (!fs.existsSync(GENERAL_PROGRAM_E2E_RUN_STATE_PATH)) return null
  const raw = fs.readFileSync(GENERAL_PROGRAM_E2E_RUN_STATE_PATH, 'utf8')
  return JSON.parse(raw) as GeneralProgramEndToEndRunState
}
