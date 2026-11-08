import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DOCUMENT_SCREENING_STATUS_LABELS, getDocumentScreeningTextPresentation } from './document-screening-presentation'
import { GENERAL_DOCUMENT_SCREENING_STATUS_LABELS } from '@/features/program/general/lib/volunteer-screening-constants'
import { UJAT_DOCUMENT_SCREENING_STATUS_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { getUjatDocumentScreeningTextPresentation } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'
import { DocumentScreeningStatusText } from '../../ui/volunteer-screening/document-screening-status-text'
import { DocumentScreeningStatusText as CompatibilityRenderer } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/document-screening-status-text'

describe('General/UJAT first document screening single authority',()=>{
 it.each([['pending','신청 및 대기 중','var(--Status-green-main, #1e8c29)'],['fail','서류 불합격','var(--Status-red-main, #c32f4a)'],['pass','서류 합격','var(--Netural-black, #3d3d3d)']] as const)('%s keeps exact label/accent',(status,label,accentColor)=>{
  expect(getDocumentScreeningTextPresentation(status)).toEqual({label,accentColor})
  expect(renderToStaticMarkup(createElement(DocumentScreeningStatusText,{status}))).toContain(label)
 })
 it('exports identical label authority to both domains and preserves filter ordering',()=>{
  expect(GENERAL_DOCUMENT_SCREENING_STATUS_LABELS).toBe(DOCUMENT_SCREENING_STATUS_LABELS)
  expect(UJAT_DOCUMENT_SCREENING_STATUS_LABELS).toBe(DOCUMENT_SCREENING_STATUS_LABELS)
  expect(Object.entries(DOCUMENT_SCREENING_STATUS_LABELS)).toEqual([['pending','신청 및 대기 중'],['fail','서류 불합격'],['pass','서류 합격']])
 })
 it('keeps old imports as aliases, not independent implementation',()=>{
  expect(CompatibilityRenderer).toBe(DocumentScreeningStatusText)
  expect(getUjatDocumentScreeningTextPresentation).toBe(getDocumentScreeningTextPresentation)
 })
 it.each(['UNKNOWN',null,undefined])('does not synthesize a fallback for %s',status=>{
  expect(getDocumentScreeningTextPresentation(status as never)).toEqual({label:undefined,accentColor:undefined})
  expect(renderToStaticMarkup(createElement(DocumentScreeningStatusText,{status:status as never}))).toMatch(/><\/span>$/)
 })
})
