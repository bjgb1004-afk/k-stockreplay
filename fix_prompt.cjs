const fs = require('fs');
let code = fs.readFileSync('server-core/platform_engine.ts', 'utf8');

const newSchemaFields = `"stars": 5, // 1~5 별점 정수
      "sector": "실제 한국 주식 시장의 표준 산업 섹터 (예: 반도체, 2차전지, 로봇, 제약/바이오, 자동차, IT/소프트웨어, 건설, 금융 등)",
      "theme": "세부 이슈 테마 키워드 (예: 삼성 로봇, AI 반도체, 초전도체 등)",
      "tags": ["주도주", "거래대금 상위", "상한가"], // 종목의 상태/특성 키워드 배열`;

code = code.replace(/"stars": 5, \/\/ 1~5 별점 정수/g, newSchemaFields);

fs.writeFileSync('server-core/platform_engine.ts', code);
