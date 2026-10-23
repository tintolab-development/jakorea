/**
 * 교육받은 교사 신청 양식 CMS 설정 typed state.
 * Portal 제출 answers 와 별개. persist 는 editorState.
 */
import { peekGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  TRAINED_TEACHERS_APPLICATION_EDITOR_KIND,
  type TrainedTeachersApplicationBasicInfoState,
  type TrainedTeachersApplicationFormState,
  type TrainedTeachersPreferredScheduleBlock,
} from './registration-canonical-types'

const PREFIX = 'application.trainedTeachers'

const BASIC_KEYS: Array<keyof TrainedTeachersApplicationBasicInfoState> = [
  'applicationGrade',
  'classCount',
  'educationFormat',
  'educationPlace',
  'detailAddress',
  'totalStudents',
  'educationPlaceDetail',
  'teacherTel',
  'teacherMobile',
  'teacherEmail',
  'applicationReason',
  'otherRequests',
]

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function serializePreferredSchedules(raw: unknown): TrainedTeachersPreferredScheduleBlock[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { date: null, times: [] }
    }
    const rec = item as Record<string, unknown>
    const date =
      typeof rec.date === 'string'
        ? rec.date
        : rec.date != null && typeof rec.date === 'object' && 'toISOString' in rec.date
          ? String((rec.date as { toISOString: () => string }).toISOString())
          : null
    const times = Array.isArray(rec.times)
      ? rec.times.map(time => {
          const row = time && typeof time === 'object' ? (time as Record<string, unknown>) : {}
          return {
            classPeriod: asString(row.classPeriod),
            start:
              typeof row.start === 'string'
                ? row.start
                : row.start != null && typeof row.start === 'object' && 'toISOString' in row.start
                  ? String((row.start as { toISOString: () => string }).toISOString())
                  : null,
            end:
              typeof row.end === 'string'
                ? row.end
                : row.end != null && typeof row.end === 'object' && 'toISOString' in row.end
                  ? String((row.end as { toISOString: () => string }).toISOString())
                  : null,
          }
        })
      : []
    return {
      date,
      session: typeof rec.session === 'string' ? rec.session : undefined,
      times,
    }
  })
}

export function emptyTrainedTeachersApplicationFormState(): TrainedTeachersApplicationFormState {
  return {
    basicInfo: {
      applicationGrade: '',
      classCount: '',
      educationFormat: '',
      educationPlace: '',
      detailAddress: '',
      totalStudents: '',
      educationPlaceDetail: '',
      teacherTel: '',
      teacherMobile: '',
      teacherEmail: '',
      applicationReason: '',
      otherRequests: '',
    },
    preferredSchedules: [],
  }
}

export function collectTrainedTeachersApplicationFormState(
  overlay?: Record<string, unknown>
): TrainedTeachersApplicationFormState {
  const record = overlay ?? peekGeneralApplicationOverlayRecord('application-trained-teachers')
  const basicInfo = emptyTrainedTeachersApplicationFormState().basicInfo
  for (const key of BASIC_KEYS) {
    basicInfo[key] = asString(record[`${PREFIX}.basicInfo.${key}`])
  }
  return {
    basicInfo,
    preferredSchedules: serializePreferredSchedules(record[`${PREFIX}.preferredSchedules`]),
  }
}

export function trainedTeachersApplicationEditorState(
  state: TrainedTeachersApplicationFormState
): Record<string, unknown> {
  return {
    kind: TRAINED_TEACHERS_APPLICATION_EDITOR_KIND,
    schemaVersion: 1,
    application: state,
  }
}

export function readTrainedTeachersApplicationEditorState(
  editorState: Record<string, unknown> | undefined
): TrainedTeachersApplicationFormState | null {
  if (editorState?.kind !== TRAINED_TEACHERS_APPLICATION_EDITOR_KIND) return null
  const application = editorState.application
  if (!application || typeof application !== 'object' || Array.isArray(application)) return null
  const rec = application as Partial<TrainedTeachersApplicationFormState>
  return {
    ...emptyTrainedTeachersApplicationFormState(),
    ...rec,
    basicInfo: {
      ...emptyTrainedTeachersApplicationFormState().basicInfo,
      ...(rec.basicInfo ?? {}),
    },
    preferredSchedules: rec.preferredSchedules ?? [],
  }
}
