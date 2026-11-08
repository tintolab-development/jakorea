import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getProgramAssignmentStatusTextPresentation, getProgramAssignmentRowClass, INSTRUCTOR_ASSIGNMENT_STATUS_LABELS, type ProgramAssignmentTextContext } from './assignment-status-presentation'
import { ProgramAssignmentStatusText } from '../../shared/ui/program-assignment-status-text'

const green = 'var(--Status-green-main, #1e8c29)'
const black = 'var(--default-BK, #3d3d3d)'
const red = 'var(--Status-red-main, #c32f4a)'
const cases: [ProgramAssignmentTextContext, string, string, string, number | undefined][] = [
 ['school-instructor','waiting','배정 대기',green,undefined],['school-instructor','unavailable','배정 불가',black,0.6],['school-instructor','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],
 ['instructor-institution','waiting','배정 대기',green,undefined],['instructor-institution','cancelled','배정 불가',black,undefined],['instructor-institution','assigned','배정 완료','var(--Netural-black, #3d3d3d)',undefined],['instructor-institution','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],['instructor-institution','unavailable','배정 불가',black,undefined],['instructor-institution','assignment_cancelled','배정 취소',black,undefined],
 ['instructor-individual','waiting','배정 대기',green,undefined],['instructor-individual','unavailable','배정 불가',black,undefined],['instructor-individual','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],['instructor-individual','assignment_cancelled','배정 취소',black,undefined],
 ['individual-volunteer','waiting','배정 대기',green,undefined],['individual-volunteer','unavailable','배정 불가',red,undefined],['individual-volunteer','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],
 ['institution-volunteer','waiting','배정 대기','inherit',undefined],['institution-volunteer','unavailable','배정 불가','inherit',undefined],['institution-volunteer','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],
 ['company-school-applicant','waiting','배정 대기','inherit',undefined],['company-school-applicant','unavailable','배정 불가','inherit',undefined],['company-school-applicant','no_assignable_schedule','배정 가능 일정 없음','inherit',undefined],
]
describe('assignment semantic context and former CSS cascade', () => {
 it.each(cases)('%s %s preserves label/color/own opacity', (context,status,label,accentColor,opacity) => {
  expect(getProgramAssignmentStatusTextPresentation(status,context)).toEqual({label,accentColor,opacity})
  const html=renderToStaticMarkup(createElement(ProgramAssignmentStatusText,{status,context}))
  expect(html).toContain(label);expect(html).toContain(`--status-accent:${accentColor}`)
  if(opacity!=null)expect(html).toContain(`opacity:${opacity}`)
 })
 it.each(['instructor-institution','instructor-individual'] as const)('preserves server label precedence only for %s',context=>{
  expect(getProgramAssignmentStatusTextPresentation('unavailable',context,'  원문 상태  ').label).toBe('원문 상태')
  expect(getProgramAssignmentStatusTextPresentation('unavailable',context,'   ').label).toBe('배정 불가')
 })
 it('does not impose API label override on contexts that never used it',()=>{
  expect(getProgramAssignmentStatusTextPresentation('unavailable','school-instructor','다른 문구').label).toBe('배정 불가')
 })
 it.each(['school-instructor','instructor-institution','instructor-individual','institution-volunteer','individual-volunteer','company-school-applicant'] as const)('%s unknown remains empty/inherited, not a guessed pending state',context=>{
  expect(getProgramAssignmentStatusTextPresentation('UNKNOWN',context)).toEqual({label:undefined,accentColor:'inherit',opacity:undefined})
  expect(getProgramAssignmentRowClass('UNKNOWN',context)).toBe('')
 })
 it('preserves row opacity independently from nested Text opacity and leaves CTA policy outside presentation',()=>{
  expect(getProgramAssignmentRowClass('unavailable','school-instructor')).toBe('program-assignment-row--unavailable')
  expect(getProgramAssignmentRowClass('assignment_cancelled','instructor-individual')).toBe('program-assignment-row--unavailable')
  expect(getProgramAssignmentRowClass('unavailable','individual-volunteer')).toBe('program-assignment-row--unavailable program-assignment-row--individual-volunteer')
  expect(getProgramAssignmentRowClass('unavailable','instructor-institution')).toBe('')
  expect(getProgramAssignmentRowClass('unavailable','institution-volunteer')).toBe('')
  expect(getProgramAssignmentStatusTextPresentation('unavailable','school-instructor').opacity! * 0.6).toBe(0.36)
  expect(INSTRUCTOR_ASSIGNMENT_STATUS_LABELS.assignment_cancelled).toBe('배정 취소')
 })
 it('leaves no former state CSS/import authority and keeps only one row-style owner',()=>{
  const source=(p:string)=>readFileSync(new URL(p,import.meta.url),'utf8')
  expect(source('../ui/detail-modal/program-status/instructor-assignment-status-text.css')).not.toContain('color:')
  for(const f of ['school-detail-fullpage-view.css','participating-instructor-fullpage-view.css','participating-individual-volunteer-assignment-section.css']) {
   expect(source('../ui/detail-modal/program-status/'+f)).not.toMatch(/__assignment-status--(?:cancelled|unavailable)\s*\{/)
   expect(source('../ui/detail-modal/program-status/'+f)).not.toMatch(/__waiting-row--unavailable[^}]*\{/)
  }
  expect(source('../../shared/ui/program-assignment-status-text.css')).toContain('--program-assignment-row-opacity, 0.6')
 })
})
