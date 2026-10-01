/**
 * 교육받은 교사 — 교육 진행(커리큘럼)
 * 교육 연수 ON: 시안처럼 별도 「교육 연수」 블록 prepend (첫 차시 치환 금지)
 * 교육일지: 있음/없음만 — 교육 연수와 독립
 */
import { useEffect } from 'react'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  educationScheduleAppliedSurfaceRange,
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  parseStoredEducationScheduleRange,
} from '@/features/template/lib/format-education-schedule-line'
import {
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { TrainedTeachersEducationJournalSettingsRow } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/education-journal-settings-row'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const TEACHER_TRAINING_HEADING = '교육 연수'
const TEACHER_TRAINING_IPS: ProgramRegistrationIpsTypeValue = {
  category: 'prepare',
  detail: 'none',
}
const EMPTY_UNIT_BY_SESSION: Record<number, string> = {}

const TT_CURRICULUM_PREFIX = 'trainedTeachersRegistration.educationCurriculum' as const
const TT_PRE_EDUCATION_NAME_KEY = `${TT_CURRICULUM_PREFIX}.preEducationScheduleName` as const
const TT_PRE_EDUCATION_LINE_KEY = `${TT_CURRICULUM_PREFIX}.preEducationScheduleLine` as const
const TT_TEACHER_TRAINING_FORM_KEY = `${TT_CURRICULUM_PREFIX}.teacherTrainingEducationForm` as const
const TT_UNIT_NAME_KEY = `${TT_CURRICULUM_PREFIX}.unitNameBySession` as const
const TT_UNIT_CONTENT_KEY = `${TT_CURRICULUM_PREFIX}.unitContentBySession` as const

type TrainedTeachersRegistrationEducationCurriculumParagraphProps = {
  teacherTrainingEnabled: boolean
  curriculumSessionCount: number
  onDeleteCurriculumSession: (sessionIndex: number) => void
}

function reindexSessionRecordAfterDelete<T>(
  record: Record<number, T>,
  deletedIndex: number
): Record<number, T> {
  const next: Record<number, T> = {}
  for (const [key, value] of Object.entries(record)) {
    const index = Number(key)
    if (index < deletedIndex) next[index] = value
    else if (index > deletedIndex) next[index - 1] = value
  }
  return next
}

function TrainedTeachersTeacherTrainingBlock() {
  const [scheduleLine, setScheduleLine] = useProgramRegistrationOverlayKv<string | null>(
    TT_PRE_EDUCATION_LINE_KEY,
    null
  )
  const [educationForm, setEducationForm] = useProgramRegistrationOverlayKv(
    TT_TEACHER_TRAINING_FORM_KEY,
    'online'
  )
  const educationFormOptions = getProgramRegistrationEducationFormOptions(false)
  const scheduleRange = parseStoredEducationScheduleRange(scheduleLine)
  const scheduleHasClock = Boolean(scheduleRange && educationScheduleRangeHasClock(scheduleRange))

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">
        ■ {TEACHER_TRAINING_HEADING}
      </div>
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={TEACHER_TRAINING_HEADING}
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="진행 일정"
              validationKey="curriculum.preEducationScheduleLine"
              fullRow
              edit={
                <div className="detail-info-form-inputs-wrapper-no-gap">
                  <ParagraphDatePicker
                    mode="single"
                    presetMode="schedule"
                    customizable={false}
                    suppressAutoTodayWhenEmpty
                    value={scheduleRange?.[0] ?? null}
                    appliedSurfaceRange={educationScheduleAppliedSurfaceRange(scheduleRange)}
                    appliedSurfaceWithTime={scheduleHasClock}
                    onChange={() => {}}
                    onRangeChange={([start, end]) =>
                      setScheduleLine(formatEducationScheduleLineFromRange([start, end]))
                    }
                    width="100%"
                    placeholder="일정을 선택하세요"
                  />
                </div>
              }
              view="-"
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육 형태"
              edit={
                <CmsRadioGroup
                  size="large"
                  value={educationForm}
                  onChange={e => setEducationForm(String(e.target.value))}
                >
                  {educationFormOptions.map(option => (
                    <CmsRadio key={option.value} value={option.value}>
                      {option.label}
                    </CmsRadio>
                  ))}
                </CmsRadioGroup>
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="IPS 유형"
              edit={
                <ProgramRegistrationIpsTypeFields
                  layout="inline"
                  value={TEACHER_TRAINING_IPS}
                  onChange={() => {
                    /* Prepare 고정 — 유형 설정 IPS와 별도 표시값 */
                  }}
                  disabled
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

function TrainedTeachersCurriculumSessionBlock({
  sessionIndex,
  onDelete,
  unitName,
  unitContent,
  onUnitNameChange,
  onUnitContentChange,
}: {
  sessionIndex: number
  onDelete: (sessionIndex: number) => void
  unitName: string
  unitContent: string
  onUnitNameChange: (value: string) => void
  onUnitContentChange: (value: string) => void
}) {
  const showDelete = sessionIndex > 1

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {sessionIndex}차시</div>
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={`${sessionIndex}차시 커리큘럼`}
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="단원명 및 교육 내용"
              validationKey={[
                `curriculum.unitName[${sessionIndex}]`,
                `curriculum.unitContent[${sessionIndex}]`,
              ]}
              fullRow
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <CmsInput
                    inputSize="medium"
                    placeholder="단원명을 입력하세요"
                    width="100%"
                    style={{ minWidth: 0, flex: '1 1 160px' }}
                    value={unitName}
                    onChange={event => onUnitNameChange(event.target.value)}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <CmsInput
                    inputSize="medium"
                    placeholder="교육 내용을 작성하세요"
                    width="100%"
                    style={{ minWidth: 0, flex: '2 1 260px' }}
                    value={unitContent}
                    onChange={event => onUnitContentChange(event.target.value)}
                  />
                </div>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
        {showDelete ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${sessionIndex}차시 삭제`}
            onClick={event => {
              event.stopPropagation()
              onDelete(sessionIndex)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export function TrainedTeachersRegistrationEducationCurriculumParagraph({
  teacherTrainingEnabled,
  curriculumSessionCount,
  onDeleteCurriculumSession,
}: TrainedTeachersRegistrationEducationCurriculumParagraphProps) {
  const [unitNameBySession] = useProgramRegistrationOverlayKv<Record<number, string>>(
    TT_UNIT_NAME_KEY,
    EMPTY_UNIT_BY_SESSION
  )
  const [unitContentBySession] = useProgramRegistrationOverlayKv<Record<number, string>>(
    TT_UNIT_CONTENT_KEY,
    EMPTY_UNIT_BY_SESSION
  )

  useEffect(() => {
    if (!teacherTrainingEnabled) return
    updateProgramRegistrationOverlayKey<string>(TT_PRE_EDUCATION_NAME_KEY, prev =>
      typeof prev === 'string' && prev.trim() ? prev : TEACHER_TRAINING_HEADING
    )
  }, [teacherTrainingEnabled])

  const handleDeleteSession = (sessionIndex: number) => {
    if (sessionIndex <= 1) return
    updateProgramRegistrationOverlayKey<Record<number, string>>(TT_UNIT_NAME_KEY, prev =>
      reindexSessionRecordAfterDelete(prev ?? {}, sessionIndex)
    )
    updateProgramRegistrationOverlayKey<Record<number, string>>(TT_UNIT_CONTENT_KEY, prev =>
      reindexSessionRecordAfterDelete(prev ?? {}, sessionIndex)
    )
    onDeleteCurriculumSession(sessionIndex)
  }

  return (
    <div className="program-registration-curriculum__sessions">
      <TrainedTeachersEducationJournalSettingsRow />
      {teacherTrainingEnabled ? <TrainedTeachersTeacherTrainingBlock /> : null}
      {Array.from({ length: curriculumSessionCount }, (_, index) => {
        const sessionIndex = index + 1
        return (
          <TrainedTeachersCurriculumSessionBlock
            key={sessionIndex}
            sessionIndex={sessionIndex}
            onDelete={handleDeleteSession}
            unitName={unitNameBySession[sessionIndex] ?? ''}
            unitContent={unitContentBySession[sessionIndex] ?? ''}
            onUnitNameChange={value =>
              updateProgramRegistrationOverlayKey<Record<number, string>>(
                TT_UNIT_NAME_KEY,
                prev => ({ ...(prev ?? {}), [sessionIndex]: value })
              )
            }
            onUnitContentChange={value =>
              updateProgramRegistrationOverlayKey<Record<number, string>>(
                TT_UNIT_CONTENT_KEY,
                prev => ({ ...(prev ?? {}), [sessionIndex]: value })
              )
            }
          />
        )
      })}
    </div>
  )
}
