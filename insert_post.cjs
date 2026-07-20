const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, 'data/content/posts.json');
const posts = JSON.parse(fs.readFileSync(file, 'utf-8'));
posts.unshift({
  id: 'auto-1',
  title: '한국 증시 주도주 패턴 분석 및 매매 기법',
  content: '<h2>1. 한국 증시 주도주 흐름에 미치는 영향력 분석</h2><p>최근 한국 증시의 주도주는 강력한 수급과 함께 뚜렷한 추세를 형성하고 있습니다. 기관과 외국인의 양매수가 유입되는 섹터는 단기 조정을 거치더라도 재차 상승하는 패턴을 보입니다.</p><h2>2. 거래량과 이평선을 결합한 매수 타점</h2><p>주요 저항선을 돌파할 때 거래량이 폭증하는 것은 신뢰도 높은 매수 신호입니다. 특히 20일 이동평균선의 지지를 받는 눌림목 구간에서는 분할 매수로 접근하는 것이 효과적입니다.</p><h2>3. 거시경제와 글로벌 공급망 상관관계</h2><p>미국의 금리 정책과 환율 변동성은 국내 수출 주도주에 직접적인 타격을 줍니다. 따라서 원/달러 환율이 하향 안정화되는 시점에는 대형 수출주 비중을 늘리는 전략이 유효합니다.</p><h2>4. 대표 종목 및 핵심 모멘텀</h2><p>최근 반도체 소부장 대장주들은 AI 반도체 수요 급증이라는 명확한 모멘텀을 보유하고 있습니다. 이들 종목은 실적 가시성이 높아 단기 변동성에도 불구하고 중장기 투자 매력이 돋보입니다.</p>',
  category: 'blog',
  author: 'AI 마켓 리서치',
  tags: ['마켓 리포트', '주도주 분석', '실전 매매'],
  slug: 'auto-report-1',
  createdAt: new Date().toISOString(),
  published_at: new Date().toISOString(),
  views: 0
});
fs.writeFileSync(file, JSON.stringify(posts, null, 2));
console.log('Post inserted!');
