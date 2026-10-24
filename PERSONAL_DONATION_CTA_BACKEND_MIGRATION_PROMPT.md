# 후원 페이지 어드민 데이터/API 반영 요청

## 목적

개인후원·기업후원 페이지의 문구를 시안 기준으로 통일하고, 어드민에서 관리되는 콘텐츠가 공개 페이지에 동일하게 반영되도록 백엔드 저장 계약과 기존 데이터 마이그레이션을 반영해 주세요.

## 현재 상태

- 어드민 개인후원 조회 응답에는 이미 `donationButton.label`, `donationButton.url`, `donationButton.version`이 있습니다.
- 현재 `PUT /api/admin/sponsorship/personal/donation-url` 요청은 `{ donationUrl, version }`만 받습니다.
- 따라서 프론트는 현재 API와 호환하기 위해 `성장 후원하기`를 기본값으로 사용하고, 조회 응답의 레거시 값 `후원하기`도 화면에서 새 문구로 보정하고 있습니다.
- 공개 개인후원 응답은 `donationButtonLabel`을 사용합니다.

- 기업후원 어드민에는 `metrics`와 `steps` 수정 API가 이미 있고, 공개 응답은 동일한 데이터를 사용합니다.

## 요청 사항

1. `PUT /api/admin/sponsorship/personal/donation-url` 요청에 CTA 문구 필드를 추가해 주세요.

   권장 요청 형태:

   ```json
   {
     "donationUrl": "https://...",
     "label": "성장 후원하기",
     "version": 12
   }
   ```

   응답은 기존처럼 `{ label, url, version }`을 반환하고, 저장된 최신 버전을 반환해 주세요. 필드명을 `buttonLabel`로 정해야 한다면 OpenAPI 요청/응답과 프론트 생성 클라이언트를 동일한 이름으로 통일해 주세요. `label`, `buttonLabel`, `donationButtonLabel`을 혼용하지 않도록 계약을 확정해 주세요.

2. 기존 개인후원 CTA 데이터의 idempotent 마이그레이션을 추가해 주세요.

   - CTA label이 `null`, 빈 문자열 또는 기존 기본값 `후원하기`인 경우 `성장 후원하기`로 변경
   - 이미 다른 문구를 명시적으로 저장한 값은 보존
   - 연결 링크, version 및 다른 개인후원 콘텐츠는 변경하지 않음
   - 배너/메뉴의 일반적인 `후원하기` 텍스트는 대상에서 제외

3. 기존 기업후원 문구를 idempotent 마이그레이션해 주세요.

   대상은 기업후원 `metrics` 및 `steps`의 설명/라벨이며, 제목과 version 및 다른 후원 페이지 데이터는 보존합니다.

   | 위치 | 기존 값 | 변경 값 |
   | --- | --- | --- |
   | metric `GLOBAL_SCALE.description` | `글로벌 네트워크를 통한 사업 확장` | `JA 글로벌 네트워크를 통한 교육 프로그램 확장` |
   | metric `TRANSPARENCY.name` | `최고 수준의 투명성` | `최고수준의 투명성` |
   | metric `PROVEN_IMPACT.description` | `10년 이상 이어온 파트너십을 통한 누적 교육 인원` | `연간 청소년 교육으로 이어온 10년 이상의 장기 파트너십` |
   | step 1 description | `파트너십 문의` | `JA Korea에 파트너십 문의` |
   | step 2 description | `프로그램 적합성 및 교육 대상 검토 / 기업 CSR 목표 파악` | `프로그램 적합도 및 수혜 대상 타당성 조사 / 기업 사회공헌 목표 파악` |
   | step 3 description | `프로그램 목적 및 포지셔닝 설계 / 운영 방식 제안` | `프로그램 목적 및 포지셔닝 설계 / 수혜 대상 및 프로그램 운영 방식 제안` |
   | step 4 description | `운영 기간 및 후원 규모 확정 / 프로그램 비용 지원` | `운영 기간 및 기부금 확정 / 기부금(프로그램 운영비) 지원` |
   | step 5 description | `수혜자 및 강사 모집·선발 / 프로그램 진행` | `수혜 대상자 및 교사·강사·봉사자 모집/선발 / 프로그램 진행` |
   | step 6 description | `결과·정산 보고서 제공 / 성과 평가 및 차년도 계획 수립` | `프로그램 결과 및 회계 보고 / 성과 평가 / 차년도 계획 수립 및 파트너십 점검` |

   실제 저장 값의 줄바꿈과 `·` bullet 유무는 무시하고 항목 단위로 비교하되, 새 문구를 저장할 때는 현재 API가 사용하는 줄바꿈 형식을 유지해 주세요.

4. 공개 API의 `donationButtonLabel`이 동일한 개인후원 CTA 저장값을 바라보도록 확인해 주세요. 어드민 저장 후 공개 GET에서 새 문구가 반환되어야 합니다. 기업후원 공개 `metrics`/`steps`도 같은 저장값을 반환해야 합니다.

5. OpenAPI 스키마와 생성 클라이언트를 갱신해 주세요.

   - `DonationUrlUpdateRequest`에 label 필드 반영
   - `DonationButtonResponse`의 label/version/url 계약 유지
   - 프론트에서 수동으로 generated 파일을 수정하지 않아도 되도록 스펙 갱신 후 Orval 재생성

6. 다음 검증을 추가하거나 실행해 주세요.

   - 레거시 `후원하기` 데이터에 대한 마이그레이션 재실행이 결과를 중복 변경하지 않는지
   - 어드민 PUT에서 문구와 URL을 함께 저장하고, 응답의 version이 증가하는지
   - 저장 직후 새로 조회한 어드민 GET에서 `donationButton.label`이 `성장 후원하기`인지
   - 공개 GET에서도 `donationButtonLabel`이 `성장 후원하기`인지
   - 기업후원 공개 GET에서 3개 metric과 6개 step이 시안 문구를 반환하는지
   - 오래된 version으로 저장할 때 기존 optimistic-lock 충돌 계약이 유지되는지

## 완료 기준

- DB 마이그레이션 및 백엔드 테스트가 완료됨
- OpenAPI 문서와 생성 클라이언트가 갱신됨
- `PUT → 새로고침/새 GET` 경로에서 CTA 문구와 URL이 모두 영속화됨
- 백엔드 배포 후 프론트에서 `label` 저장 필드를 연결하면 개인후원 CTA 문구를 어드민에서 수정할 수 있음

참고: 별도의 메인 콘텐츠 후원 섹션 API가 아닌, 현재 개인후원 저장소와 `/api/admin/sponsorship/personal/donation-url` 계약을 기준으로 작업해 주세요.
