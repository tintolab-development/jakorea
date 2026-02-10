# 관리자 2차인증 Microsoft Authenticator 앱 연동 — 필요 정보 수집

**작성 목적**: 관리자 로그인 시 Microsoft Authenticator 앱(TOTP) 연동에 필요한 정보·요구사항 정리  
**현재 상태**: SMS OTP 기반 MFA만 구현됨 (`mfa-service.ts`, `MfaVerificationModal`)

---

## 1. Microsoft Authenticator 연동 방식 요약

- **전용 API 불필요**: Microsoft Authenticator는 표준 **TOTP(RFC 6238)** 를 사용하므로, 별도 Microsoft 개발자 API/키가 필요하지 않음.
- **표준 TOTP**로 시크릿 생성 → QR 코드(또는 수동 입력)로 앱에 등록 → 서버에서 6자리 OTP 검증.

---

## 2. 연동에 필요한 기술 정보

### 2.1 TOTP 표준

| 항목       | 내용                                    |
| ---------- | --------------------------------------- |
| 알고리즘   | RFC 6238 (Time-based One-Time Password) |
| 시간 단위  | 보통 30초 (구현 시 설정 가능)           |
| OTP 자릿수 | 6자리 (Microsoft Authenticator 기본)    |
| URI 스킴   | `otpauth://totp/...` (QR 코드에 인코딩) |

### 2.2 otpauth URI 형식 (QR 코드용)

```
otpauth://totp/{issuer}:{account}?secret={BASE32_SECRET}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
```

| 파라미터 | 설명                                     | 예시                |
| -------- | ---------------------------------------- | ------------------- |
| issuer   | 서비스/회사명 (앱에 표시)                | `JA Korea CMS`      |
| account  | 계정 식별자 (이메일 등)                  | `admin@jakorea.org` |
| secret   | Base32 인코딩된 비밀키 (최소 80bit 권장) | 서버에서 생성·저장  |
| digits   | OTP 자릿수                               | `6`                 |
| period   | 시간 창(초)                              | `30`                |

### 2.3 백엔드에서 필요한 기능

| 기능        | 설명                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| 시크릿 생성 | 사용자별 TOTP 비밀키 생성 (암호학적 난수, Base32)                                            |
| 시크릿 저장 | 사용자–시크릿 매핑 안전 저장 (암호화 권장)                                                   |
| QR/URI 생성 | `otpauth://totp/...` URL 생성 → QR 코드 이미지로 제공                                        |
| OTP 검증    | 클라이언트가 입력한 6자리 코드를 서버에서 TOTP 알고리즘으로 검증 (시간 창 1~2단계 허용 권장) |
| 등록 플로우 | “Authenticator 앱 설정” 시 한 번만 시크릿 발급·QR 표시·검증 후 “등록 완료” 처리              |

### 2.4 프론트엔드에서 필요한 정보/기능

| 항목             | 설명                                                               |
| ---------------- | ------------------------------------------------------------------ |
| 서비스명(issuer) | QR/앱에 표시할 이름 (예: JA Korea CMS)                             |
| 등록 UI          | “Authenticator 앱 추가” 페이지/모달, QR 표시 + “수동 입력 키” 옵션 |
| 코드 입력        | 6자리 OTP 입력 (현재 MFA 모달/페이지와 동일한 입력란 재사용 가능)  |
| 정책             | 재시도 제한, 잠금 정책 (현재 SMS OTP 정책과 통일할지 여부)         |

---

## 3. 프로젝트 내 기존 MFA와의 관계

| 구분      | 현재 (SMS OTP)                                      | 추가 시 (Microsoft Authenticator)                       |
| --------- | --------------------------------------------------- | ------------------------------------------------------- |
| 인증 수단 | 휴대폰 번호 → SMS OTP                               | 앱에 등록한 TOTP 시크릿 → 6자리 OTP                     |
| 발송      | `sendOtp()` → SMS 게이트웨이                        | 없음 (앱이 로컬 생성)                                   |
| 검증      | `verifyOtp()` — 서버에 저장된 1회용 OTP와 비교      | 서버에 저장된 시크릿으로 TOTP 검증                      |
| 타입      | `MfaState`, `OtpSendRequest`, `OtpVerifyRequest` 등 | TOTP용: 시크릿 등록 상태, 검증 요청/응답 타입 추가 필요 |

**선택 사항**

- **SMS OTP만 유지**: 관리자 2차인증을 계속 SMS만 사용.
- **TOTP만 사용**: 관리자는 Authenticator 앱만 사용 (SMS 의존 제거).
- **SMS + TOTP 병행**: 관리자가 “SMS OTP” 또는 “Authenticator 앱” 중 하나를 선택하도록 설정.

---

## 4. 수집이 필요한 비기능·운영 정보

| 번호 | 항목                         | 설명                                                | 결정 필요          |
| ---- | ---------------------------- | --------------------------------------------------- | ------------------ |
| 1    | **서비스 표시명(issuer)**    | Authenticator 앱에 표시될 서비스명                  | 예: `JA Korea CMS` |
| 2    | **계정 표시(account)**       | 이메일 vs 로그인 ID vs 기타                         | 예: 로그인 이메일  |
| 3    | **TOTP만 사용 여부**         | SMS OTP 제거 후 TOTP만 할지, 병행할지               | 정책 결정          |
| 4    | **등록 시점**                | 최초 로그인 시 강제 등록 vs 설정 메뉴에서 선택      | UX/정책            |
| 5    | **백업 코드**                | TOTP 분실 시 사용할 백업 코드 발급 여부             | 보안·복구 정책     |
| 6    | **기존 관리자 마이그레이션** | 이미 SMS만 쓰는 계정에 TOTP 등록 유도 방식          | 단계적 전환 여부   |
| 7    | **백엔드 스택**              | Node/Express, Nest 등 — TOTP 라이브러리 선택에 필요 | 확인               |
| 8    | **시크릿 저장 위치**         | DB 테이블/컬럼, 암호화 방식                         | 설계               |

---

## 5. 구현 시 참고할 라이브러리/문서

- **Node.js**: `speakeasy`, `otplib` (시크릿 생성·TOTP 검증), `qrcode`(QR 이미지 생성)
- **RFC**: [RFC 6238 (TOTP)](https://www.rfc-editor.org/rfc/rfc6238), otpauth URI 스킴
- **Microsoft**: [Azure AD B2C TOTP 표시 제어](https://learn.microsoft.com/en-us/azure/active-directory-b2c/display-control-time-based-one-time-password) (참고용, 우리는 자체 구현)

---

## 6. 체크리스트 — 연동 전 확인 사항

- [ ] 서비스명(issuer) 확정
- [ ] 계정 표시(account) 규칙 확정
- [ ] SMS OTP 유지 vs TOTP 전환 vs 병행 정책 확정
- [ ] TOTP 등록 플로우(최초 로그인 vs 설정) 확정
- [ ] 백업 코드 필요 여부 및 형식 확정
- [ ] 백엔드 스택 및 DB에 시크릿 저장 방식 확정
- [ ] 기존 `MfaState`/API에 TOTP 등록·검증 필드/엔드포인트 추가 범위 확정

이 문서는 “연동에 필요한 정보 수집”용이며, 위 항목들이 확정되면 백엔드/프론트 구현 스펙으로 이어질 수 있습니다.
