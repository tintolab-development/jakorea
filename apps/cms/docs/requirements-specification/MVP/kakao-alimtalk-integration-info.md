# 카카오톡 알림톡 연동 정보 수집

**작성 목적**: 카카오톡 알림톡(비즈메시지) API 연동에 필요한 정보·요구사항 정리  
**현재 상태**: CMS에서 KAKAO 채널 Mock 발송만 구현됨 (`notification-providers.ts`, `application-notification-service.ts`)

---

## 1. 알림톡 개요

| 항목 | 내용                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- |
| 정의 | 휴대폰 번호 기준으로, 친구 추가 없이 카카오톡 사용자에게 **정보성 메시지**를 발송하는 서비스       |
| 특징 | SMS보다 저렴, 최대 1,000자(기본/이미지형)·700자(아이템리스트형), 치환 변수·대체 발송(SMS/LMS) 지원 |
| 제약 | **정보성 메시지만** 가능(광고/마케팅 불가), 템플릿 검수 승인 후 발송 가능                          |

---

## 2. 연동 전 필수 준비사항

### 2.1 비즈니스 채널·발신프로필

| 단계 | 내용                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1    | 카카오톡 채널 개설 (채널관리자센터)                                                             |
| 2    | 채널명을 **사업자등록증 법인명과 동일**하게 설정, 채널공개·검색허용 ON                          |
| 3    | **비즈니스 채널 전환** 신청 (심사 2~3일) — 사업자등록증, 재직증명서(대표자 신분증), 업종별 서류 |
| 4    | NHN Cloud(또는 카카오 공식 파트너)와 계약 후 **발신프로필** 등록 → **senderKey**(40자) 발급     |

※ 알림톡은 카카오와 파트너 계약된 **공식 딜러사(비즈고, NHN Cloud 등)** 를 통해서만 발송 시스템 이용 가능.

### 2.2 템플릿 등록·심사

| 항목      | 내용                                                                                        |
| --------- | ------------------------------------------------------------------------------------------- |
| 심사 주체 | 카카오에서 직접 검수                                                                        |
| 소요 기간 | 검수 요청 후 **영업일 기준 2일 이내** 순차 처리 (급한 경우 긴급검수 신청 조건 있음)         |
| 승인 기준 | **정보성 메시지**만 가능 — "고객의 행동 → 기업의 피드백" (주문/배송/예약/결제/신청 알림 등) |
| 반려 사유 | 광고·마케팅, 앱 설치 유도, 친구 추가 유도, 랜딩페이지만 있는 안내 등                        |
| 변수 제한 | 템플릿당 치환 변수 **최대 40개**                                                            |
| 휴면 정책 | 1년 미사용 시 휴면 → 추가 1년 경과 시 **삭제**(복구 불가). 휴면 해제는 기술지원 문의 필요   |

---

## 3. API 연동 (NHN Cloud 기준)

### 3.1 도메인·인증

| 항목               | 값                                                           |
| ------------------ | ------------------------------------------------------------ |
| API 도메인         | `https://api-alimtalk.cloud.toast.com`                       |
| 메시지 발송 (치환) | `POST /alimtalk/v2.3/appkeys/{appkey}/messages`              |
| 메시지 발송 (전문) | `POST /alimtalk/v2.3/appkeys/{appkey}/raw-messages`          |
| 인증 헤더          | `X-Secret-Key`: 콘솔에서 생성한 Secret Key (필수)            |
| 중복 방지(선택)    | `X-NC-API-IDEMPOTENCY-KEY`: 10분간 동일 키 요청 시 실패 처리 |
| Content-Type       | `application/json;charset=UTF-8`                             |

### 3.2 발송 요청 필수 값 (치환 발송)

| 필드                              | 타입   | 필수 | 설명                                                                        |
| --------------------------------- | ------ | ---- | --------------------------------------------------------------------------- |
| senderKey                         | String | O    | 발신 키 40자                                                                |
| templateCode                      | String | O    | 등록된 템플릿 코드 (최대 20자)                                              |
| requestDate                       | String | X    | 요청 일시 `yyyy-MM-dd HH:mm` (없으면 즉시 발송, 최대 60일 후까지 예약 가능) |
| recipientList                     | List   | O    | 수신자 목록 (최대 1,000명)                                                  |
| recipientList[].recipientNo       | String | O    | 수신 번호 (최대 15자)                                                       |
| recipientList[].templateParameter | Object | 조건 | 템플릿에 `#{key}` 치환자 있으면 필수. key–value 매핑                        |

### 3.3 응답 구조

- **header**: resultCode, resultMessage, isSuccessful
- **message**: requestId, sendResults[] (recipientSeq, recipientNo, resultCode, resultMessage)

### 3.4 기타 API (참고)

