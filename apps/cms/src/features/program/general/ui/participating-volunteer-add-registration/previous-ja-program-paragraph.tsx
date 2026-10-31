import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { useParticipatingVolunteerAddRegistrationPluginState } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG, PDF 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'

/** 참여 봉사자 추가 등록 — 이전 참여 JA 봉사 프로그램 plugin 본문 */
export function ParticipatingVolunteerAddRegistrationPreviousJaProgramParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const {
    values,
    setPreviousJaProgramYear,
    setPreviousJaProgramName,
    appendPreviousJaCertificateFileIds,
    removePreviousJaCertificateFileAt,
  } = useParticipatingVolunteerAddRegistrationPluginState()

  const { previousJaProgram } = values
  const fileNames = previousJaProgram.certificateFileIds.map(id => `파일 ${id}`)

  return (
    <DetailInfoForm title="이전 참여 JA 봉사 프로그램" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="참여 JA 봉사 프로그램"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                inputSize="small"
                width="100%"
                style={{ flex: '3 1 0', minWidth: 0 }}
                placeholder="진행년도"
                value={previousJaProgram.programYear}
                onChange={e => setPreviousJaProgramYear(e.target.value)}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="small"
                width="100%"
                style={{ flex: '7 1 0', minWidth: 0 }}
                placeholder="참여한 봉사 프로그램명을 입력해 주세요"
                value={previousJaProgram.programName}
                onChange={e => setPreviousJaProgramName(e.target.value)}
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
              onFilesChange={files => {
                const programId = Number(_props.programId)
                const ownerId =
                  Number.isSafeInteger(programId) && programId > 0 ? programId : null
                if (ownerId == null) return
                const owner = buildAdminFileOwner(
                  ADMIN_FILE_OWNER.PROGRAM,
                  ownerId,
                  ADMIN_FILE_PURPOSE.VOLUNTEER_APPLICATION_EVIDENCE
                )
                void (async () => {
                  const ids: string[] = []
                  for (const file of files) {
                    try {
                      const result = await uploadAdminFileMaybeMock({ file, owner })
                      if (result.fileObjectId != null) {
                        ids.push(String(result.fileObjectId))
                      }
                    } catch {
                      // 실패한 파일은 id 목록에 넣지 않는다 — 등록 시 필수 검증이 막는다.
                    }
                  }
                  appendPreviousJaCertificateFileIds(ids)
                })()
              }}
              onRemoveFile={index => removePreviousJaCertificateFileAt(index)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
