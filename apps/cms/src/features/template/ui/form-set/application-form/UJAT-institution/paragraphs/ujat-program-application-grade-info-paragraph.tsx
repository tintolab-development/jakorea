import { Fragment, useMemo, useState } from 'react'
import './ujat-program-application-grade-info-paragraph.css'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsSelect } from '@/shared/ui/cms-select'

const GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

const MAX_CLASS_COUNT = 40

function parseClassCount(raw: string): number {
  const n = Number.parseInt(raw.replace(/\D/g, ''), 10)
  if (!Number.isFinite(n) || n < 1) return 0
  return Math.min(n, MAX_CLASS_COUNT)
}

/** ■ 신청 학년 N — 학급 수에 따라 학급 별 학생 수 입력 쌍 동적 생성 */
function GradeApplicationBlock({
  gradeValue,
  onGradeChange,
}: {
  gradeValue: string | undefined
  onGradeChange: (grade: string | undefined) => void
}) {
  const [classCountInput, setClassCountInput] = useState('')
  const [classNoByIndex, setClassNoByIndex] = useState<Record<number, string>>({})
  const [studentCountByIndex, setStudentCountByIndex] = useState<Record<number, string>>({})

  const classCount = useMemo(() => parseClassCount(classCountInput), [classCountInput])

  return (
    <DetailInfoForm title="학년 별 신청 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 학년 및 학급 수"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="medium"
                width={120}
                withAllOption={false}
                placeholder="신청 학년"
                value={gradeValue}
                onChange={v => onGradeChange(v == null ? undefined : String(v))}
                options={GRADE_OPTIONS}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsNumericInput
                inputSize="medium"
                width={120}
                placeholder="총 학급 수"
                mode="integer"
                value={classCountInput}
                onValueChange={setClassCountInput}
              />
              <span>학급</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="학급 별 학생 수"
          fullRow
          edit={
            classCount < 1 ? (
              <span className="form-editor-template-field-hint-text">
                총 학급 수를 먼저 입력해 주세요.
              </span>
            ) : (
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap ujat-program-application-grade-info-paragraph__student-inputs-row">
                {Array.from({ length: classCount }, (_, i) => (
                  <Fragment key={i}>
                    {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                    <CmsInput
                      inputSize="medium"
                      width={80}
                      placeholder="학급"
                      value={classNoByIndex[i] ?? ''}
                      onChange={e =>
                        setClassNoByIndex(prev => ({
                          ...prev,
                          [i]: e.target.value,
                        }))
                      }
                    />
                    <span>반</span>
                    <CmsInput
                      inputSize="medium"
                      width={80}
                      placeholder="학생 수"
                      value={studentCountByIndex[i] ?? ''}
                      onChange={e =>
                        setStudentCountByIndex(prev => ({
                          ...prev,
                          [i]: e.target.value,
                        }))
                      }
                    />
                    <span>명</span>
                  </Fragment>
                ))}
              </div>
            )
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

type UjatProgramApplicationGradeInfoParagraphProps = {
  applicationGradeBlockIds: readonly string[]
  applicationGradeByBlockId: Readonly<Record<string, string | undefined>>
  onApplicationGradeByBlockChange: (blockId: string, grade: string | undefined) => void
  onRemoveApplicationGradeAtIndex: (index: number) => void
}

/** UJAT 프로그램 학교 신청 폼 — 학년 별 신청 정보 (추가 버튼은 단락 카드 `titleTrailing`) */
export function UjatProgramApplicationGradeInfoParagraph({
  applicationGradeBlockIds,
  applicationGradeByBlockId,
  onApplicationGradeByBlockChange,
  onRemoveApplicationGradeAtIndex,
}: UjatProgramApplicationGradeInfoParagraphProps) {
  const ids = applicationGradeBlockIds.length > 0 ? applicationGradeBlockIds : ['ujat-grade-solo']

  return (
    <>
      {ids.map((blockKey, blockIndex) => (
        <div key={blockKey} className="ujat-program-application-grade-info-paragraph__block">
          <div className="ujat-program-application-grade-info-paragraph__block-body">
            <div className="detail-info-form--text-bold">
              ■ 신청 학년 {String(blockIndex + 1).padStart(2, '0')}
            </div>
            <GradeApplicationBlock
              gradeValue={applicationGradeByBlockId[blockKey]}
              onGradeChange={g => onApplicationGradeByBlockChange(blockKey, g)}
            />
          </div>
          {blockIndex > 0 ? (
            <div className="ujat-program-application-grade-info-paragraph__delete-cell">
              <ItemDeleteButton
                className="item-delete-button"
                aria-label={`신청 학년 ${String(blockIndex + 1).padStart(2, '0')} 삭제`}
                onClick={event => {
                  event.stopPropagation()
                  onRemoveApplicationGradeAtIndex(blockIndex)
                }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </>
  )
}