- 메시지 리스트/단건 조회: `GET .../messages`, `GET .../messages/{requestId}/{recipientSeq}`
- 발송 취소: `DELETE .../messages/{requestId}`
- 메시지 결과 업데이트 조회: `GET .../message-results`
- 템플릿: 카테고리 조회, 등록/수정/삭제/단건·리스트 조회, 이미지 등록 등
- 인증 메시지(OTP 등): `POST .../auth/messages`, `POST .../auth/raw-messages` (본문에 인증 관련 문구 필수)
- 대체 발송: 발송 실패 시 SMS/LMS로 대체 가능 (SMS 서비스 AppKey·발신번호 사전 등록 필요)

---

## 4. 메시지·템플릿 제한

| 구분                      | 제한                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| 본문 최대 길이            | 기본/이미지형 1,000자, 아이템리스트형 700자 (본문+변수+부가정보 포함) |
| 채널추가형(AD)/복합형(MI) | 채널추가 안내 약 40자 포함 고려                                       |
| 버튼                      | 최대 5개 (WL, AL, DS, BK, MD, BC, BT, AC, BF, TN 등)                  |
| 바로연결(quickReplies)    | 최대 5개                                                              |
| 템플릿 변수               | 1개 템플릿당 최대 40개                                                |

---

## 5. 프로젝트 내 현재 구조와의 매핑

| 현재 (CMS)                                                   | 연동 시 필요 사항                                                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `KakaoSendParams`: to, message, templateId?, templateParams? | 실제 API는 **templateCode** + **recipientNo** + **templateParameter** (치환 변수) 사용. templateId → templateCode 매핑 필요 |
| `kakaoProvider.send()` Mock                                  | NHN Cloud `POST .../messages` 호출로 교체. appkey, X-Secret-Key, senderKey는 환경변수/설정에서 로드                         |
| 채널: SMS / EMAIL / KAKAO                                    | KAKAO 선택 시 수신자 휴대폰 번호로 알림톡 발송. 실패 시 대체 발송(SMS/LMS) 정책 결정 필요                                   |
| 템플릿 관리 화면 (`/templates/kakao-alimtalk`)               | NHN 콘솔에서 템플릿 등록·심사 또는 API로 템플릿 등록 후, CMS에서는 **승인된 templateCode 목록**만 조회/선택하도록 연동 가능 |

---

## 6. 수집·결정이 필요한 항목

| 번호 | 항목                      | 설명                                                                                         |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------- |
| 1    | **플랫폼 선택**           | NHN Cloud vs 카카오 BizMessage 직접 vs 기타 파트너(비즈고 등)                                |
| 2    | **appkey / X-Secret-Key** | NHN Cloud 콘솔에서 발급. 배포 환경별로 보관 위치·권한 결정                                   |
| 3    | **senderKey**             | 발신프로필 등록 후 40자 발신 키. 1개 이상일 경우 프로필별 senderKey 관리 방식                |
| 4    | **템플릿 전략**           | CMS에서 템플릿 CRUD까지 할지, NHN 콘솔에서만 등록·심사하고 CMS는 templateCode만 선택할지     |
| 5    | **대체 발송**             | 알림톡 실패 시 SMS/LMS 자동 발송 여부, 발신번호·SMS AppKey 등록                              |
| 6    | **인증 메시지(OTP)**      | 관리자 MFA 등 OTP 발송 시 인증용 API(`/auth/messages`) 사용 시, 템플릿에 인증 문구 포함 필요 |
| 7    | **발송 이력·결과**        | 메시지 리스트/단건 조회·결과 업데이트 API로 CMS 발송 이력과 동기화할지 여부                  |

---

## 7. 참고 문서

- NHN Cloud 알림톡 개요: [알림톡 개요](https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-overview/)
- NHN Cloud 알림톡 API v2.3: [API v2.3 가이드](https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-api-guide/)
- 카카오 알림톡 제작/심사: [알림톡 제작가이드](https://kakaobusiness.gitbook.io/main/ad/bizmessage/notice-friend/content-guide), [알림톡 심사가이드](https://kakaobusiness.gitbook.io/main/ad/bizmessage/notice-friend/audit)
- 발신프로필(발신키): [NHN Cloud 발신 프로필 개요](https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/sender-overview/)

---

## 8. 연동 전 체크리스트

- [ ] 비즈니스 채널 전환 완료 및 senderKey 확보
- [ ] NHN Cloud(또는 선택한 파트너) 계약 및 appkey, X-Secret-Key 확보
- [ ] 사용할 알림톡 템플릿 작성·등록·카카오 심사 승인 및 templateCode 확정
- [ ] 치환 변수 규칙 정리 (템플릿 `#{변수명}` ↔ CMS 데이터 매핑)
- [ ] 대체 발송(SMS/LMS) 사용 시 SMS 서비스 AppKey·발신번호 등록
- [ ] 백엔드(또는 BFF)에 알림톡 API 호출·에러 처리·재시도 정책 구현
- [ ] CMS 쪽 `KakaoProvider`를 실제 API 호출로 교체하고, templateCode/templateParameter 연동

이 문서는 연동에 필요한 정보 수집용이며, 위 항목이 확정되면 API 스펙·환경변수·구현 단계로 이어질 수 있습니다.
