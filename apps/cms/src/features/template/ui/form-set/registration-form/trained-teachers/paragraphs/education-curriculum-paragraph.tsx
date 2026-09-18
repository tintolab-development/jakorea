/**
 * 교육받은 교사 — 교육 진행(커리큘럼)
 * 교육 연수 ON: 첫 차시를 「교육 연수」로 치환 (별도 블록 prepend 금지)
 * 교육일지: 있음/없음만
 */
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
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

type TrainedTeachersRegistrationEducationCurriculumParagraphProps = {
  teacherTrainingEnabled: boolean
  curriculumSessionCount: number
  onDeleteCurriculumSession: (sessionIndex: number) => void
}

function TrainedTeachersCurriculumSessionBlock({
  sessionIndex,
  isTeacherTraining,
  onDelete,
  unitName,
  unitContent,
  onUnitNameChange,
  onUnitContentChange,
}: {
  sessionIndex: number
  isTeacherTraining: boolean
  onDelete: (sessionIndex: number) => void
  unitName: string
  unitContent: string
  onUnitNameChange: (value: string) => void
  onUnitContentChange: (value: string) => void
}) {
  const showDelete = sessionIndex > 1 && !isTeacherTraining
  const heading = isTeacherTraining ? TEACHER_TRAINING_HEADING : `${sessionIndex}차시`
  const displayUnitName = isTeacherTraining ? TEACHER_TRAINING_HEADING : unitName

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {heading}</div>
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={isTeacherTraining ? TEACHER_TRAINING_HEADING : `${sessionIndex}차시 커리큘럼`}
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="단원명 및 교육 내용"
              fullRow
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <CmsInput
                    inputSize="medium"
                    placeholder="단원명을 입력하세요"
                    width="100%"
                    style={{ minWidth: 0, flex: '1 1 160px' }}
                    value={displayUnitName}
                    disabled={isTeacherTraining}
                    onChange={event => {
                      if (isTeacherTraining) return
                      onUnitNameChange(event.target.value)
                    }}
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
          {isTeacherTraining ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                edit={
                  <ProgramRegistrationIpsTypeFields
                    layout="inline"
                    value={TEACHER_TRAINING_IPS}
                    onChange={() => {
                      /* Prepare 고정 */
                    }}
                    disabled
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
          ) : null}
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
    'trainedTeachersRegistration.educationCurriculum.unitNameBySession',
    EMPTY_UNIT_BY_SESSION
  )
  const [unitContentBySession] = useProgramRegistrationOverlayKv<Record<number, string>>(
    'trainedTeachersRegistration.educationCurriculum.unitContentBySession',
    EMPTY_UNIT_BY_SESSION
  )

  return (
    <div className="program-registration-curriculum__sessions">
      <TrainedTeachersEducationJournalSettingsRow />
      {Array.from({ length: curriculumSessionCount }, (_, index) => {
        const sessionIndex = index + 1
        const isTeacherTraining = teacherTrainingEnabled && sessionIndex === 1
        return (
          <TrainedTeachersCurriculumSessionBlock
            key={sessionIndex}
            sessionIndex={sessionIndex}
            isTeacherTraining={isTeacherTraining}
            onDelete={onDeleteCurriculumSession}
            unitName={unitNameBySession[sessionIndex] ?? ''}
            unitContent={unitContentBySession[sessionIndex] ?? ''}
            onUnitNameChange={value =>
              updateProgramRegistrationOverlayKey<Record<number, string>>(
                'trainedTeachersRegistration.educationCurriculum.unitNameBySession',
                prev => ({ ...(prev ?? {}), [sessionIndex]: value })
              )
            }
            onUnitContentChange={value =>
              updateProgramRegistrationOverlayKey<Record<number, string>>(
                'trainedTeachersRegistration.educationCurriculum.unitContentBySession',
                prev => ({ ...(prev ?? {}), [sessionIndex]: value })
              )
            }
          />
        )
      })}
    </div>
  )
}
