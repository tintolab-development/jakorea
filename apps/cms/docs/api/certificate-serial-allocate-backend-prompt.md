# 인증서 고유번호 발급 API — 백엔드 구현 프롬프트

> 작성: 2026-09-02  
> 대상: Java CMS Backend (Members / Certificates)  
> FE 호출: `apps/cms/src/features/program/shared/api/certificate-serial-api.ts`  
> 배경: `apps/cms/docs/api/form-template-document-download-backend-handoff.md` §11

아래 블록을 백엔드 구현 에이전트·담당자에게 **그대로 전달**하면 된다.

---

## 프롬프트 (복사용)

```
당신은 JA Korea CMS Java 백엔드를 구현한다.
이번 범위는 PDF 생성이 아니다. 인증서 고유번호 장부와 멱등 발급 API만 구현한다.

# 배경

CMS 관리자가 프로그램 실발급 화면에서 수료증·참가인증서·강사 활동인증서·봉사 활동인증서를 PDF로 받는다.
PDF 파일 자체는 프론트 브라우저가 html2canvas로 만든다. 서버는 PDF를 그리지 않는다.

인증서 좌측 상단 고유번호 형식은 `YY-JA-NNNNN` 이다. 예: `26-JA-00017`.
화면 미리보기는 하드코딩 플레이스홀더 `26-JA-00000` 을 보여 주고, 장부에 INSERT 하지 않는다.
실제 번호는 관리자가 「파일 다운로드」를 누른 뒤에만 발급한다.

프론트는 이전에 나간 번호를 전부 갖고 있지 않다. 겹침 검증·시퀀스 증가는 백엔드 DB에서만 한다.
프론트 카운터/해시로 번호를 확정하면 동시 다운로드에서 겹친다. 금지.

# 구현할 API

POST /api/admin/certificates/issues/serial
Authorization: 관리자 Bearer JWT (기존 /api/admin/certificates/* 와 동일)
Content-Type: application/json

요청 JSON:
{
  "programId": 5001,
  "participantId": 7001,
  "certificateType": "document-3"
}

- programId: 프로그램 ID. Long. 필수. 없으면 400.
- participantId: 프로그램 참가자 ID. Long. 필수. 기존 POST /api/admin/certificates/issues/bulk 의 participantIds 와 같은 식별 체계를 쓴다.
- certificateType: 문자열. 프론트가 보내는 값을 그대로 저장한다. COMPLETION/ACTIVITY 로 축약하지 않는다.

허용 certificateType (이 외는 400):
- document-3 수료증
- document-participation-certificate 참가인증서
- document-4 강사 활동 인증서
- document-5 봉사 활동 인증서

중요: 기존 bulk 발급 OpenAPI 예시는 certificateType=COMPLETION | ACTIVITY 이다.
이번 고유번호 API에서는 수료증과 참가인증서를 절대 한 값으로 합치지 않는다.
합치면 같은 사람이 수료증·참가인증서를 받아도 번호가 하나가 된다. 제품 요구와 다르다.
document-4 와 document-5 도 서로 다른 유형이다.

성공 HTTP 200. 응답은 공통 래퍼 { "success": true, "data": { ... } } 또는 data DTO 직접. 프론트는 unwrapApiBody 로 data를 꺼낸다.

data:
{
  "serialNumber": "26-JA-00017",
  "issueId": 12,
  "reused": false
}

- serialNumber: 필수. 정규식 ^\d{2}-JA-\d{5}$ . NNNNN은 00001 이상. 00000 금지.
- issueId: 장부 PK. 있으면 프론트가 보관한다.
- reused: 이미 같은 (programId, participantId, certificateType) 행이 있어 기존 번호를 돌려준 경우 true. 신규 발급이면 false.

같은 키로 다시 호출하면 새 번호를 뽑지 않고 기존 serialNumber 를 반환한다. HTTP도 200. reused=true.

# 하지 말 것

- PDF/이미지 생성, iText, OpenHTMLToPDF, Headless 캡처
- 미리보기 오픈 시 발급
- serialNumber 로 26-JA-00000 저장 또는 응답
- 프론트가 보낸 sequence 를 신뢰
- certificateType 을 COMPLETION/ACTIVITY 두 값으로 축소
- 기존 POST /api/admin/certificates/issues/bulk 동작 파괴. 컬럼 추가는 하위호환.

# 데이터 모델

인증서 발급 장부(기존 certificate_issue 가 있으면 확장, 없으면 신규).

필수 컬럼:
- id (PK, issueId)
- program_id NOT NULL
- participant_id NOT NULL
- certificate_type VARCHAR NOT NULL  -- FE templateCode 그대로
- serial_number VARCHAR(12) NOT NULL  -- 예 26-JA-00017
- issued_at DATETIME NOT NULL  -- 최초 발급 확정 시각. 재다운로드로 바꾸지 않음
- issued_by_admin_id nullable
- created_at / updated_at 관례대로

제약:
- UNIQUE (serial_number)  -- 과거 적재분 포함, 전역 문자열 고유
- UNIQUE (program_id, participant_id, certificate_type)  -- 대상 멱등
- serial_number <> '26-JA-00000' 체크 제약 권장
- serial_number 형식 체크 권장: [0-9]{2}-JA-[0-9]{5}

연도별 시퀀스 테이블 또는 DB sequence:
- 예: certificate_serial_year (issue_year SMALLINT PK, next_value INT)
- 또는 MySQL/Postgres sequence 를 연도별로 생성
- next_value 는 1부터. 실제 번호의 NNNNN 은 최소 1
- 해가 바뀌면 해당 연도 시퀀스는 1부터. 문자열에 연도가 들어가므로 26-JA-00001 과 27-JA-00001 은 UNIQUE 충돌이 아니다

기존에 이미 인쇄·다운로드된 번호가 있으면:
1) 같은 serial_number UNIQUE 테이블에 적재한다
2) 해당 연도 시퀀스 시작값은 MAX(그 연도 NNNNN)+1
3) 적재 전 GROUP BY serial_number HAVING COUNT(*)>1 이 0건이어야 UNIQUE 생성이 된다
적재 데이터가 없으면 시퀀스 1부터.

# 발급 알고리즘 (한 트랜잭션, 동시성 안전)

의사코드:

function allocate(programId, participantId, certificateType, adminId):
  validate programId, participantId, certificateType
  BEGIN TX
    existing = SELECT * FROM certificate_issue
               WHERE program_id=? AND participant_id=? AND certificate_type=?
               FOR UPDATE
    if existing:
      COMMIT
      return { serialNumber: existing.serial_number, issueId: existing.id, reused: true }

    year = 서버 현재 시각의 연도 (Asia/Seoul)
    yy = year % 100  (2자리, 2026 -> 26)

    loop 최대 N회 (예 20):
      seq = nextSerialForYear(year)  // 연도 행 SELECT FOR UPDATE 후 next_value++ 또는 DB nextval
      serial = format("%02d-JA-%05d", yy, seq)
      if serial ends with 00000: continue
      try:
        INSERT certificate_issue (program_id, participant_id, certificate_type, serial_number, issued_at, issued_by_admin_id)
        COMMIT
        return { serialNumber: serial, issueId: newId, reused: false }
      catch unique_violation on serial_number:
        // 과거 적재분 또는 레이스. 다음 seq로 재시도
        continue
      catch unique_violation on (program_id, participant_id, certificate_type):
        // 동시 같은 대상. 기존 행을 읽어 반환
        row = SELECT ... WHERE program_id=? AND participant_id=? AND certificate_type=?
        COMMIT
        return { serialNumber: row.serial_number, issueId: row.id, reused: true }

    ROLLBACK
    500 또는 409 + 재시도 안내

nextSerialForYear 는 반드시 DB 락/시퀀스여야 한다. 애플리케이션 static int 금지.

# 에러

- 401/403: 기존 admin API 와 동일
- 400: programId/participantId 누락, certificateType 미허용, 숫자 파싱 실패
- 404: 참가자 또는 프로그램이 없을 때. 정책상 존재 검증을 하면 404, 안 하면 발급만 해도 됨. 존재 검증을 권장
- 409/500: 시퀀스 고갈(연 99999 초과) 또는 재시도 한도 초과
- 이 API를 아직 안 만들던 시절 프론트는 404/501 이면 mock 번호로 폴백한다. 구현 후에는 200만 주면 된다. 501로 성공을 흉내내지 말 것

# OpenAPI

members(또는 certificates) OpenAPI에 추가:
- path: /api/admin/certificates/issues/serial
- operationId 예: allocateCertificateSerial
- request: CertificateSerialAllocateRequest { programId int64 required, participantId int64 required, certificateType string required }
- response data: CertificateSerialAllocateResponse { serialNumber string required, issueId int64, reused boolean }
- CertificateIssueResponse 등 기존 스키마에 serialNumber 를 넣어도 되지만, 이번 API 응답은 위 세 필드가 최소

# 테스트 (필수)

1. 동일 (program, participant, type) 두 번 POST -> serialNumber 동일, 두 번째는 reused=true, DB 1행
2. 같은 사람, 다른 certificateType (document-3 vs document-participation-certificate) -> 번호 다름, DB 2행
3. 다른 participant -> 번호 다름
4. 동시 100 스레드, 서로 다른 participant -> serial_number 중복 0건, 행 100개
5. 동시 100 스레드, 같은 키 -> 번호 하나, 행 1개, 모두 200
6. 미리보기용 값 26-JA-00000 이 INSERT 되지 않음
7. 과거 행 serial_number=26-JA-00005 를 넣어 둔 뒤 시퀀스가 5를 뽑으면 스킵하고 26-JA-00006 (또는 그 다음 빈 번호) 발급
8. 연도 경계: 고정 시계로 2026-12-31 과 2027-01-01 을 넣으면 prefix 26 / 27 이 달라지고 UNIQUE 충돌 없음
9. 허용되지 않은 certificateType -> 400, INSERT 없음
10. programId 생략 -> 400

# 완료 기준

- 위 POST 가 관리자 인증으로 200을 주고 장부에 남는다
- 전역 UNIQUE 와 대상 UNIQUE 가 DB에 있다
- 동시성 테스트가 통과한다
- 프론트 allocateCertificateSerial 이 mock 없이 이 응답의 serialNumber 를 PDF에 넣으면 된다
- PDF 생성은 백엔드 범위가 아니다
```

---

## FE가 실제로 보내는 값 (참고)

| 화면 | `certificateType` | `participantId` |
|------|-------------------|-----------------|
| 학생 수료증 다운로드 | `document-3` | 학생(참가자) id |
| 학생 참가인증서 다운로드 | `document-participation-certificate` | 학생(참가자) id |
| 강사 활동인증서 「파일 다운로드」 | `document-4` | 참여 강사 id |
| 봉사자 활동인증서 「파일 다운로드」 | `document-5` | 참여 봉사자 id |

호출 시점: 미리보기 모달 오픈이 아니라 **다운로드 클릭(또는 숨은 export 호스트의 파일 생성 직전)**.
미리보기만 열고 닫으면 이 API를 호출하지 않는다.

FE 연동(2026-09-02): `allocateCertificateSerial`은 mock / 404·501 폴백 없이 실호출한다. 실패 시 PDF를 만들지 않는다.
