import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import { buildSurveyPollResultSections } from './aggregate-survey-poll-results'
import type { SurveyPollRawResponse } from './survey-management-types'

export type ExportSurveyResultsExcelArgs = {
  surveyTitle: string
  templateId: string
  responseCount: number
  participantTotal: number
  responses: SurveyPollRawResponse[]
}

export async function exportSurveyResultsExcel({
  surveyTitle,
  templateId,
  responseCount,
  participantTotal,
  responses,
}: ExportSurveyResultsExcelArgs): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const summarySheet = workbook.addWorksheet('요약')
  summarySheet.columns = [
    { header: '항목', key: 'label', width: 24 },
    { header: '값', key: 'value', width: 40 },
  ]
  summarySheet.addRow({ label: '설문조사명', value: surveyTitle })
  summarySheet.addRow({ label: '응답 수', value: `${responseCount}명` })
  summarySheet.addRow({ label: '프로그램 참여', value: `${participantTotal}명` })

  const sections = buildSurveyPollResultSections(templateId, responses)
  for (const section of sections) {
    const sheetName = section.title.replace(/[[\]\\/*?:]/g, '_').trim().slice(0, 31) || '설문'
    const sheet = workbook.addWorksheet(sheetName)
    if (section.kind === 'scale') {
      sheet.columns = [
        { header: '항목', key: 'label', width: 28 },
        { header: '응답 수', key: 'count', width: 12 },
      ]
      for (const datum of section.data) {
        sheet.addRow({ label: datum.label, count: datum.count })
      }
    } else {
      sheet.columns = [
        { header: '응답 내용', key: 'content', width: 48 },
        { header: '응답자', key: 'respondentName', width: 16 },
      ]
      for (const row of section.rows) {
        sheet.addRow(row)
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = generateFilename(`${surveyTitle}_설문조사결과`, 'xlsx')
  await downloadExcel(buffer, filename)
}
