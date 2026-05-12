import { useState } from 'react'
import { FilePdfOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphFileUpload } from '@/features/template/ui/paragraph/shared/paragraph-file-upload'

const MOCK_AGENCY_LINE = 'ID : tinto  |  검증번호 : 940412'
const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

/** 성범죄 경력 조회서 제출 — 가로 테이블 레이아웃(데모 고정값) */
export function InstructorCrimeRecordParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  return (
    <DetailInfoForm title="" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 ID 및 검증번호"
          readOnlyDisplay={isTemplateAuthoringMode}
          edit={MOCK_AGENCY_LINE}
          view={
            isTemplateAuthoringMode ? (
              <span className="form-editor-template-field-hint-text">
                {TEMPLATE_AUTO_USER_INFO_HINT}
              </span>
            ) : (
              MOCK_AGENCY_LINE
            )
          }
        />
        <DetailInfoForm.Field
          label="파일 첨부"
          edit={
            <div className="program-application-form-instructor__file-cell">
              <ParagraphFileUpload
                accept=".pdf"
                guideLines={[]}
                className="program-application-form-instructor__file-upload-trigger"
                onFilesChange={files => {
                  const next = files[0]
                  setUploadedFile(next ?? null)
                }}
              />
              {uploadedFile ? (
                <span className="program-application-form-instructor__file-attached">
                  <FilePdfOutlined
                    className="program-application-form-instructor__file-attached-icon"
                    aria-hidden
                  />
                  <span className="program-application-form-instructor__mock-file-name">
                    {uploadedFile.name}
                  </span>
                </span>
              ) : null}
            </div>
          }
          view={uploadedFile?.name ?? '—'}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
