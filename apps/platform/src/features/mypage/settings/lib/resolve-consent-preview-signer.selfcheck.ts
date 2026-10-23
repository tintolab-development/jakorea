import assert from 'node:assert/strict'
import { resolveConsentPreviewSignerName } from './resolve-consent-preview-signer.ts'

/** 교육진행자 서약서는 초안에 성명 필드가 없다. */
const educatorDraft = {
  schemaVersion: 1 as const,
  formSettings: { titleNumbering: 'numeric' as const },
  paragraphs: [],
}

assert.equal(
  resolveConsentPreviewSignerName({
    draft: educatorDraft,
    signatureDisplayName: '',
  }),
  '',
  '교육진행자 서약 초안만으로는 성명이 없다',
)

assert.equal(
  resolveConsentPreviewSignerName({
    draft: educatorDraft,
    memberName: '홍길동',
    signatureDisplayName: '',
  }),
  '홍길동',
  '작성 화면과 같이 회원 성명을 서명란에 쓴다',
)

assert.equal(
  resolveConsentPreviewSignerName({
    draft: educatorDraft,
    memberName: '홍길동',
    signatureDisplayName: '전자서명닉네임',
  }),
  '홍길동',
  '회원 성명이 전자서명 표시 이름보다 우선한다',
)

console.log('resolve-consent-preview-signer.selfcheck: ok')
