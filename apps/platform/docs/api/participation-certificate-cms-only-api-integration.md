# 참가인증서 포털 자체 발급 금지 — API 계약

정책 SSOT: 「JA Korea 만족도조사·수료증·참가인증서 최종 정책」 7.2·7.4 (첨부 MD와 함께 전달).

## 확정

- **수료증(COMPLETION):** 포털 마이페이지에서 수료 대상자에게만 `[수료증 발급하기]` / 기발급 시 다운로드.
- **참가인증서(PARTICIPATION):** 사용자 화면에서 **직접 발급하지 않음**. 수료 결격 + 참여 이력이 있는 사용자가 1:1 문의하면 **관리자가 CMS에서 발급**.
- **기관 학생 참가인증서:** 교사 요청 → 매니저 **시스템 외부** 처리. CMS 자동 발급으로 대체하지 않음.
- 명칭은 **참가인증서** (「참여인증서」 금지).

## 포털 FE (적용됨)

- `GET /api/portal/me/programs/{programId}/certificates/availability?certificateType=COMPLETION` 만 CTA에 사용.
- PARTICIPATION `available=true` / `canDownload` / `existingIssueId` 로 버튼을 열지 않음.
- `POST /api/portal/me/certificates/issues` 의 `certificateType` 는 **COMPLETION만**. PARTICIPATION 은 클라이언트에서 네트워크 호출 없이 거절한다.
- AUTO/미지정 availability 기본값은 COMPLETION. PARTICIPATION CTA·다운로드를 열지 않음.
- 수료 불가 사용자에게 참가인증서 발급 버튼·문의 전용 새 화면을 만들지 않음.

## 백엔드 필수

- 포털 `POST /api/portal/me/certificates/issues` 에 `certificateType=PARTICIPATION` 이면 **409**.
  - code: `MEMBER_PARTICIPATION_CERTIFICATE_SELF_ISSUE_NOT_ALLOWED`
  - message: `참가인증서는 CMS 관리자만 발급할 수 있습니다.`
- 포털 `GET …/availability?certificateType=PARTICIPATION`: `available=false`, `eligible=false`, `canDownload=false`, 위 reasonCode. `existingIssueId`가 있어도 포털 CTA 근거가 아니다.
- CMS 관리자 발급(개인·교사 참가인증서)은 유지. 최신 PUBLISHED `document-participation-certificate` `settingsJson`으로 렌더.
- 수료증 COMPLETION 포털 발급·다운로드 계약은 변경하지 않음.
- 경로·필드명·enum을 새로 만들지 않음.

## 하지 말 것

- 포털 참가인증서 재발급(정책 A, 같은 issueId POST)으로 최신 PDF를 만드는 것. 최신 양식은 **CMS 발급**만.
- 포털 PARTICIPATION `available=true` 를 유지해 FE가 발급 버튼을 열게 하는 것.
- 학생 참가인증서 CMS 자동 발급 API를 신규로 여는 것.
