# E2E Basic 테스트 실패 케이스 정리

## 테스트 결과 요약
- **총 테스트**: 57개
- **통과**: 45개
- **실패**: 12개
- **성공률**: 78.9%

## 실패한 테스트 목록

### 1. SSR에서 초기 데이터가 window.__INITIAL_DATA__에 포함된다 (http://localhost:5174/)
**파일**: e2e/createTests.ts:681:7  
**환경**: chromium  
**원인**: JSON 구조 불일치
- 예상: `window.__INITIAL_DATA__`가 특정 JSON 형식을 포함
- 실제: HTML이 렌더링되었지만 JSON 구조가 다름 (categories 구조 차이)

### 2. 상품 상세 페이지가 SSR로 올바르게 렌더링된다 (http://localhost:5174/)
**파일**: e2e/createTests.ts:760:7  
**환경**: chromium  
**원인**: SSR 상품 상세 페이지 렌더링 실패

### 3. 복합 필터링(검색+카테고리+정렬)이 SSR로 올바르게 렌더링된다 (http://localhost:5174/)
**파일**: e2e/createTests.ts:734:7  
**환경**: chromium  
**원인**: 복합 필터링 SSR 렌더링 실패

### 4. SSR 페이지에 적절한 메타태그가 포함된다 (http://localhost:5174/)
**파일**: e2e/createTests.ts:784:7  
**환경**: chromium  
**원인**: 메타태그 누락 또는 잘못된 형식

### 5. SSR로 렌더링된 페이지가 서버에서 완전한 HTML을 제공한다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:660:7  
**환경**: chromium  
**원인**: SSG 경로에서 HTML 렌더링 실패

### 6. 상품 상세 페이지에 동적 메타태그가 설정된다 (http://localhost:5174/)
**파일**: e2e/createTests.ts:800:7  
**환경**: chromium  
**원인**: 동적 메타태그 설정 실패

### 7. SSR에서 초기 데이터가 window.__INITIAL_DATA__에 포함된다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:681:7  
**환경**: chromium  
**원인**: SSG 경로에서 초기 데이터 구조 불일치

### 8. 검색 파라미터가 포함된 URL이 SSR로 올바르게 렌더링된다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:693:7  
**환경**: chromium  
**원인**: SSG 경로에서 검색 파라미터 처리 실패

### 9. 카테고리 필터링이 SSR로 올바르게 렌더링된다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:713:7  
**환경**: chromium  
**원인**: SSG 경로에서 카테고리 필터링 실패

### 10. 복합 필터링(검색+카테고리+정렬)이 SSR로 올바르게 렌더링된다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:734:7  
**환경**: chromium  
**원인**: SSG 경로에서 복합 필터링 실패

### 11. SSR 페이지에 적절한 메타태그가 포함된다 (http://localhost:4174/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:784:7  
**환경**: chromium  
**원인**: SSG 경로에서 메타태그 누락

### 12. SSG에서 초기 데이터가 window.__INITIAL_DATA__에 포함된다 (http://localhost:4178/front_7th_chapter4-1/vanilla/)
**파일**: e2e/createTests.ts:853:7  
**환경**: chromium  
**원인**: SSG 환경에서 초기 데이터 구조 불일치

## 주요 문제점 분석

### 1. JSON 구조 불일치
가장 흔한 오류는 `window.__INITIAL_DATA__`의 JSON 구조가 예상과 다른 경우입니다.

**예상 구조**:
```json
{
  "products": [...],
  "categories": {
    "생활/건강": {
      "생활용품": {}
    }
  },
  "totalCount": 340
}
```

**실제 구조**:
```json
{
  "product": {
    "products": [...],
    "totalCount": 340,
    "currentProduct": null,
    "relatedProducts": [],
    "loading": false,
    "error": null,
    "status": "done",
    "categories": {
      "생활/건강": ["생활용품", "주방용품", ...]
    }
  },
  "cart": {...},
  "route": {...}
}
```

**문제점**:
- 최상위 구조가 `product`, `cart`, `route`로 감싸져 있음
- `categories`의 구조가 객체가 아닌 배열로 되어 있음

### 2. SSG/SSR 경로 처리 문제
- `http://localhost:4174/front_7th_chapter4-1/vanilla/` 경로에서 여러 테스트 실패
- SSG 빌드된 파일에서 동적 렌더링(검색, 필터링) 처리 실패

### 3. 메타태그 누락
- SEO 관련 메타태그가 제대로 설정되지 않음
- 동적 메타태그(상품 상세 페이지) 설정 실패

## 해결 방안

### 1. JSON 구조 수정
`window.__INITIAL_DATA__` 구조를 테스트가 기대하는 형식으로 수정 필요

### 2. SSG 경로 처리 개선
- SSG 빌드 시 기본 페이지 외 동적 페이지 처리 방법 검토
- 또는 SSG에서는 동적 페이지를 CSR로 처리하도록 변경

### 3. 메타태그 추가
- 각 페이지에 적절한 메타태그 추가
- 상품 상세 페이지에 동적 메타태그 구현
