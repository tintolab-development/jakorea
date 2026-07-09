import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  ProgramRegistrationIpsTypeFields,
  type ProgramRegistrationIpsTypeValue,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type TrainedTeachersRegistrationEducationCurriculumParagraphProps = {
  teacherTrainingEnabled: boolean
  curriculumSessionCount: number
  onDeleteCurriculumSession: (sessionIndex: number) => void
}

function TrainedTeachersTeacherTrainingTable() {
  const [trainingSchedule, setTrainingSchedule] = useState<Dayjs | null>(null)
  const [trainingEducationForm, setTrainingEducationForm] = useState('online')
  const [trainingIpsType, setTrainingIpsType] = useState<ProgramRegistrationIpsTypeValue>({
    category: 'prepare',
    detail: 'none',
  })

  return (
    <DetailInfoForm
      title="교육 연수"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="진행 일정"
          fullRow
          edit={
            <ParagraphDatePicker
              mode="single"
              presetMode="schedule"
              customizable={false}
              suppressAutoTodayWhenEmpty
              value={trainingSchedule}
              onChange={setTrainingSchedule}
              width="100%"
              placeholder="일정을 선택하세요"
            />
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
              value={trainingEducationForm}
              onChange={e => setTrainingEducationForm(String(e.target.value))}
            >
              <CmsRadio value="online">온라인</CmsRadio>
              <CmsRadio value="offline">오프라인</CmsRadio>
              <CmsRadio value="hybrid">온/오프라인</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="IPS 유형"
          edit={
            <ProgramRegistrationIpsTypeFields
              layout="inline"
              value={trainingIpsType}
              onChange={setTrainingIpsType}
              disabled
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function TrainedTeachersTeacherTrainingSection({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <DetailInfoForm
        title="교재 배송 안내"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교재 배송 안내"
            fullRow
            edit={
              <CmsInput
                inputSize="medium"
                placeholder="교육 연수 없이 교재 배송 후 교사가 교육을 진행합니다."
                width="100%"
                disabled
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ 교육 연수</div>
      <div className="program-registration-curriculum__session-row">
        <TrainedTeachersTeacherTrainingTable />
      </div>
    </div>
  )
}

function TrainedTeachersCurriculumSessionBlock({
  sessionIndex,
  onDelete,
}: {
  sessionIndex: number
  onDelete: (sessionIndex: number) => void
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
              fullRow
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <CmsInput
                    inputSize="medium"
                    placeholder="단원명을 입력하세요"
                    width="100%"
                    style={{ minWidth: 0, flex: '1 1 160px' }}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <CmsInput
                    inputSize="medium"
                    placeholder="교육 내용을 작성하세요"
                    width="100%"
                    style={{ minWidth: 0, flex: '2 1 260px' }}
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
  const [educationJournalEnabled, setEducationJournalEnabled] = useState<'yes' | 'no'>('yes')

  return (
    <div className="program-registration-curriculum__sessions">
      <DetailInfoForm
        title="교육 진행 (커리큘럼)"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육일지 설정"
            fullRow
            edit={
              <CmsRadioGroup
                size="large"
                value={educationJournalEnabled}
                onChange={e => setEducationJournalEnabled(e.target.value as 'yes' | 'no')}
              >
                <CmsRadio value="yes">있음</CmsRadio>
                <CmsRadio value="no">없음</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <TrainedTeachersTeacherTrainingSection enabled={teacherTrainingEnabled} />
      {Array.from({ length: curriculumSessionCount }, (_, index) => {
        const sessionIndex = index + 1
        return (
          <TrainedTeachersCurriculumSessionBlock
            key={sessionIndex}
            sessionIndex={sessionIndex}
            onDelete={onDeleteCurriculumSession}
          />
        )
      })}
    </div>
  )
}
