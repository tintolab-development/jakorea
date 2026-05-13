import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, PDF 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'

/** UJAT 프로그램 봉사자 신청 폼 — 이전 UJAT 활동 기수 */
export function UjatProgramApplicationVolunteerPreviousTermParagraph() {
  const [term, setTerm] = useState('')
  const [year, setYear] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])

  return (
    <DetailInfoForm title="이전 UJAT 활동 기수" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="이전 활동 기수 및 년도"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                placeholder="활동 기수"
                value={term}
                onChange={e => setTerm(e.target.value)}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                placeholder="활동 년도"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="수료증 첨부"
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
              onRemoveFile={index =>
                setFileNames(prev => prev.filter((_, i) => i !== index))
              }
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
