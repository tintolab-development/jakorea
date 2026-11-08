import type { TermsDocumentContent, TermsTable } from './documents'

const itemColumns: TermsTable['columns'] = [
  { key: 'category', label: '구분', width: '28%' },
  { key: 'items', label: '처리 항목', align: 'left' },
]

const periodColumns: TermsTable['columns'] = [
  { key: 'category', label: '구분', width: '28%' },
  { key: 'period', label: '보유 및 이용기간', align: 'left' },
]

const consignColumns: TermsTable['columns'] = [
  { key: 'vendor', label: '수탁사', width: '24%' },
  { key: 'task', label: '위탁 업무', align: 'left' },
  { key: 'period', label: '보유 및 이용기간', width: '32%', align: 'left' },
]

const thirdPartyColumns: TermsTable['columns'] = [
  { key: 'recipient', label: '제공받는 자', width: '22%' },
  { key: 'purpose', label: '제공 목적' },
  { key: 'items', label: '제공 항목' },
  { key: 'period', label: '보유 및 이용기간', width: '18%' },
]

const officerColumns: TermsTable['columns'] = [
  { key: 'role', label: '구분' },
  { key: 'name', label: '성명' },
  { key: 'title', label: '직책/부서' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
]

/** JA Korea 개인정보처리방침 (시행 2023. 5. 2) */
export const PRIVACY_NOTICE_CONTENT: TermsDocumentContent = {
  intro:
    '본 개인정보처리방침은 JA Korea가 운영하는 웹사이트 및 관련 온라인 서비스에서 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지, 이용자와 법정대리인이 어떤 권리를 행사할 수 있는지를 안내하기 위한 문서입니다.',
  sections: [
    {
      heading: '1. 개인정보의 처리목적',
      paragraphs: [
        'JA Korea는 다음의 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의 용도로 이용하지 않으며, 이용 목적이 변경되는 경우 관련 법령에 따라 별도 동의를 받거나 필요한 고지를 진행합니다.',
        '\n',
        '•	회원가입, 회원 식별, 본인확인 및 중복가입 방지',
        '•	이메일 ID 기반 로그인 및 계정 관리',
        '•	휴대폰 본인인증 및 만 14세 이상/미만 연령 확인',
        '•	일반 회원 및 교사 회원 등 회원 유형별 서비스 제공',
        '•	만 14세 미만 일반 회원의 법정대리인 본인인증 및 동의 확인',
        '•	교육 프로그램 신청, 참여, 운영, 이력 관리 및 관련 안내',
        '•	교사 회원 서비스 제공 및 학교/기관 기반 활동 운영 지원',
        '•	강사·봉사자 신청, 선발, 활동 관리',
        '•	강사비·활동비 등 정산 및 지급, 원천징수·지급명세서 제출 등 세무 처리',
        '•	수료증·참가인증서·활동인증서 발급',
        '•	초상권 동의에 따른 교육 운영 기록, 결과 보고 및 홍보물 제작·게시',
        '•	마이페이지, 신청 내역, 참여 이력, 알림 등 회원 서비스 제공',
        '•	Google, 네이버, 카카오 등 소셜 계정 연결 및 간편 로그인 제공',
        '•	인재채용 지원, 재능기부 신청, 기업 후원 상담 신청 처리',
        '•	공지사항, 서비스 관련 안내, 문의 및 민원 처리',
        '•	부정 이용 방지, 계정 보호, 보안 사고 예방 및 감사 대응',
        '•	관리자 계정 관리 및 2단계 인증을 통한 어드민 서비스 접근 통제',
        '•	마케팅 정보 수신에 동의한 회원에 대한 프로그램, 행사, 캠페인 안내',
        '•	뉴스레터 구독에 동의한 이용자(비회원 포함)에 대한 뉴스레터 발송',
      ],
    },
    {
      heading: '2. 처리하는 개인정보 항목',
      paragraphs: [
        'JA Korea는 서비스 제공을 위해 아래와 같은 개인정보를 처리할 수 있습니다. 실제 수집 항목 및 필수/선택 여부는 회원가입 화면과 각 동의서에 명확히 표시합니다.',
      ],
      table: {
        columns: itemColumns,
        rows: [
          {
            id: 'common',
            cells: {
              category: '공통 필수 항목',
              items:
                '이름, 성별 및 생년월일, 이메일 주소, 비밀번호, 회원 유형, 가입 일시, 회원 상태 /\n만 14세 이상: 휴대폰 번호, 본인인증 결과(인증 여부·일시), 중복가입 확인정보(CI·DI 암호화값)',
            },
          },
          {
            id: 'identity',
            cells: {
              category: '본인확인 정보',
              items:
                '본인인증 결과(인증 여부·일시),\n중복가입 확인정보(CI·DI 암호화값) — CI·DI는 단방향 암호화(해시)하여 저장',
            },
          },
          {
            id: 'general',
            cells: {
              category: '일반 회원 추가 항목',
              items: '자택 주소지, 학교 재학 여부, 소속·학교, 학년, 1365 ID(선택)',
            },
          },
          {
            id: 'under-age',
            cells: {
              category: '만 14세 미만 일반 회원 추가 항목',
              items:
                '법정대리인 이름, 법정대리인 휴대폰 번호, 가입자와의 관계, 법정대리인 본인인증 결과,\n법정대리인 중복가입 확인정보(CI·DI 암호화값), 법정대리인 동의 여부, 동의 일시, 동의 약관 버전, 프로그램 신청·영수증 사전 동의서 작성 시 법정대리인 본인인증 결과·가입자와의 관계',
            },
          },
          {
            id: 'teacher',
            cells: {
              category: '교사 회원 추가 항목',
              items: '소속 학교·기관명, 재직 현황, 학교/기관 주소 또는 소재지',
            },
          },
          {
            id: 'admin',
            cells: {
              category: '관리자 계정 정보',
              items:
                '이름, 성별, 생년월일, 휴대폰 번호, 이메일 주소(@jakorea.org 아이디), 비밀번호, 본인인증 결과·중복가입 확인정보(CI·DI 암호화값), 권한 유형, 담당 프로그램, 2단계 인증(MFA) 등록 정보',
            },
          },
          {
            id: 'instructor-identity',
            cells: {
              category: '강사 회원 추가 항목',
              items:
                '학력(최종 학력·재학 상태), 경력, JA Korea 활동 이력, 자격·수상·수료 내역, 소속 및 재직 상태,\n자택 주소, 사업소득자 여부, 한 줄 소개·자기소개(자유 작성 항목), JA 평가 등급(관리자 내부 평가)',
            },
          },
          {
            id: 'instructor-ujat-volunteer-agreement',
            cells: {
              category: '강사·UJAT 봉사자 동의서',
              items:
                '교육진행자 서약서, 행정정보 공동이용 사전동의서(성명, 생년월일, 전화번호, 주민등록번호 등 식별번호), 성범죄경력 조회 동의서(성명, 주소, 주민등록번호 또는 외국인등록번호, 연락처), 전자서명',
            },
          },
          {
            id: 'accounting-info',
            cells: {
              category: '정산·세무 정보',
              items:
                '성명, 영문 성명, 생년월일, 소속, 주민등록번호, 자택 주소, 전화번호, 이메일, 정산 계좌, 지급 목적·금액, 영수증·증빙 자료 (정산 계좌는 지급조서·영수증 사전 동의서 작성 시 수집하며, 주민등록번호는 지급조서 사전 동의서 작성 건만 처리하며, 영수증 사전 동의서로 실비만 받는 경우 수집하지 않음)',
            },
          },
          {
            id: 'program-application-info',
            cells: {
              category: '프로그램 신청 정보',
              items:
                '신청서별 기재 항목(이름, 연락처, 이메일, 소속 등), 결석 사유·증빙자료,\n개인정보 수집·이용 및 제3자 제공 동의 이력',
            },
          },
          {
            id: 'student-list',
            cells: {
              category: '학생 명단(교사 업로드)',
              items: '학생명, 성별, 생년월일, 학급, 연락처, 이메일',
            },
          },
          {
            id: 'copyright-agreement',
            cells: {
              category: '초상권',
              items: '사진, 영상, 이름, 소속',
            },
          },
          {
            id: 'sponsorship-consultation',
            cells: {
              category: '기업 후원 상담',
              items:
                '기업명, 담당자 이름, 부서명·직함, 휴대폰 번호, 상담 내용, 링크·첨부파일(선택)',
            },
          },
          {
            id: 'donation-application',
            cells: {
              category: '재능기부 신청',
              items:
                '이름, 생년월일, 성별, 휴대폰 번호, 이메일, 소속, 자택 주소, 재능기부 가능 기간,\n약력·재능 소개·참여 동기, JA 프로그램 참여 이력, 자유 제출 파일(선택)',
            },
          },
          {
            id: 'recruitment-application',
            cells: {
              category: '인재채용(인재풀)',
              items:
                '관심 직무/분야, 이름, 휴대폰 번호, 이메일, 자택 주소, 최종학력, 학력 정보,\n경력·경험·자격 정보, 경력 증빙서류(선택)',
            },
          },
          {
            id: 'newsletter-subscription',
            cells: {
              category: '뉴스레터 구독',
              items: '이름, 이메일 주소',
            },
          },
          {
            id: 'inquiry',
            cells: {
              category: '문의',
              items: '문의 내용 및 답변, 작성자 연락처·이메일',
            },
          },
          {
            id: 'social-account-info',
            cells: {
              category: '소셜 계정 연결 정보',
              items: '소셜 계정 제공자, 소셜 계정 식별자, 소셜 계정 이메일, 연결 일시, 연결 상태',
            },
          },
          {
            id: 'log-info',
            cells: {
              category: '서비스 이용 과정에서 자동 생성되는 정보',
              items:
                '접속 로그, IP 주소, 쿠키, 기기 정보, 브라우저 정보, 서비스 이용 기록, 인증/보안 로그',
            },
          },
        ],
      },
      afterParagraphs: [
        '※ 동의 없이 법령에 따라 처리하는 개인정보: 지급조서 사전 동의서에 따른 강사비·실비 지급 시 주민등록번호는 「소득세법」에 따른 원천징수 및 지급명세서 제출을 위해 처리하며, 지급조서 등 정산 증빙은 「상속세 및 증여세법」 제51조에 따라 10년간 보관합니다. 영수증 사전 동의서로 실비만 지급받는 경우 주민등록번호를 처리하지 않습니다.',
      ],
    },
    {
      heading: '3. 개인정보의 처리 및 보유기간',
      paragraphs: [
        'JA Korea는 개인정보의 수집·이용 목적이 달성되거나 회원이 탈퇴하는 경우 지체 없이 해당 개인정보를 파기합니다. 다만 관련 법령에 따라 보관이 필요한 정보 또는 분쟁 대응, 정산, 감사 등 운영상 필요한 정보는 해당 법령 및 내부 기준에 따라 분리 보관할 수 있습니다.',
      ],
      table: {
        columns: periodColumns,
        rows: [
          {
            id: 'member',
            cells: {
              category: '회원 정보',
              period:
                '회원 탈퇴 시까지. 단, 법령상 보관 또는 분쟁 대응이 필요한 경우 해당 기간 동안 분리 보관',
            },
          },
          {
            id: 'admin-account-info',
            cells: {
              category: '관리자 계정 정보(2단계 인증 등록 정보 포함)',
              period:
                '회원 탈퇴 시까지 (CI·DI 암호화값은 탈퇴 시 즉시 파기, 관리자 로그인·접근권한 변경 이력은 3년 보관)',
            },
          },
          {
            id: 'withdrawn-member-agreement-history',
            cells: {
              category: '탈퇴 회원 약관 동의 이력',
              period: '탈퇴 후 2년',
            },
          },
          {
            id: 'dormant-member',
            cells: {
              category: '휴면 회원',
              period:
                '1년 미로그인 시 휴면 전환, 휴면 포함 3년 시점 자동 탈퇴(관리자 계정은 3개월 미로그인 시 휴면 전환)',
            },
          },
          {
            id: 'social-account-info',
            cells: {
              category: '소셜 계정 연결 정보',
              period: '소셜 계정 연결 해제 또는 회원 탈퇴 시까지',
            },
          },
          {
            id: 'marketing',
            cells: {
              category: '마케팅 수신 동의 정보',
              period: '동의 철회 또는 회원 탈퇴 시까지 (동의일로부터 2년마다 수신 동의 여부 확인)',
            },
          },
          {
            id: 'newsletter-subscription-info',
            cells: {
              category: '뉴스레터 구독 정보',
              period: '구독 해지(수신 거부) 시까지 (동의일로부터 2년마다 수신 동의 여부 확인)',
            },
          },
          {
            id: 'guardian',
            cells: {
              category: '법정대리인 동의 이력',
              period:
                '회원 탈퇴 또는 만 14세 이상 회원 전환 시까지 보관,\n탈퇴(동의 철회 요청에 따른 탈퇴 포함)·전환 후 최소 증빙(동의 여부·일시·약관 버전)만 3년 보관',
            },
          },
          {
            id: 'identity',
            cells: {
              category: '본인인증 정보',
              period:
                '인증 완료 여부·일시: 회원 탈퇴 시까지 / CI·DI 암호화값(회원·법정대리인): 회원 탈퇴 시 즉시 파기\n(법정대리인 CI·DI는 만 14세 이상 회원 전환 시에도 즉시 파기)',
            },
          },
          {
            id: 'program-application-info',
            cells: {
              category: '프로그램 신청 정보(결석 사유·증빙자료 포함)·제3자 제공 동의',
              period: '동의일로부터 3년',
            },
          },
          {
            id: 'student-list',
            cells: {
              category: '학생 명단(교사 업로드)',
              period: '해당 프로그램 신청 정보와 같은 기간(동의일로부터 3년)',
            },
          },
          {
            id: 'certificate',
            cells: {
              category: '수료증·참가인증서·활동인증서',
              period: '프로그램 신청일로부터 3년 이내 발급',
            },
          },
          {
            id: 'copyright-agreement',
            cells: {
              category: '초상권(사진·영상)',
              period: '동의일로부터 1년 (홍보자료로 제작된 경우 활용이 지속될 수 있음)',
            },
          },
          {
            id: 'guardian-info',
            cells: {
              category:
                '만 14세 미만 회원의 프로그램 신청·영수증 사전 동의서 작성 시 보호자 본인인증 정보',
              period:
                '해당 신청의 초상권 수집·이용 동의서 또는 영수증 사전 동의서와 같은 기간 보관 후 파기',
            },
          },
          {
            id: 'student-agreement-file',
            cells: {
              category: '교사 업로드 학생 초상권 동의서',
              period:
                '업로드일로부터 1년 유효, 만료 후 3년 접근 제한 보관 후 파기(분쟁 대응용 분리 보관)',
            },
          },
          {
            id: 'educator-agreement-file',
            cells: {
              category: '교육진행자 서약서·행정정보 공동이용·성범죄경력 조회 동의서',
              period: '유효기간 동의일로부터 1년 / 보유기간 활동 종료 후 3년',
            },
          },
          {
            id: 'electronic-signature-agreement-file',
            cells: {
              category: '전자서명 포함 동의서 원본 파일',
              period:
                '탈퇴·동의 만료 후 3년 접근 제한 보관 후 파기\n(분쟁 대응용 분리 보관, 강사 제출 문서는 활동 종료 후 3년)',
            },
          },
          {
            id: 'instructor-application-info',
            cells: {
              category: '강사 신청서 기재 정보·JA 평가 등급',
              period:
                '강사 활동 종료 후 3년 (활동 종료일 = 강사 권한 종료일과 회원 탈퇴일 중 빠른 날)',
            },
          },
          {
            id: 'payment-receipt-agreement-file',
            cells: {
              category: '지급조서 사전 동의서·영수증 사전 동의서',
              period:
                '동의일로부터 10년\n(동의 이력은 10년 유지, 동의서 파일은 시스템 1년 보관 후 JA Korea가 서면으로 보관)',
            },
          },
          {
            id: 'payment-receipt-file',
            cells: {
              category: '지급조서·정산 증빙',
              period:
                '시스템 내 1년 보관 후 파기 (지급조서 원본은 관계 법령에 따라 10년 별도 보관)',
            },
          },
          {
            id: 'inquiry-answer',
            cells: {
              category: '문의·답변',
              period: '처리 완료 후 1년',
            },
          },
          {
            id: 'human-resources-application-info',
            cells: {
              category: '인재채용·재능기부·기업 후원 상담 신청 정보',
              period: '동의일로부터 6개월 (파기 요청 시 즉시)',
            },
          },
          {
            id: 'log',
            cells: {
              category: '접속/보안/감사 로그',
              period:
                '관리자 로그인 이력·접근권한 변경 이력 3년 / 회원 로그인 이력 1년 / 개인정보 조회·다운로드 이력 2년',
            },
          },
          {
            id: 'privacy-deletion-history',
            cells: {
              category: '개인정보 파기 이력·권리 요청 처리 이력',
              period: '3년',
            },
          },
        ],
      },
      afterParagraphs: [
        '관련 법령 또는 내부 정책상 별도 보관이 필요한 경우, 해당 정보는 목적에 필요한 범위로 분리 보관하며 보관기간 만료 후 파기합니다.',
      ],
    },
    {
      heading: '4. 개인정보의 제3자 제공',
      paragraphs: [
        'JA Korea는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의한 경우, 관련 법령에 따라 제공이 요구되는 경우, 수사기관 등 적법한 절차에 따른 요청이 있는 경우에는 예외적으로 개인정보를 제공할 수 있습니다. 현재 제공 현황은 다음과 같습니다.',
      ],
      table: {
        columns: thirdPartyColumns,
        rows: [
          {
            id: 'nts',
            cells: {
              recipient: '국세청',
              purpose: '원천징수 신고, 지급명세서 제출 (소득세법) — 지급조서 사전 동의서 작성 건',
              items: '성명, 주민등록번호, 주소, 지급 금액',
              period: '관계 법령에 따른 기간',
            },
          },
          {
            id: 'chest',
            cells: {
              recipient: '사회복지공동모금회',
              purpose:
                '배분사업 사업비 집행 내역 확인 및 정산 (지급조서·영수증 사전 동의서 모두 선택 동의)',
              items: '성명, 생년월일, 주소, 전화번호, 이메일, 계좌정보',
              period: '10년',
            },
          },
          {
            id: 'assigned-school',
            cells: {
              recipient: '교육진행자가 배정된 학교·기관',
              purpose:
                '교육진행자 성범죄경력 확인(기관이 [JA 시스템 내에서 동의서 확인]을 선택한 경우)',
              items:
                '성범죄경력 조회 동의서(성명, 주소, 주민등록번호 또는 외국인등록번호, 연락처), 행정정보 공동이용 사전동의서(성명, 생년월일, 전화번호, 주민등록번호 등 식별번호)',
              period: '해당 교육 종료 시까지',
            },
          },
          {
            id: '1365',
            cells: {
              recipient: '1365 자원봉사포털(행정안전부)',
              purpose: '봉사시간 등록·인증',
              items: '성명, 생년월일, 1365 ID, 봉사시간',
              period: '해당 기관의 보유기간',
            },
          },
          {
            id: 'program-third-party',
            cells: {
              recipient: '프로그램별 제3자',
              purpose: '프로그램 신청서에 기재된 목적',
              items: '프로그램 신청서에 기재된 항목',
              period: '동의일로부터 3년',
            },
          },
        ],
      },
      afterParagraphs: [
        '※ 프로그램별 제3자 제공은 신청 시 제공받는 자·목적·항목·기간을 별도로 알리고 동의를 받습니다.',
      ],
    },
    {
      heading: '5. 개인정보 처리업무의 위탁',
      paragraphs: [
        'JA Korea는 원활한 서비스 제공을 위해 개인정보 처리업무의 일부를 외부 업체에 위탁하고 있으며, 위탁 현황은 다음과 같습니다.',
      ],
      table: {
        columns: consignColumns,
        rows: [
          {
            id: 'nice',
            cells: {
              vendor: 'NICE평가정보',
              task: '휴대폰 본인인증 및 본인확인',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
          {
            id: 'nhn',
            cells: {
              vendor: 'NHN Cloud',
              task: '알림톡·문자·메일을 통한 서비스 이용 안내 발송',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
          {
            id: 'stibee',
            cells: {
              vendor: '스티비',
              task: '뉴스레터 발송',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
          {
            id: 'cloud',
            cells: {
              vendor: 'Amazon Web Services, Inc.\n(AWS 서울 리전)',
              task: '시스템 운영, 데이터 보관 및 인프라 관리',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
          {
            id: 'accounting-firm',
            cells: {
              vendor: '세빛세무회계사무소',
              task: '원천세 신고 등 세무 신고 대행',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
          {
            id: 'social',
            cells: {
              vendor: '바라봄 사진관',
              task: '홍보 영상·자료 제작,\n온라인 게시 및 인쇄물 발간',
              period: '위탁계약 종료 또는 목적 달성 시까지',
            },
          },
        ],
      },
      afterParagraphs: [
        'Google·네이버·카카오 간편 로그인은 회원이 직접 계정을 연결하는 경우에 한해 연결 식별값을 받으며, 개인정보 처리위탁에 해당하지 않습니다.\nJA Korea는 위탁계약 체결 시 개인정보가 안전하게 처리될 수 있도록 관련 법령에 따른 관리·감독을 수행합니다.',
      ],
    },
    {
      heading: '6. 개인정보의 파기 절차 및 방법',
      paragraphs: [
        'JA Korea는 개인정보 보유기간의 경과, 처리 목적 달성, 회원 탈퇴 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.',
        '• 전자적 파일 형태의 개인정보는 복구 및 재생이 불가능한 방법으로 삭제합니다.',
        '• 종이 문서에 기록된 개인정보는 분쇄하거나 소각합니다.',
        '• 법령 또는 내부 정책에 따라 보관이 필요한 정보는 별도 데이터베이스 또는 보관 영역으로 분리하여 보관하고, 보관기간 만료 후 파기합니다.',
        '• 파기 이력은 파기 일시, 파기 대상, 파기 사유, 처리자 등 필요한 항목을 기록하여 관리합니다.',
      ],
    },
    {
      heading: '7. 정보주체와 법정대리인의 권리·의무 및 행사방법',
      paragraphs: [
        '이용자와 회원은 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다. 만 14세 미만 회원의 법정대리인은 아동의 개인정보에 대해 동일한 권리를 행사할 수 있습니다.',
        '• 개인정보 열람 요청',
        '• 오류 등이 있는 개인정보의 정정 요청',
        '• 개인정보 삭제 요청',
        '• 개인정보 처리정지 요청',
        '• 동의 철회 및 마케팅 수신 거부 요청',
        '권리 행사는 마이페이지(회원정보 수정·동의 철회·회원 탈퇴)에서 직접 하거나, 홈페이지 문의 또는 본 방침 10. 개인정보 보호책임자에게 이메일·전화로 요청할 수 있습니다. JA Korea는 요청을 받은 날로부터 10일 이내에 처리 결과를 알려 드립니다. 단, 법령에 따라 보관이 필요한 정보는 해당 기간 동안 보관될 수 있습니다.',
      ],
    },
    {
      heading: '8. 개인정보의 안전성 확보조치',
      paragraphs: [
        'JA Korea는 개인정보의 안전성 확보를 위해 다음과 같은 기술적·관리적·물리적 보호조치를 적용합니다.',
        '•	개인정보 접근 권한의 최소화 및 권한 관리',
        '•	비밀번호, 주민등록번호, 계좌번호 등 주요 정보의 암호화 저장',
        '•	개인정보 조회, 수정, 다운로드 등 주요 처리 이력의 기록 및 보관',
        '•	개인정보가 포함된 데이터의 암호화 및 전송구간 보호',
        '•	해킹, 악성코드, 비인가 접근 방지를 위한 보안 프로그램 및 접근 통제 적용',
        '•	개인정보 취급자에 대한 교육 및 관리·감독',
        '•	개인정보 처리 시스템의 접속기록 보관 및 이상행위 점검',
        '•	출입이 통제된 클라우드 데이터센터(AWS 서울 리전)에 개인정보 보관',
      ],
    },
    {
      heading: '9. 쿠키 등 자동 수집 장치의 설치·운영 및 거부',
      paragraphs: [
        'JA Korea는 웹사이트 이용 편의 제공, 로그인 상태 유지, 서비스 개선 및 이용 통계 분석을 위해 쿠키를 사용할 수 있습니다.',
        '• 쿠키는 이용자의 브라우저에 저장되는 작은 정보 파일입니다.',
        '• 이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.',
        '• 쿠키 저장을 거부하는 경우 일부 서비스 이용에 제한이 발생할 수 있습니다.',
      ],
    },
    {
      heading: '10. 개인정보 보호책임자',
      paragraphs: [
        'JA Korea는 개인정보 처리에 관한 업무를 총괄하고 개인정보 관련 문의, 불만 처리 및 피해 구제를 위해 개인정보 보호책임자를 지정합니다.',
      ],
      table: {
        columns: officerColumns,
        rows: [
          {
            id: 'dpo',
            cells: {
              role: '개인정보 보호책임자',
              name: '이선아',
              title: '사무국장',
              phone: '02-783-2367',
              email: 'salee@jakorea.org',
            },
          },
        ],
      },
    },
    {
      heading: '11. 권익침해 구제방법',
      paragraphs: [
        '이용자는 개인정보 침해에 대한 상담이나 신고가 필요한 경우 아래 기관에 문의할 수 있습니다.',
        '•	개인정보침해신고센터: privacy.kisa.or.kr / 국번 없이 118',
        '•	개인정보분쟁조정위원회: www.kopico.go.kr / 1833-6972',
        '•	대검찰청: www.spo.go.kr / 국번 없이 1301',
        '•	경찰청: ecrm.police.go.kr / 국번 없이 182',
      ],
    },
    {
      heading: '12. 개인정보처리방침의 변경',
      paragraphs: [
        '본 개인정보처리방침은 시행일로부터 적용됩니다. 내용이 변경되는 경우 JA Korea는 웹사이트 공지사항 또는 서비스 화면을 통해 변경 사항을 안내합니다. 변경 사항은 시행일 7일 전(회원에게 불리하거나 중요한 변경은 30일 전)부터 안내하며, 관련 법령상 동의가 필요한 경우 별도 동의를 받습니다. 이전 개인정보처리방침은 공지사항에서 확인할 수 있습니다.',
      ],
      table: {
        columns: [
          { key: 'label', label: '항목', width: '42%' },
          { key: 'value', label: '내용' },
        ],
        rows: [
          { id: 'effective', cells: { label: '시행일', value: '2026년 11월 16일(월)' } },
          { id: 'revised', cells: { label: '최종 개정일', value: '2026년 11월 16일(월)' } },
          {
            id: 'notice',
            cells: { label: '변경 고지 방법', value: '웹사이트 공지사항 또는 서비스 화면 고지' },
          },
        ],
      },
    },
  ],
}
