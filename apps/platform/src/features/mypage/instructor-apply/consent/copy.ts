export const CONSENT_WRITE_RADIO_OPTIONS = [
  { value: 'agree', label: '동의' },
  { value: 'disagree', label: '동의하지 않음' },
] as const

export const PAYMENT_INTRO_TITLE = '개인정보 수집‧이용 및 제공 동의서'
export const PAYMENT_INTRO_BODY =
  'JA KOREA (이하 "기관"이라 함)는 「개인정보 보호법」 제15조 및 22조에 의거하여 개인정보 수집 및 이용에 관한 정보주체의 동의절차를 준수하며, 개인정보 제공자가 동의한 이용목적 외의 용도로는 이용, 제공되지 않습니다. 제공된 개인정보는 개인정보 관리책임자를 통해 열람, 정정, 삭제 등을 요구할 수 있습니다.'

export const PAYMENT_TABLES = [
  {
    title: '1. 개인정보 수집·이용',
    headers: ['항목', '수집·이용 목적', '보유기간'],
    rows: [
      [
        '성명, 생년월일, 주소, 전화번호, e-mail, 계좌정보(은행, 계좌번호, 예금주)',
        '강사비, 회의비 등 목적에 맞게 사용 지급 및 강사관리 및 사업에 필요한 업무처리',
        '10년',
      ],
    ],
    emphasizedColumns: [2],
    footer:
      '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 기관 사업에 필요한 업무처리에 제약이 발생할 수 있습니다.',
  },
  {
    title: '2. 고유식별번호(주민등록번호) 수집·이용',
    headers: ['항목', '수집·이용 목적', '보유기간'],
    rows: [['주민등록번호', '지급명세서(소득세 납부) 제출 항목', '10년']],
    emphasizedColumns: [0, 2],
    footer:
      '위의 고유식별번호(주민등록번호) 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금신고 등 업무처리에 제약이 발생할 수 있습니다.',
  },
  {
    title: '3. 개인정보 제3자 제공·이용',
    headers: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    rows: [
      ['국세청', '성명, 주소', '원천세 신고', '소득세법에 따른 보관기간'],
      [
        '사회복지공동모금회',
        '성명, 생년월일, 주소, 전화번호, e-mail, 계좌정보(은행, 계좌번호, 예금주)',
        '배분사업 수행 관련 증빙서류 제출',
        '10년',
      ],
    ],
    emphasizedColumns: [0, 2, 3],
    footer:
      '위의 개인정보의 제3자 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금신고 등 업무처리에 제약이 발생할 수 있습니다.',
  },
  {
    title: '4. 고유식별번호 제3자 제공·이용',
    headers: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    rows: [['국세청', '성명, 주소', '원천세 신고', '소득세법에 따른 보관기간']],
    emphasizedColumns: [0, 2, 3],
    footer:
      '위의 고유식별정보의 제3자 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금 신고 등 업무처리에 제약이 발생할 수 있습니다.',
  },
] as const

export const PAYMENT_MID_CONSENT =
  '상기 본인은 위와 같이 「개인정보보호법」등 관련 법규에 의거하여 개인정보 수집 및 활용에 동의합니다.'
export const PAYMENT_BASIC_SECTION_TITLE = `${PAYMENT_TABLES.length + 1}. 지급조서`
export const PAYMENT_PURPOSE_FIXED = '강사비 또는 활동비 지급'
export const PAYMENT_FINAL_CONFIRM =
  '본인은 본 비용 지급 목적의 활동에 참여하였으며 상기 내용을 바탕으로 금액을 수령함을 확인합니다.'
export const PAYMENT_CLOSING = 'JA KOREA 귀하'

export const EDUCATOR_INTRO =
  '본인은 JA Korea의 교육사업에 참여함에 있어, 다음 사항을 준수할 것을 서약합니다.'

export const EDUCATOR_CLAUSES = [
  {
    title: '1. 아동·청소년 보호와 성범죄 예방',
    body: '교육 대상이 아동·청소년인 경우, 관련 법령과 윤리 기준을 준수하며, 모든 수강생이 안전하고 존중받는 환경에서 학습할 수 있도록 최선을 다하겠습니다.',
  },
  {
    title: '2. 종교적 정치적 중립성 유지',
    body: '교육 내용 및 발언에 있어 종교적·정치적으로 편향이나 특정 종교·이념·정당을 지지·비판하는 내용을 포함하지 않겠습니다.',
  },
  {
    title: '3. 개인정보 보호',
    body: '교육과정 중 알게 된 관련인의 개인정보를 외부에 유출하거나 무단으로 사용하지 않겠습니다.',
  },
  {
    title: '4. 품위 유지 및 성실한 교육 수행',
    body: '교육 강사로서 사회적 물의를 일으키지 않으며, 성실하고 책임감 있게 교육 활동에 임하겠습니다.',
  },
] as const

export const EDUCATOR_CLOSING =
  '본 서약을 위반할 경우, 재단의 교육사업과 관련한 강사 자격이 제한되거나 향후 활동에 불이익이 있을 수 있음을 인지하고 이에 동의합니다.'

export const NOTICE_TABLE_HEADERS = ['연번', '행정정보명', '연번', '행정정보명'] as const
export const NOTICE_TABLE_FIRST_ROW = [
  '1',
  '성범죄경력 및 아동학대관련 범죄전력 조회',
  '',
  '',
] as const
export const NOTICE_TABLE_FOOTER =
  '* 이용기관은 본인이 동의한 위 공동이용 행정정보를 확인하기 위해 「개인정보 보호법」 시행령 제19조에 따라 주민등록번호, 여권번호, 운전면허번호 또는 외국인등록번호가 포함된 행정정보를 처리할 수 있습니다. 이용기관이 요청하는 경우 기재하여 주십시오(필요시 기재사항)'

export const NOTICE_CONSENT_LINES = [
  '○ 본인은 위 사무의 처리를 위하여 「전자정부법」 제36조에 따른 행정정보 공동이용을 통해 이용기관의 업무처리담당자가 전자적으로 본인의 구비서류(공동이용 행정정보)를 확인하는 것에 동의합니다.',
  '* 만일, 본인이 위 행정정보 이용에 대해 동의를 하지 아니할 경우에도 불이익은 없습니다. 다만, 동의하지 아니한 경우에는 본인이 해당 구비서류를 제출하여야 합니다.',
] as const

export const NOTICE_CONFIRMATION = '위와 같은 행정정보 공동이용에 대한 내용을 모두 확인했습니다.'

export const NOTICE_ID_TYPE_OPTIONS = [
  { value: 'resident', label: '주민등록번호' },
  { value: 'passport', label: '여권번호' },
  { value: 'driver', label: '운전면허번호' },
  { value: 'alien', label: '외국인등록번호' },
] as const

export const CRIME_INTRO =
  '본인은 JA Korea 교육·봉사 활동 참여를 위하여 성범죄 경력 조회 및 아동학대 관련 범죄전력 조회에 동의합니다. 조회 결과는 관련 법령에 따라 목적 범위 내에서만 이용됩니다.'
export const CRIME_FOOTER =
  '위의 성범죄 경력 조회 및 아동학대 관련 범죄전력 조회에 대한 동의를 거부할 권리가 있습니다. 다만 미동의 시 프로그램 강의 참여에 제한이 있을 수 있습니다.'
