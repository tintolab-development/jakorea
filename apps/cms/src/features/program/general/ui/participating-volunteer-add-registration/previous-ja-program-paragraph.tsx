import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, PDF 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'

/** 참여 봉사자 추가 등록 — 이전 참여 JA 봉사 프로그램 plugin 본문 */
export function ParticipatingVolunteerAddRegistrationPreviousJaProgramParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const [applicationYear, setApplicationYear] = useState('')
  const [programName, setProgramName] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])

  return (
    <DetailInfoForm title="이전 참여 JA 봉사 프로그램" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="참여 JA 봉사 프로그램"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '3 1 0', minWidth: 0 }}
                placeholder="신청년도"
                value={applicationYear}
                onChange={e => setApplicationYear(e.target.value)}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '7 1 0', minWidth: 0 }}
                placeholder="프로그램명"
                value={programName}
                onChange={e => setProgramName(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="증빙서류 첨부"
          fullRow
          edit={
            <ParagraphFileUpload
              accept={CERTIFICATE_ACCEPT}
              multiple
              guideLines={CERTIFICATE_GUIDE_LINES}
              fileNames={fileNames}
              onFilesChange={files =>
                setFileNames(prev => [...prev, ...files.map(file => file.name)])
              }
              onRemoveFile={index => setFileNames(prev => prev.filter((_, i) => i !== index))}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
