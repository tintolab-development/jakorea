# Google Forms API 연동 분석

## 검증 결과

### Google Forms API 현황 (2025년 기준)

#### 1. 공식 Google Forms API
- ❌ **공식 Forms API는 존재하지 않음**
- Google Apps Script를 통한 간접적인 접근만 가능

#### 2. 가능한 대안

**A. Google Apps Script + Web App**
- Google Forms의 응답을 받는 Web App 생성
- HTTP POST 요청으로 데이터 전송 가능
- 제한사항: 인증 필요, CORS 이슈 가능

**B. Google Sheets API (간접적 방법)**
- Google Forms의 응답이 자동으로 Google Sheets에 저장됨
- Google Sheets API를 통해 데이터 추가 가능
- 제한사항: Forms 직접 연동 아님, 간접적 방법

**C. Google Forms Embed + formSubmit 이벤트**
- iframe으로 Google Forms 임베드
- formSubmit 이벤트로 제출 완료 감지
- 제한사항: 데이터 접근 불가, 단순 제출 완료 확인만

### 결론

**구글폼 API 직접 연동은 불가능**하므로, **구글폼 스타일의 폼을 직접 구현**하는 것이 적합합니다.

## 구현 방향

### 현재 시스템 분석
- ✅ 정산 관리 기능 존재 (관리자 중심)
- ✅ 정산 항목: 강사비, 교통비, 숙박비, 기타
- ❌ **강사가 직접 정산 정보를 제출하는 폼 없음**

### 필요 기능

1. **강사 정산 제출 폼** (구글폼 스타일)
   - 프로그램/강의 선택
   - 강사비, 교통비, 숙박비 입력
   - 증빙 파일 업로드 (유류비 등)
   - 총액 자동 계산
   - 제출 기능

2. **제출 데이터 처리**
   - Settlement 엔티티로 변환
   - 상태를 'pending' 또는 'submitted'로 설정
   - 관리자가 승인/검토할 수 있도록 연동

### 구현 위치

- **경로**: `/settlements/submit` 또는 `/instructors/settlements/submit`
- **접근**: 강사가 자신의 정산 정보를 제출하는 페이지








