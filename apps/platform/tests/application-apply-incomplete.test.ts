import { beforeEach, describe, expect, it } from 'vitest'
import { emptyTrainedTeachersBasicInfo } from '../src/features/program/ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info-answers'
import {
  focusIncompleteApplicationField,
  resolveGeneralBasicInfoApplyIncomplete,
} from '../src/features/program/lib/application-apply-incomplete'

const paragraphId = 'program-application-form-institution-basic-info'

describe('application apply incomplete', () => {
  it('returns classCount field when 신청 학급 is missing', () => {
    const incomplete = resolveGeneralBasicInfoApplyIncomplete(
      {
        ...emptyTrainedTeachersBasicInfo(),
        schoolName: '테스트학교',
        regionLabel: '서울',
        applicationGrade: '3',
        addressDetail: '주소',
        applicationReason: '사유',
        studentCount: '30',
        classCount: '',
      },
      paragraphId,
    )
    expect(incomplete?.field).toBe('classCount')
    expect(incomplete?.message).toBe('신청 학급 수를 선택해 주세요.')
  })

  describe('focusIncompleteApplicationField', () => {
    let root: HTMLDivElement

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="form-root">
          <div data-paragraph-id="${paragraphId}">
            <span data-field="classCount">
              <button type="button" id="class-count-trigger">학급</button>
            </span>
          </div>
        </div>
      `
      root = document.getElementById('form-root') as HTMLDivElement
    })

    it('marks paragraph and focuses the target control after alert dismiss', () => {
      const incomplete = resolveGeneralBasicInfoApplyIncomplete(
        {
          ...emptyTrainedTeachersBasicInfo(),
          schoolName: '테스트학교',
          regionLabel: '서울',
          applicationGrade: '3',
          addressDetail: '주소',
          applicationReason: '사유',
          studentCount: '30',
          classCount: '',
        },
        paragraphId,
      )
      focusIncompleteApplicationField(root, incomplete)
      const paragraph = root.querySelector<HTMLElement>(`[data-paragraph-id="${paragraphId}"]`)
      expect(paragraph?.dataset.applicationError).toBe('true')
      expect(document.activeElement?.id).toBe('class-count-trigger')
    })
  })
})
