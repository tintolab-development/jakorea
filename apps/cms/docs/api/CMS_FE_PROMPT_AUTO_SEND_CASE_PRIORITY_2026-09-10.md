# FE 수신 — 자동발송 케이스 우선순위 2026-09-10

> 원본 BE/Ops handoff: `JABACK/docs/frontend/CMS_FE_BE_HANDOFF_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`  
> 시트 SSOT: `[tinto lab] JA Korea_알림발송 채널 별 문구 체크리스트_260831`  
> 관련 FE: [`CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md`](./CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md)  
> 갱신: 2026-09-10 — BE Wave **1–4 완료** 반영 (V108–V110)

## FE 영향 요약

| 항목 | FE 조치 |
|------|---------|
| Wave 1–4 자동발송 | **코드 변경 없음** — BE producer / catalog / Flyway bind |
| CMS **수동** 알림톡 발송 피커 | Option A 유지 — SYSTEM·비enrich 키 `enabled=false` → 「템플릿 사용」비활성 |
| Orval / OpenAPI | 자동발송 path invent 없음 → **필수 재생성 없음** |
| 잔여 BE | 휴면 **전환 예정** EMAIL only · 다수 A는 WEB(APPROVED 템플릿 harvest 후 bind) · 탈퇴 완료 외부채널 후속 |

축 분리:

- **자동발송**: `notification_event` → catalog channel ON + `notification_event_channel_template` → outbox → NHN  
- **CMS 수동 발송**: Admin UI · SYSTEM 변수 `template-variables` `enabled=false`

## Wave 상태 (BE · 참고)

| Wave | 상태 | 요약 |
|------|------|------|
| **1** | 완료 | 로그인 실패·잠금·MFA (`로그인_실패_안내`, `관리자_2단계_인증_실패_안내`) |
| **2** | 완료 | `MEMBER_SIGNUP_COMPLETED` → `회원가입완료안내` (V108). 기타 A는 APPROVED 없으면 WEB |
| **3** | 완료 | `MEMBER_CONSENT_WITHDRAWN` → `동의_철회_안내`, `DORMANT_ACCOUNT_TRANSITIONED` → `계정_휴면_전환_처리_안내` (V109). 휴면 전환 **예정** EMAIL만 |
| **4** | 완료 | 공통 잔여 B (V110) — 아래 |

### Wave 4 (V110)

| event_type | 시트 | 채널(현재) |
|------------|------|------------|
| `MEMBER_CONSENT_EXPIRING` | 필수 동의 항목 만료 예정 | WEB + EMAIL (`필수_동의_항목_만료_예정_안내`) · ALIMTALK 승인 후 |
| `MEMBER_IDENTITY_VERIFIED` | 본인인증 완료 | WEB |
| `DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE` | 장기 휴면 회원 탈퇴 처리 안내 | WEB · ALIMTALK 승인 후 |
| `MEMBER_WITHDRAWAL_COMPLETED` | 홈페이지 탈퇴 완료 안내 | WEB (익명화 전) · 외부채널 후속 |

스케줄러(기본 OFF): `ja.member-consent.expiring-notice.enabled`, `ja.privacy.dormant-withdrawal-pre-notice.enabled`.

### Wave 3 변수 키 (수동 피커 Option A)

| key | 용도 |
|-----|------|
| `동의 철회 항목` / `동의 철회 일시` | 동의 철회 |
| `휴면 전환일시` | 휴면 전환 처리 |
| (+ enrich) `사용자 아이디(이메일)` | 공통 |

## FE QA (수동 발송 · 회귀)

- [ ] 프로그램 지정 + 자동발송 전용 템플릿(`로그인_실패_안내`, `동의_철회_안내` 등) → 「템플릿 사용」비활성
- [ ] 프로그램 미선택 → 변수 Option A 미적용 (승인만)
- [ ] 자동발송 vs 수동 발송 UX 축 스모크

## Done (FE)

- [x] handoff 수신 · Wave 1–4 완료분 문서 동기화
- [x] FE 코드 변경 불필요 재확인 (Wave1–4 시점)
- [x] Option A(수동 피커)와 자동발송 축 분리 정합
- [x] **Wave1–13 FE 적용:** [`CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`](./CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md) (Orval·라벨·UJAT 피드백)
