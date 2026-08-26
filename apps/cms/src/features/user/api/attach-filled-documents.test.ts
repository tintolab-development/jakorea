import { describe, expect, it } from 'vitest'
import {
  attachFilledDocumentsToTermsAgreements,
  mapAgreementSnapshotToFilledDocument,
  mapPaymentBasicInfo,
} from './attach-filled-documents'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { MemberRegisterConsentWriteSnapshots } from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import { ADMIN_PRE_REGISTER_TERMS_VERSION } from './build-pre-register-terms-agreements'

function stubDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: false },
    paragraphs: [],
  } as unknown as WritingFormDraft
}

describe('mapPaymentBasicInfo', () => {
  it('빈 문자열은 생략하고 값은 trim한다', () => {
    expect(
      mapPaymentBasicInfo({
        nameKo: ' 홍길동 ',
        nameEn: '',
        residentFront: '900101',
        residentBack: '',
        affiliation: '',
        noAffiliation: true,
        addressRoad: '',
        addressDetail: '',
        bankName: '국민',
        accountNumber: '',
        accountHolder: '',
        paymentPurpose: '강사비 또는 활동비 지급',
      })
    ).toEqual({
      nameKo: '홍길동',
      nameEn: undefined,
      residentFront: '900101',
      residentBack: undefined,
      affiliation: undefined,
      noAffiliation: true,
      addressRoad: undefined,
      addressDetail: undefined,
      bankName: '국민',
      accountNumber: undefined,
      accountHolder: undefined,
      paymentPurpose: '강사비 또는 활동비 지급',
    })
  })
})

describe('mapAgreementSnapshotToFilledDocument', () => {
  it('지급조서는 templateCode와 paymentBasicInfo를 붙인다', () => {
    const filled = mapAgreementSnapshotToFilledDocument('PAYMENT_STATEMENT_PRE_CONSENT', {
      draft: stubDraft(),
      paymentBasicInfo: { nameKo: '홍길동', paymentPurpose: '강사비 또는 활동비 지급' },
    })
    expect(filled.templateCode).toBe('agreement-third-party')
    expect(filled.schemaJson).toMatchObject({ schemaVersion: 1 })
    expect(filled.paymentBasicInfo).toMatchObject({ nameKo: '홍길동' })
  })

  it('초상권은 sidecar 없이 templateCode만 붙인다', () => {
    const filled = mapAgreementSnapshotToFilledDocument('PORTRAIT_RIGHTS', {
      draft: stubDraft(),
    })
    expect(filled.templateCode).toBe('agreement-portrait')
    expect(filled.paymentBasicInfo).toBeUndefined()
  })
})

describe('attachFilledDocumentsToTermsAgreements', () => {
  const snapshots: MemberRegisterConsentWriteSnapshots = {
    agreementByFieldKey: {
      consentPortrait: { draft: stubDraft() },
      consentPaymentStatement: {
        draft: stubDraft(),
        paymentBasicInfo: { nameKo: '김강사' },
      },
    },
    crimeByFieldKey: {},
  }

  it('create — agreed 동의서에 filledDocument를 붙인다', async () => {
    const rows = await attachFilledDocumentsToTermsAgreements(
      [
        {
          termsType: 'SERVICE_TERMS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: true,
          agreed: true,
        },
        {
          termsType: 'PORTRAIT_RIGHTS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: true,
        },
        {
          termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: true,
        },
        {
          termsType: 'MARKETING',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          required: false,
          agreed: false,
        },
      ],
      { mode: 'create', snapshots }
    )

    expect(rows?.find(r => r.termsType === 'PORTRAIT_RIGHTS')?.filledDocument).toMatchObject({
      templateCode: 'agreement-portrait',
    })
    expect(
      rows?.find(r => r.termsType === 'PAYMENT_STATEMENT_PRE_CONSENT')?.filledDocument
        ?.paymentBasicInfo
    ).toMatchObject({ nameKo: '김강사' })
    expect(rows?.find(r => r.termsType === 'MARKETING')?.filledDocument).toBeUndefined()
  })

  it('create — agreed인데 스냅샷이 없으면 에러', async () => {
    await expect(
      attachFilledDocumentsToTermsAgreements(
        [
          {
            termsType: 'PORTRAIT_RIGHTS',
            version: ADMIN_PRE_REGISTER_TERMS_VERSION,
            agreed: true,
          },
        ],
        { mode: 'create', snapshots: { agreementByFieldKey: {}, crimeByFieldKey: {} } }
      )
    ).rejects.toThrow('작성된 동의서 본문을 찾을 수 없습니다')
  })

  it('patch — 스냅샷 없는 동의서 행은 제외해 서버 원문을 유지한다', async () => {
    const rows = await attachFilledDocumentsToTermsAgreements(
      [
        {
          termsType: 'PORTRAIT_RIGHTS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          agreed: true,
        },
        {
          termsType: 'MARKETING',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          agreed: true,
        },
      ],
      { mode: 'patch', snapshots: { agreementByFieldKey: {}, crimeByFieldKey: {} } }
    )
    expect(rows?.map(r => r.termsType)).toEqual(['MARKETING'])
  })

  it('patch — 보낼 행이 없으면 undefined를 반환한다', async () => {
    const rows = await attachFilledDocumentsToTermsAgreements(
      [
        {
          termsType: 'PORTRAIT_RIGHTS',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          agreed: true,
        },
      ],
      { mode: 'patch', snapshots: { agreementByFieldKey: {}, crimeByFieldKey: {} } }
    )
    expect(rows).toBeUndefined()
  })

  it('개인 필드키 consentWithholdingTax도 지급조서에 매핑한다', async () => {
    const rows = await attachFilledDocumentsToTermsAgreements(
      [
        {
          termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          agreed: true,
        },
      ],
      {
        mode: 'create',
        snapshots: {
          agreementByFieldKey: {
            consentWithholdingTax: { draft: stubDraft(), paymentBasicInfo: { nameKo: '개인' } },
          },
          crimeByFieldKey: {},
        },
      }
    )
    expect(rows?.[0]?.filledDocument?.paymentBasicInfo).toMatchObject({ nameKo: '개인' })
  })

  it('성범죄는 evidenceFileObjectId를 업로드 결과로 붙인다', async () => {
    const file = new File(['png'], 'crime.png', { type: 'image/png' })
    const rows = await attachFilledDocumentsToTermsAgreements(
      [
        {
          termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
          version: ADMIN_PRE_REGISTER_TERMS_VERSION,
          agreed: true,
        },
      ],
      {
        mode: 'create',
        snapshots: {
          agreementByFieldKey: {},
          crimeByFieldKey: {
            consentSexOffenseCheck: {
              displaySrc: 'data:image/png;base64,AA==',
              replacementFileName: 'crime.png',
              file,
            },
          },
        },
        uploadCrimeEvidence: async () => 101,
      }
    )
    expect(rows?.[0]).toMatchObject({
      evidenceFileObjectId: 101,
      evidenceOriginalFileName: 'crime.png',
    })
    expect(rows?.[0]?.filledDocument).toBeUndefined()
  })
})
