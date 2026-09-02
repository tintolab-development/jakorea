import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, PDF 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'

/** UJAT 프로그램 봉사자 신청 폼 — 이전 UJAT 활동 기수 */
export function UjatProgramApplicationVolunteerPreviousTermParagraph() {
  const [term, setTerm] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm,
    ''
  )
  const [year, setYear] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear,
    ''
  )
  const [fileNames, setFileNames] = useUjatApplicationVolunteerOverlayKv<string[]>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames,
    []
  )

  return (
    <DetailInfoForm title="이전 UJAT 활동 기수" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="이전 활동 기수 및 년도"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsNumericInput
                mode="numericText"
                inputSize="medium"
                width="100%"
                style={{ flex: '3 1 0', minWidth: 0 }}
                placeholder="활동 기수"
                value={term}
                onValueChange={setTerm}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                width="100%"
                style={{ flex: '7 1 0', minWidth: 0 }}
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
                setFileNames([...fileNames, ...files.map(file => file.name)])
              }
              onRemoveFile={index => setFileNames(fileNames.filter((_, i) => i !== index))}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
