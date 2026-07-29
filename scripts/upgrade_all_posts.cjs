const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://xfrfxrbxlkuxldmaeobr.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const postsPath = path.resolve(__dirname, '../data/content/posts.json');
const raw = fs.readFileSync(postsPath, 'utf8');
const currentPosts = JSON.parse(raw);

// Build map of current views to strictly preserve views!
const viewsMap = new Map();
currentPosts.forEach(p => {
  viewsMap.set(p.id, p.views);
});

console.log('Preserved Views Map:', Object.fromEntries(viewsMap));

const upgradedPostsData = {
  col_1: {
    title: "K-STOCK REPLAY가 시장을 복기하는 이유: 수급 데이터 기반 복기 매커니즘과 승률 고도화",
    content: `<h2>[K-STOCK Executive Report] 트레이더의 주관적 착각을 깨는 빅데이터 복기 방법론</h2>
<p>주식 시장에서 손실을 반복하는 트레이더의 90% 이상은 자신의 매매 실수를 '운'의 영역으로 치부하거나 시장 변동성에 핑계를 둡니다. 그러나 프로 헤지펀드와 알고리즘 트레이딩 룸에서는 당일 터진 **거래대금, 외국인·기관의 수급 클러스터링, 호가창 주문 흐름(Order Flow)**을 장 마감 후 마이크로 단위로 복기(Replay)하는 작업을 필수 프로토콜로 시행합니다.</p>

<p>K-STOCK REPLAY 시스템은 당일 발생한 양대 시장(KOSPI/KOSDAQ)의 모든 틱 데이터와 메이저 자금의 이동 경로를 정밀 재구성하여, 트레이더가 감정에 휘둘리지 않고 **'승률 높은 기계적 매매 타점'**을 추출하도록 돕는 정량적 복기 솔루션입니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>분석 항목</th>
      <th>기존 감정적 매매</th>
      <th>K-STOCK 정량 복기 솔루션</th>
      <th>트레이더 가치 창출</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>복기 대상</strong></td>
      <td>단순 주가 차트 및 계좌 손익</td>
      <td>거래대금 체결 속도, 수급 주체별 매집률</td>
      <td>가짜 돌파(Fakeout) 식별 능력 확보</td>
    </tr>
    <tr>
      <td><strong>데이터 깊이</strong></td>
      <td>일봉/분봉의 종가 기준</td>
      <td>3분봉 단위 체결강도 및 호가 잔고 비율</td>
      <td>세력의 저가 매집 및 고점 분산 포착</td>
    </tr>
    <tr>
      <td><strong>승률 개선</strong></td>
      <td>뇌동매수 반복 (승률 < 40%)</td>
      <td>주도주 눌림목 반복 훈련 (승률 > 70%)</td>
      <td>손익비 1:2.5 이상의 피보나치 타점 확보</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 정량적 수급 복기 원리 (Market Microstructure & Order Flow)</h2>
<p>장 마감 후 주가만 바라보는 일차원적 복기는 아무런 발전이 없습니다. 프로 트레이더는 **체결강도(Volume Power)**와 **수급 집계 비율**을 연동하여 세력의 진성 유입 여부를 수학적으로 측정합니다.</p>

<div class="formula-box">
  VP = (Total Buy Volume / Total Sell Volume) * 100
</div>

<p>장중 3분봉 상 체결강도(VP)가 150% 이상을 유지하면서 거래대금이 분당 100억 원 이상 폭발할 때, 이는 순수 개인의 매수가 아닌 **외국인 및 기관의 수동적 알고리즘(Passive Algo) 바스켓 매수세**가 작동하고 있음을 나타냅니다.</p>

<hr />

<h2>3. 프로 트레이더 실전 복기 3단계 수순</h2>
<ol>
  <li><strong>1단계 - 당일 거래대금 TOP 30 종목 추출:</strong> 시장의 돈이 쏠린 진짜 주도주와 가짜 테마주를 선별합니다.</li>
  <li><strong>2단계 - 첫 파동의 에너지 측정:</strong> 09:00~09:30 사이 발생한 거래대금이 전일 거래대금의 30%를 넘어서는지 검증합니다.</li>
  <li><strong>3단계 - 20일선 및 VWAP(거래량 가중 평균가) 지지 복기:</strong> 메이저 세력의 평균 단가인 VWAP 부근에서의 수급 반등 반응을 복기합니다.</li>
</ol>

<hr />

<h2>4. 리스크 관리 및 예외 대응 프로토콜</h2>
<p>복기 과정에서 '재료가 좋아 보이는데 거래대금이 300억 원 미만인 종목'은 과감히 분석 대상에서 제외하십시오. 거래대금이 약한 종목은 복기하더라도 세력의 일탈이나 개개인의 뇌동매수에 따라 차트가 왜곡되므로 규칙성이 성립하지 않습니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>당일 거래대금이 KOSPI 1,500억 원 / KOSDAQ 1,000억 원 이상을 확정적으로 경신했는가?</li>
    <li>3분봉 기준 VWAP(거래량 가중 평균가) 위에서 주가가 형성되며 수급 우위가 증명되었는가?</li>
    <li>손절가(주요 지지선 -2%) 설정 시 손익비가 최소 1:2 이상 보장되는 구간인가?</li>
  </ol>
</div>`
  },
  col_2: {
    title: "거래대금이 주가보다 먼저 움직이는 이유: 수급 모멘텀 지표 및 정량적 거래량 분석법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 주가의 선행 지표로서 거래대금의 정량적 매커니즘</h2>
<p>주식 시장에서 '주가(Price)'는 거대한 수급의 결과물일 뿐이며, 주가를 이끄는 진짜 원인은 **'거래대금(Transaction Value)'**입니다. 주가는 세력에 의해 허상으로 그릴 수 있으나, 수천억 원의 현금이 이동한 흔적인 거래대금은 절대로 속일 수 없습니다.</p>

<p>본 리포트에서는 거래대금이 시세 폭발 직전 나타내는 정량적 신호와, 호가창 주문 잔고와의 상관관계를 프로 트레이더의 시각에서 명확히 해부합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>거래량(Volume) 분석의 한계</th>
      <th>거래대금(Transaction Value) 분석의 우위</th>
      <th>실전 적용 포인트</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>자금의 실체</strong></td>
      <td>동전주의 착시 현상 발생 (1,000만 주 = 10억)</td>
      <td>주가 곱셈을 통한 실질 자금 규모 직관적 판별</td>
      <td>1,000억 이상 주도주 선별의 절대 기준</td>
    </tr>
    <tr>
      <td><strong>신호 정확도</strong></td>
      <td>단순 허수 주문에 의한 착시 다수</td>
      <td>진성 매수세 체결 금액만 집계</td>
      <td>전고점 돌파 시 진성 유입 판단</td>
    </tr>
    <tr>
      <td><strong>눌림목 검증</strong></td>
      <td>거래량 급감 시 단순 소외 가능성</td>
      <td>거래대금 1/10 축소 시 건전한 눌림목 확정</td>
      <td>2차 상승 반등 타점 포착</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 거래대금 수급 수식 및 모멘텀 매커니즘</h2>
<p>거래대금의 수급 밀도를 측정하기 위해 프로 트레이더들은 **거래대금 회전율(Turnover Rate)**과 **분당 거래대금 수식**을 활용합니다.</p>

<div class="formula-box">
  TV = P_t * V_t &nbsp;&nbsp;|&nbsp;&nbsp; Turnover Rate (%) = (TV / Market Cap) * 100
</div>

<p>시가총액 대비 당일 거래대금 회전율이 15%~30% 이상 터지고, 장 시작 30분 만에 분당 거래대금이 30억 원을 지속 상회할 경우, 이는 시장의 모든 스마트 머니가 집중된 **'당일 최상위 주도주'**임을 의미합니다.</p>

<hr />

<h2>3. 프로 트레이더의 거래대금 매매 전략</h2>
<ol>
  <li><strong>돌파 매매:</strong> 전고점 저항대를 거래대금 수천억 원이 실린 장대양봉으로 한 번에 뚫어낼 때 동참합니다.</li>
  <li><strong>눌림목 매매:</strong> 대량 거래대금 양봉 이후, 조정 음봉에서 거래대금이 70% 이상 급감하며 20선 지지를 받을 때 분할 매수합니다.</li>
  <li><strong>분산 경고:</strong> 주가는 최고가를 경신하나 거래대금이 전일 대비 크게 줄어드는 '거래대금 다이버전스' 발생 시 전량 이익 실현합니다.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>시가총액이 작고 거래대금이 200억 원 미만인 테마주는 세력이 적은 자금으로 주가를 조작하기 쉽습니다. 반드시 당일 거래대금 상위 20위 이내 종목으로 매매 범위를 제한하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>장 초반 30분간 터진 거래대금이 최소 300억 원 이상을 돌파하였는가?</li>
    <li>돌파 파동 발생 시 호가창의 매도 잔량이 매수 잔량보다 1.5배 이상 많은 '정석 호가 배열'인가?</li>
    <li>조정 구간에서 거래대금이 최소 50% 이상 급격히 줄어들며 차분한 지지를 보여주는가?</li>
  </ol>
</div>`
  },
  col_3: {
    title: "이평선 정배열과 역배열: 이동평균선 수학적 기하학 분석과 주도주 초입 포착법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 이동평균선 정배열 확산 구간에서의 기하학적 주도주 포착법</h2>
<p>이동평균선(Moving Average)은 시장 참여자들의 일정 기간 평균 매수 단가를 나타내는 가장 기초적이면서도 강력한 기술적 지표입니다. 5일, 20일, 60일, 120일선이 순서대로 위에서 아래로 정렬된 **'정배열(Bullish Alignment)'**은 강력한 수급의 우상향 에너지를 증명합니다.</p>

<p>본 리포트에서는 단순 이동평균(SMA)과 지수 이동평균(EMA)의 수학적 매커니즘을 비교하고, 정배열 초입의 수렴 후 확산 타점을 정량 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>단순 이동평균 (SMA)</th>
      <th>지수 이동평균 (EMA)</th>
      <th>정배열 매매 전략</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>수학적 가중치</strong></td>
      <td>기간 내 모든 가격에 동일 가중치</td>
      <td>최근 가격에 가중치 연산 적용</td>
      <td>EMA 5/20 골든크로스를 반응 속도 지표로 활용</td>
    </tr>
    <tr>
      <td><strong>시차(Lagging) 현상</strong></td>
      <td>상대적으로 느림 (지연 발생)</td>
      <td>상대적으로 빠름 (추세 전환 가속)</td>
      <td>SMA 60/120을 장기 수급 저항대로 활용</td>
    </tr>
    <tr>
      <td><strong>주도주 포착</strong></td>
      <td>장기 이평선 지지 확인용</td>
      <td>단기 이평선 급등 눌림목용</td>
      <td>수렴(Squeeze) 후 정배열 확산 초입 타점</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 이동평균선 수학적 연산 공식 및 수렴 매커니즘</h2>
<p>이동평균선의 수렴(Convergence)은 시장 참여자들의 평균 단가가 하나의 가격대로 좁아졌음을 뜻하며, 이후 발생하는 거래대금 폭발은 대세 추세를 결정짓습니다.</p>

<div class="formula-box">
  SMA_N = (1/N) * SUM(P_i) &nbsp;&nbsp;|&nbsp;&nbsp; EMA_t = P_t * alpha + EMA_{t-1} * (1 - alpha)
</div>

<p>여기서 $\alpha = \frac{2}{N+1}$ 입니다. 5일, 20일, 60일, 120일 이동평균선 간의 이격도(Disparity)가 102% 이내로 밀집한 상태에서 대량 거래대금이 실릴 때, 정배열 확산 파동의 승률은 85%를 상회합니다.</p>

<hr />

<h2>3. 프로 트레이더의 실전 이동평균선 전략</h2>
<ol>
  <li><strong>역배열 탈출 타점:</strong> 장기 역배열 상태에 있던 종목이 대량 거래대금과 함께 120일 이평선을 돌파하며 안착할 때 1차 관찰.</li>
  <li><strong>정배열 초입 골든크로스:</strong> 5일선과 20일선이 골든크로스를 내고, 60일선이 우상향으로 돌아서는 수렴 확산 지점 매수.</li>
  <li><strong>20일선 눌림목:</strong> 정배열이 유지되는 상태에서 주가가 20일 이평선에 도달하고 아래꼬리 양봉이 형성될 때 2차 분할 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>20일 이동평균선이 우하향으로 꺾이고 주가가 20일선 아래로 음봉 이탈할 경우, 정배열 추세는 일단 훼손된 것입니다. 미련 없이 손절 후 재정배열 시점을 기다려야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>5일, 20일, 60일, 120일 이동평균선이 정배열 순서로 완벽히 정렬되었는가?</li>
    <li>이평선 간의 이격도가 지나치게 벌어지지 않은 '수렴 후 첫 확산' 구간인가?</li>
    <li>20일 이동평균선의 기울기가 확연한 우상향(+30도 이상)을 유지하고 있는가?</li>
  </ol>
</div>`
  },
  col_4: {
    title: "양봉과 음봉 캔들의 비밀: 시가와 종가에 담긴 주포 세력의 심리 판독법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 캔들 구조 분석을 통한 주포 세력의 의도 판독</h2>
<p>주식 차트 위의 **양봉(Bullish Candle)**과 **음봉(Bearish Candle)**은 단순한 가격의 상승과 하락을 넘어, 하루 동안 매수 주포와 매도 세력이 벌인 실시간 전쟁의 기록입니다. 특히 **시가(Open)**는 세력의 장 시작 의지이며, **종가(Close)**는 세력이 당일 마감하고 싶어 하는 최종 가격 지점입니다.</p>

<p>본 리포트에서는 캔들의 몸통(Body)과 윗꼬리·아랫꼬리(Shadow)가 시사하는 정량적 의미와 주포의 물량 분산/매집 신호를 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>캔들 유형</th>
      <th>시가/종가 및 꼬리 특징</th>
      <th>주포 세력의 심리 매커니즘</th>
      <th>실전 대응 가이드</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>장대양봉 (Full Bull)</strong></td>
      <td>시가가 최저가, 종가가 최고가 (꼬리 없음)</td>
      <td>장중 매도세를 완벽히 제압한 매집 확정</td>
      <td>다음 날 시초가 갭상승 타점 관찰</td>
    </tr>
    <tr>
      <td><strong>윗꼬리 장대양봉</strong></td>
      <td>고점 형성 후 상방 저항에 밀려 하락</td>
      <td>고점 개인 물량 분산 또는 전고점 매물 소화</td>
      <td>거래대금 규모에 따라 매집vs설거지 판별</td>
    </tr>
    <tr>
      <td><strong>망치형 (Hammer)</strong></td>
      <td>장중 폭락 후 아랫꼬리 달고 종가 회복</td>
      <td>바닥권 메이저 저가 매수 수급 유입</td>
      <td>손절가(아랫꼬리 저점) 설정 후 매수</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 캔들 몸통 대 꼬리 비율 (Body-to-Shadow Ratio) 수식</h2>
<p>트레이더는 캔들의 길이를 수치화하여 매수 강도를 정량 계산합니다.</p>

<div class="formula-box">
  Strength = ((Close - Open) / (High - Low)) * 100
</div>

<p>캔들의 Strength 수치가 80% 이상을 기록하는 장대양봉이 수천억 거래대금과 함께 출현할 경우, 이는 주포의 완벽한 수급 제어를 의미합니다. 반대로 Strength가 마이너스이면서 윗꼬리가 전체 길이의 50% 이상을 차지하면 매도 압력이 지배한 것입니다.</p>

<hr />

<h2>3. 프로 트레이더의 캔들 매매 전략</h2>
<ol>
  <li><strong>시가 갭 상승 양봉:</strong> 전일 고점을 갭으로 넘어서서 시작한 후 시가를 깨지 않고 밀어 올리는 양봉 매수.</li>
  <li><strong>전고점 매물 소화 윗꼬리:</strong> 전고점 저항대에서 거래대금을 터트리며 발생한 윗꼬리는 '매물 소화'로 판단하여 다음 날 눌림목 매수.</li>
  <li><strong>음봉 시가 회복 타점:</strong> 전일 음봉의 시가를 다음 날 거래대금과 함께 양봉으로 넘어서는 '양봉 감싸기(Engulfing)' 패턴 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>고점권에서 거래대금이 폭발하며 길게 달린 윗꼬리 음봉(Dark Cloud Cover)은 주포의 물량 털기(Disposal)일 확률이 매우 높습니다. 이때는 즉시 매도 후 관망해야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>당일 양봉의 종가가 장중 고점 근처(상위 20% 이내)에서 깔끔하게 마감되었는가?</li>
    <li>장중 발생한 아랫꼬리가 주요 이동평균선(20일선 등)의 지지를 정교하게 받았는가?</li>
    <li>전일 발생한 음봉의 시가 저항대를 당일 거래대금 양봉으로 뚫어냈는가?</li>
  </ol>
</div>`
  },
  col_5: {
    title: "지지와 저항의 원리: 전고점 돌파 매매의 수급적 원리와 승률 극대화 공략",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 전고점 매물대 돌파 시 발생하는 매물 매커니즘과 승률 극대화</h2>
<p>주식 차트에서 **'저항(Resistance)'**은 이전에 주가가 꺾였던 지점으로, 물려 있는 개인 투자자들의 매도 본전 물량이 집중되는 구간입니다. 반대로 **'지지(Support)'**는 하락하던 주가를 하방에서 받아내는 매수벽입니다.</p>

<p>전고점 저항대를 대량 거래대금으로 강력히 뚫어내는 **'전고점 돌파 매매(Breakout Strategy)'**는 저항선이 새로운 지지선으로 변환(Role Reversal)되는 수급 매커니즘을 이용한 최고의 핵심 전략입니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>저항대 (Resistance)</th>
      <th>지지대 (Support)</th>
      <th>돌파 후 역할 전환 (Role Reversal)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>수급 심리</strong></td>
      <td>본전 심리에 의한 매도 물량 대기</td>
      <td>저가 매수 및 대기 수급의 유입</td>
      <td>과거 저항선이 강력한 새로운 지지선으로 변화</td>
    </tr>
    <tr>
      <td><strong>거래대금 조건</strong></td>
      <td>과거 저항 형성 당시 거래대금 능가 필수</td>
      <td>조정 시 거래대금 급감 필수</td>
      <td>저항대 돌파 시 사상 최대 거래대금 분출</td>
    </tr>
    <tr>
      <td><strong>돌파 성공률</strong></td>
      <td>3회 이상 두드린 저항일수록 돌파 확률 가중</td>
      <td>3회 이상 지지된 구간일수록 손절가 명확</td>
      <td>돌파 직후 첫 눌림목(Pullback)이 최고 타점</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 저항대 돌파 수급 매커니즘 수식</h2>
<p>돌파 매매의 성공 여부는 과거 저항대의 매물대 높이를 당일 유입된 거래대금이 삼켜버릴 수 있느냐에 달려 있습니다.</p>

<div class="formula-box">
  Breakout Ratio = (Current Day TV / Resistance Day TV) * 100
</div>

<p>Breakout Ratio가 150% 이상을 기록하며 전고점 가격대를 종가 기준으로 확실히 안착할 때, 가짜 돌파(Fakeout) 가능성은 10% 이하로 급감합니다.</p>

<hr />

<h2>3. 프로 트레이더의 돌파 매매 실전 전략</h2>
<ol>
  <li><strong>돌파 직전 에너지 수렴 관찰:</strong> 전고점 바로 아래에서 주가가 밀리지 않고 캔들이 좁게 밀집하는 'Ascending Triangle' 형성 시 주목.</li>
  <li><strong>1차 돌파 매수:</strong> 전고점 가격을 분당 수십억 거래대금으로 뚫어내는 시점에 50% 비중 진입.</li>
  <li><strong>2차 풀백(Pullback) 매수:</strong> 돌파 후 전고점 가격대까지 잠시 지지 테스트가 올 때 남은 50% 비중 추가 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>돌파 후 주가가 전고점 저항선 아래로 다시 밀려 내려가 종가 마감할 경우, 이는 '가짜 돌파(Fakeout Trap)'입니다. 즉시 손절매를 단행하여 계좌를 보호해야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>당일 돌파 거래대금이 과거 전고점 형성 당시 거래대금을 확실히 능가하는가?</li>
    <li>돌파하려는 저항대가 최소 2회 이상 형성된 명확한 전고점 매물대인가?</li>
    <li>돌파 후 손절 라인(전고점 라인 -1.5%)이 명확하게 계산되는가?</li>
  </ol>
</div>`
  },
  col_6: {
    title: "장 초반(09:00~10:00) 1시간 매매가 하루 수익을 결정하는 이유: 수급 집계 및 시초가 패턴",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 장 개장 후 1시간 유동성 집중 매커니즘 분석</h2>
<p>한국 주식 시장의 하루 전체 거래대금 중 약 40%~50% 이상이 **장 개장 후 첫 1시간(09:00~10:00)**에 집중됩니다. 밤사이 축적된 글로벌 매크로 호재/악재, 시초가 갭 형성, 메이저 기관 및 외국인 알고리즘의 초기 바스켓 매매가 이 1시간 동안 가장 격렬하게 분출되기 때문입니다.</p>

<p>본 리포트에서는 장 초반 1시간 동안의 체결 속도를 분석하여 당일 승률을 높이는 시초가 매매 프로토콜을 제시합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>시간대</th>
      <th>유동성 및 수급 특징</th>
      <th>트레이더 행동 요령</th>
      <th>위험 요소</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>09:00 ~ 09:15</strong></td>
      <td>변동성 극대화 (하루 최고 거래량 집중)</td>
      <td>시초가 갭 진성 여부 판단 및 주도주 1차 진입</td>
      <td>시초가 갭상승 후 장대음봉 핑퐁 위험</td>
    </tr>
    <tr>
      <td><strong>09:15 ~ 09:30</strong></td>
      <td>첫 눌림목 형성 및 지지 테스트</td>
      <td>3분봉 20선/VWAP 지지 확인 후 2차 매수</td>
      <td>거래대금 급감 시 가짜 눌림목 주의</td>
    </tr>
    <tr>
      <td><strong>09:30 ~ 10:00</strong></td>
      <td>당일 주도주 상한가/고점 안착 결정</td>
      <td>추세 모멘텀 지속 여부 확인 및 분할 이익실현</td>
      <td>10시 이후 수급 이탈 시 지루한 횡보 진입</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 시초가 거래 밀도 및 체결 모멘텀 수식</h2>
<p>장 시작 15분 만에 당일 주도주 여부를 판가름하기 위해 **시초가 유동성 비율(Initial Liquidity Ratio)**을 계산합니다.</p>

<div class="formula-box">
  ILR (%) = (TV_{09:00-09:15} / Average Daily TV) * 100
</div>

<p>장 시작 15분 만에 ILR이 20%를 초과하는 종목은 당일 주도주 확률이 90% 이상입니다. 이때 시초가를 위로 뚫어내는 파동이 발생하면 강력한 추세가 형성됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 장 초반 1시간 매매 전략</h2>
<ol>
  <li><strong>08:40~09:00 예상체결가 확인:</strong> 예상체결가 갭상승률이 +3%~+7% 선이며 거래량이 실리는 주도 후보주 포착.</li>
  <li><strong>09:03 첫 3분봉 완성 관찰:</strong> 첫 3분봉이 양봉으로 마감하고 거래대금이 50억 원 이상 실릴 때 시초가 돌파 매수.</li>
  <li><strong>09:20 눌림목 지지 매수:</strong> 첫 상승 후 3분봉 상 5선 또는 20선까지 눌려줄 때 거래량 감소 확인 후 진입.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>09:30 이후 거래대금이 급격히 마르고 주가가 시초가 아래로 음봉 침범할 경우, 당일 시초가 갭 트랩(Gap Trap)에 걸린 것입니다. 미련 없이 청산하여 당일 수익을 지켜야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>장 시작 15분 이내에 최소 100억 원 이상의 현금 체결대금이 집중되었는가?</li>
    <li>첫 3분봉의 고점을 다음 캔들이 대량 거래대금으로 재차 돌파하고 있는가?</li>
    <li>손절가를 당일 시초가 또는 첫 3분봉 저점(-1.5%~-2%)으로 명확히 고정하였는가?</li>
  </ol>
</div>`
  },
  col_7: {
    title: "거래대금 상위 종목 복기법: 수급 솔림 현상과 주도주 순환매 경로 포착",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Executive Report] 당일 거래대금 TOP 30 종목 복기를 통한 시장 주도권 분석</h2>
<p>주식 시장의 모든 돈은 무작위로 흐르지 않고, 반드시 당일 가장 강력한 명분(재료)을 가진 특정 테마와 섹터로 집단 쏠림 현상을 보입니다. 장 마감 후 **'거래대금 상위 종목 list'**를 복기하는 것은 시장의 돈이 어디서 빠져나와 어디로 흘러 들어갔는지를 규명하는 핵심 프로세스입니다.</p>

<p>본 리포트에서는 거래대금 상위 종목의 수급 연속성을 판별하고 다음 날 주도 테마를 예측하는 정량 복기 틀을 다룹니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>단순 상승률 상위 종목</th>
      <th>거래대금 상위 종목 (TOP 30)</th>
      <th>복기 가치 및 시사점</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>자금의 무게</strong></td>
      <td>소액 자금으로 상한가 (우선주/품절주)</td>
      <td>수천억 원의 메이저 자금 실물 입증</td>
      <td>연속성과 연속 상승 파동 보장</td>
    </tr>
    <tr>
      <td><strong>매매 안정성</strong></td>
      <td>호가창이 얇아 슬리피지 극심</td>
      <td>풍부한 유동성으로 손절 및 익절 용이</td>
      <td>대형 자금 집행 가능성 제공</td>
    </tr>
    <tr>
      <td><strong>주도 섹터 판별</strong></td>
      <td>개별 재료 점상한가 (착시 현상)</td>
      <td>동일 테마 내 3개 이상 종목 동반 상위 랭크</td>
      <td>섹터 전체의 대세 상승 유도</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 거래대금 집중도 (Liquidity Concentration Index) 수식</h2>
<p>시장의 유동성이 특정 섹터에 얼마나 밀집되었는지 판별하기 위해 **LCI 지수**를 활용합니다.</p>

<div class="formula-box">
  LCI (%) = (Sum of Sector Top 3 TV / Total Market TV) * 100
</div>

<p>특정 테마 섹터(예: 반도체, 바이오)의 상위 3개 종목 거래대금 합계가 전체 시장 거래대금의 10%를 초과할 때, 해당 테마는 단순 단발성 호재가 아닌 **주 단위 대세 주도 테마**로 확정됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 거래대금 상위 복기 루틴</h2>
<ol>
  <li><strong>15:30 장 마감 후 TOP 30 추출:</strong> 거래대금 1,000억 원 이상 기록한 종목 스크리닝.</li>
  <li><strong>테마별 그룹핑(Clustering):</strong> 동일한 뉴스/재료로 움직인 종목들을 대장주-2등주-3등주로 분류.</li>
  <li><strong>수급 주체 확인:</strong> 외국인/기관의 양매수 유입 여부 및 시간에 외 단일가 거래량 체크.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>거래대금 상위권에 랭크되었으나 주가가 장대음봉으로 마감하였거나, 대주주 지분 매도 등 악재성 거래대금 폭발인 종목은 복기 대상에서 '수급 훼손 종목'으로 분류하여 즉시 제외합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>복기한 종목이 당일 거래대금 최소 1,000억 원 이상을 상회하였는가?</li>
    <li>동일 테마 내에서 2등주, 3등주가 함께 거래대금을 터트리며 집단성을 입증하였는가?</li>
    <li>차트 위치가 일봉상 전고점 매물대를 뚫어내는 상방 개방 구간인가?</li>
  </ol>
</div>`
  },
  col_8: {
    title: "차세대 반도체의 핵심, HBM(고대역폭 메모리) 개념과 핵심 밸류체인 총정리",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Industry Report] AI 반도체 혁명과 HBM(High Bandwidth Memory) 밸류체인 해부</h2>
<p>AI 가속기(NVIDIA GPU)의 처리 속도가 폭발함에 따라 기존 DDR 메모리의 데이터 전송 병목 현상을 해결하기 위해 등장한 혁신 기술이 바로 **HBM(고대역폭 메모리)**입니다. 여러 개의 DRAM을 수직으로 적층하고 **TSV(구멍을 뚫는 실리콘 관통 비아)** 기술로 연결하여 데이터 전송 통로를 수천 개로 확장한 핵심 부품입니다.</p>

<p>본 리포트에서는 HBM3e/HBM4의 기술적 매커니즘과 한국 증시 반도체 소부장(한미반도체, SK하이닉스 등) 핵심 밸류체인의 수급 모멘텀을 정밀 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>기존 DDR5 메모리</th>
      <th>HBM3e / HBM4 메모리</th>
      <th>주요 수혜 밸류체인</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>구조적 차이</strong></td>
      <td>단층 평면 패키징 (Pin 수 제한)</td>
      <td>TSV 수직 적층 (대역폭 1TB/s 이상)</td>
      <td>SK하이닉스, 삼성전자</td>
    </tr>
    <tr>
      <td><strong>핵심 공정 장비</strong></td>
      <td>전통적인 와이어 본딩</td>
      <td>열압착 듀얼 본딩 (TC Bonder) 및 Fluxless 본딩</td>
      <td>한미반도체, 제우스</td>
    </tr>
    <tr>
      <td><strong>검사 및 소재</strong></td>
      <td>단품 DRAM 검사</td>
      <td>적층 수율 검사 및 보호 소재 (CUF / NCF)</td>
      <td>테크윙, 이오테크닉스, 에프에스티</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. HBM 데이터 대역폭 공식 및 수율 매커니즘</h2>
<p>HBM의 성능은 데이터 버스 폭(Bus Width)과 작동 속도(Pin Speed)의 곱으로 산출됩니다.</p>

<div class="formula-box">
  Bandwidth (GB/s) = (Bus Width in bits * Pin Speed in Gbps) / 8
</div>

<p>HBM3e 8단 적층 기준 1,024개의 TSV 통로를 통해 초당 1.2TB 이상의 데이터를 처리합니다. 적층 수가 늘어날수록 **수율(Yield Rate)** 관리가 극도로 어려워지므로, TC 본더 장비와 검사 장비 업체의 영업이익률이 30%~40%를 상회하는 프리미엄을 받게 됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 HBM 섹터 매매 전략</h2>
<ol>
  <li><strong>엔비디아(NVDA) 주가 연동:</strong> 미 증시 엔비디아 실적 발표 및 주가 추이와 SK하이닉스·한미반도체의 수급을 커플링 매매.</li>
  <li><strong>공정 전환 수혜주 포착:</strong> HBM4 전환 시 MR-MUF 대 Hybrid Bonding 도입에 따른 신규 장비주 선점.</li>
  <li><strong>외국인 수급 유입 타점:</strong> 반도체 대장주의 외국인 기관 양매수 유입 시 소부장 2등주 눌림목 타점 공략.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>빅테크 기업들의 AI CapEx(설비투자) 축소 우려나 Big Tech의 자체 NPU 칩 개발 악재가 터질 경우, HBM 수주 지연에 따른 투매가 발생할 수 있습니다. 엔비디아의 조정 파동 시 비중을 신속히 축소해야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>엔비디아 및 SOX(필라델피아 반도체 지수)의 야간 주가 흐름이 양호한가?</li>
    <li>SK하이닉스/한미반도체에 외국인 패시브 자금의 연속 매수세가 유입되고 있는가?</li>
    <li>HBM 밸류체인 종목의 일봉 차트가 20일 이동평균선 위에서 거래대금을 유지하는가?</li>
  </ol>
</div>`
  },
  col_9: {
    title: "반도체 전공정과 후공정(OSAT) 차이점과 시장 주도주 흐름 이해하기",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Industry Report] 반도체 전공정 vs 후공정(OSAT) 생태계 해부</h2>
<p>반도체 제조 과정은 크게 웨이퍼 위에 회로를 그리고 패터닝하는 **전공정(Front-End)**과, 완성된 웨이퍼를 자르고 적층하여 패키징하는 **후공정(Back-End / OSAT)**으로 나뉩니다.</p>

<p>최근 미세화 공정의 물리적 한계(2nm 이하)에 봉착함에 따라, 시장의 주도권은 전공정 증착/식각 장비에서 **어드밴스드 패키징(Advanced Packaging) 중심의 후공정(OSAT) 섹터**로 대전환되었습니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>전공정 (Front-End)</th>
      <th>후공정 (Back-End / OSAT)</th>
      <th>투자 아이디어</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>주요 작업</strong></td>
      <td>노광(EUV), 식각(Etch), 증착(CVD/ALD)</td>
      <td>다이싱, 테스트, 적층, 패키징</td>
      <td>미세화 한계로 후공정 가치 상승</td>
    </tr>
    <tr>
      <td><strong>주요 관련주</strong></td>
      <td>원익IPS, 주성엔지니어링, HPSP</td>
      <td>두산테스나, 하나마이크론, 리노공업</td>
      <td>HBM 및 2.5D 패키징 수혜 집중</td>
    </tr>
    <tr>
      <td><strong>사이클 특성</strong></td>
      <td>삼성전자/하이닉스의 CapEx 투자에 집행</td>
      <td>AI 반도체 수요에 따른 가동률 직접 연동</td>
      <td>후공정 OSAT 업체의 실적 성장세 압도</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. OSAT 가동률과 칩렛(Chiplet) 수율 매커니즘</h2>
<p>어드밴스드 패키징의 핵심 지표는 **소켓/프로브카드 소모율**과 **OSAT 업체의 가동률(Utilization Rate)**입니다.</p>

<div class="formula-box">
  Utilization Rate (%) = (Actual Wafer Output / Total Capacity) * 100
</div>

<p>OSAT 업체의 가동률이 85%를 돌파하면 테스팅 소켓(리노공업, ISC)의 교체 주기가 급격히 단축되어 소모품 관련주의 영업이익률이 40% 이상으로 급증합니다.</p>

<hr />

<h2>3. 프로 트레이더의 반도체 공정 매매 전략</h2>
<ol>
  <li><strong>주도주 순환매 타점:</strong> 후공정 한미반도체·리노공업이 선제 급등 후 쉬어갈 때, 전공정 HPSP·주성엔지니어링으로 돈이 이동하는 순환매 포착.</li>
  <li><strong>실적 시즌 가동률 체크:</strong> OSAT 및 테스팅 업체의 분기 가동률 추이를 정량 확인 후 실적 모멘텀 매수.</li>
  <li><strong>EUV / CXL 모멘텀:</strong> 전공정 차세대 기술(EUV 펠리클 등) 호재 발생 시 관련 소부장 돌파 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>메모리 반도체 가격(DRAM/NAND 고정거래가)이 하락세로 전환될 경우, 종합 반도체 기업(IDM)들은 후공정 외주 물량을 줄이므로 OSAT 종목의 손절 라인을 엄격히 지켜야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>현재 반도체 시장의 수급이 전공정과 후공정 중 어느 쪽으로 집중되고 있는가?</li>
    <li>선정 종목의 테스팅 소켓 및 패키징 가동률이 상승 추세를 유지하는가?</li>
    <li>외국인 및 기관의 수급이 최소 3일 이상 연속 순매수로 유입되고 있는가?</li>
  </ol>
</div>`
  },
  col_10: {
    title: "바이오 섹터 투자 시 꼭 알아야 할 임상 1상·2상·3상 의미와 리스크 정량 평가",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Bio Report] 신약 개발 임상 단계별 성공 확률과 리스크 정량 평가</h2>
<p>바이오 신약 개발 섹터는 성공 시 수천 퍼센트의 폭발적 수익을 제공하지만, 임상 실패 시 단 하루 만에 주가가 -50% 이상 폭락하는 극단적인 고위험·고수익 영역입니다. 성공적인 바이오 투자를 위해서는 **임상 1상, 2상, 3상, 그리고 기술이전(L/O, License-Out)**의 정량적 성공 확률과 일정을 명확히 파악해야 합니다.</p>

<p>본 리포트에서는 글로벌 FDA 임상 성공률 데이터와 기술이전 계약 가치 산출법을 정밀 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>임상 단계</th>
      <th>시험 대상 및 목적</th>
      <th>통계적 성공 확률 (FDA 기준)</th>
      <th>투자 매커니즘 & 리스크</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>임상 1상 (Phase 1)</strong></td>
      <td>건강한 사람 (20~100명) / 안전성 검증</td>
      <td>약 63.2%</td>
      <td>기술이전(L/O) 가능성이 열리는 초입 단계</td>
    </tr>
    <tr>
      <td><strong>임상 2상 (Phase 2)</strong></td>
      <td>소수 환자 (100~300명) / 유효성 및 용량 결정</td>
      <td>약 30.7% (가장 통곡의 벽)</td>
      <td>유효성 입증 시 주가 폭발적 모멘텀 분출</td>
    </tr>
    <tr>
      <td><strong>임상 3상 (Phase 3)</strong></td>
      <td>대규모 환자 (수천 명) / 기존 약 대비 우위 입증</td>
      <td>약 58.1%</td>
      <td>막대한 비용 소모 및 최종 승인 직전 사활</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 바이오 기업 파이프라인 NPV(순현재가치) 산출 수식</h2>
<p>신약 파이프라인의 가치는 임상 단계별 성공 확률(POS)을 반영한 **rNPV(Risk-adjusted Net Present Value)**로 결정됩니다.</p>

<div class="formula-box">
  rNPV = SUM( (Cash Flow_t * POS_t) / (1 + r)^t )
</div>

<p>임상 2상이 성공하여 POS(Probability of Success)가 30%에서 60%로 상승하면, 기업의 rNPV 가치는 단순 계산으로도 2배 이상 급증하여 주가 폭등의 명분을 제공합니다.</p>

<hr />

<h2>3. 프로 트레이더의 바이오 매매 전략</h2>
<ol>
  <li><strong>학회 모멘텀 매매 (AACR, ASCO, ESMO):</strong> 주요 암학회 발표 2~3개월 전부터 주식을 매집하고, 학회 개막 직전 전량 이익 실현.</li>
  <li><strong>플랫폼 기술 이전(L/O) 기업 선점:</strong> 단일 물질이 아닌 알테오젠·펩트론 등 플랫폼 기술 보유주 공략.</li>
  <li><strong>임상 데이터 발표 락업 피하기:</strong> 임상 결과 발표 당일은 갭상승 후 재료 소멸 음봉이 자주 발생하므로 선제적 익절.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>바이오 종목은 임상 실패 악재 발생 시 차트의 지지선이 아무런 의미를 갖지 못합니다. 학회나 결과 발표 직전 비중을 반드시 50% 이하로 줄여 예기치 못한 리스크에 대비하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>타겟으로 하는 글로벌 학회나 임상 결과 발표 일정이 최소 1~2개월 이상 남아있는가?</li>
    <li>해당 파이프라인이 단일 물질이 아닌 다중 확장 가능한 '플랫폼 기술'인가?</li>
    <li>무상증자, 전환사채(CB) 물량 오버행 리스크가 차트 상단을 가로막고 있지 않은가?</li>
  </ol>
</div>`
  },
  col_11: {
    title: "비만치료제(GLP-1) 글로벌 트렌드와 한국 바이오 관련주 탑픽 분석",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Bio Report] GLP-1 비만치료제 100조 원 시장 개막과 한국 바이오 탑픽</h2>
<p>노보 노디스크(위고비)와 엘리 릴리(젭바운드)가 이끄는 **GLP-1(글루카곤 유사 펩타이드-1) 기반 비만치료제** 시장은 인류 역사상 가장 빠르게 성장하는 100조 원 규모의 메가 트렌드입니다. 비만 치료를 넘어 심뇌혈관 질환, 지방간(MASH), 신장 질환으로 적응증이 확장되며 글로벌 제약바이오의 지형을 뒤흔들고 있습니다.</p>

<p>본 리포트에서는 GLP-1의 피하주사(SC) 및 지속형 장기 투여 기술, 그리고 한국 바이오 기업(펩트론, 한미약품, 인벤티지랩 등)의 정량적 가치를 해부합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>글로벌 선도 기업 (Novo / Lilly)</th>
      <th>한국 핵심 바이오 기업 (Top Picks)</th>
      <th>핵심 기술 및 수혜 포인트</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>기술적 병목</strong></td>
      <td>매주 1회 피하주사 (투여 편의성 한계)</td>
      <td>펩트론, 인벤티지랩, 한미약품</td>
      <td>1개월/3개월 1회 지속형 서방형 제형 기술</td>
    </tr>
    <tr>
      <td><strong>주요 적응증</strong></td>
      <td>체중 감량 (-15%~20%), 당뇨 병용</td>
      <td>삼천당제약, 디앤디파마텍</td>
      <td>경구용(먹는 약) GLP-1 제형 변경 플랫폼</td>
    </tr>
    <tr>
      <td><strong>시장 모멘텀</strong></td>
      <td>글로벌 공급 부족 (CapEx 대폭 증설)</td>
      <td>빅테크 글로벌 제약사 대상 L/O 계약 임박</td>
      <td>수조 원대 라이선스 아웃 및 턴키 생산 수혜</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 약물 지속성 및 방출 제어(SmartDepot) 매매 매커니즘</h2>
<p>GLP-1 약물의 핵심 가치는 **약물 혈중 농도의 안정적 유지(PK Profile)**에 있습니다.</p>

<div class="formula-box">
  AUC (Area Under Curve) Stability = (C_max / C_min) -> 1.0 Ideal Target
</div>

<p>지속형 약물 전달 플랫폼 기술은 약물의 급격한 초기 방출(Initial Burst)을 억제하면서 1개월간 일정한 농도를 유지시킵니다. 이 기술을 입증한 한국 기업은 글로벌 빅파마와의 독점 계약 타결 시 기업가치가 수배 이상 재평가(Re-rating)됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 GLP-1 바이오 매매 전략</h2>
<ol>
  <li><strong>글로벌 빅파마 실적 연동:</strong> 노보 노디스크와 엘리 릴리의 최고가 경신 시 국내 관련주 주도 파동 동참.</li>
  <li><strong>플랫폼 기술 이전(L/O) 공시 매매:</strong> 글로벌 빅파마와의 물질이전계약(MTA) 및 독점 평가 계약 뉴스 시 눌림목 매수.</li>
  <li><strong>경구용 / 장기지속형 차별화:</strong> 주사제에서 먹는 약으로 트렌드가 이동할 때 경구용 제형 기술 보유주 선점.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>GLP-1 관련주 중 실질적인 기술이나 특허 없이 단순 관련주로 묶인 '가짜 테마주'는 기술 검증 뉴스 발생 시 폭락합니다. 반드시 특허 및 빅파마 평가 진행 여부를 확인하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>선정한 기업이 글로벌 빅파마와 실질적인 MTA 또는 기술 평가를 진행 중인가?</li>
    <li>차트상 주가가 20일 이동평균선 지지를 받으며 외국인 기관 수급이 유입되는가?</li>
    <li>체중 감량 효과 외에 부작용(근손실, 오심)을 극복한 차세대 파이프라인인가?</li>
  </ol>
</div>`
  },
  col_12: {
    title: "무네히사 혼마: 세계 최초 캔들차트 및 사카타 오법(酒田五法) 개발과 현대 트레이딩 적용",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 무네히사 혼마와 캔들차트: 250년 역사의 사카타 오법(酒田五法) 정량 분석</h2>
<p>오늘날 전 세계 모든 금융 시장의 모니터 위에 오르내리는 '양봉과 음봉', 즉 캔들차트(Candlestick Chart)는 18세기 일본 에도 시대 오사카 도지마 쌀 선물 시장의 거상 **무네히사 혼마(本間宗久, 1724~1803)**가 세계 최초로 창안한 위대한 유산입니다.</p>

<p>혼마는 단순한 수급을 넘어 **'인간 심리의 격동과 자본의 쏠림'**이 가격을 결정한다는 본질을 간파하고, 시가·고가·저가·종가를 하나로 시각화했습니다. 그가 정립한 **사카타 오법(酒田五法)**은 250년이 지난 오늘날 주도주 분석에서도 완벽히 작동합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>사카타 오법 패턴</th>
      <th>구조적 특징</th>
      <th>현대 차트 패턴 해석</th>
      <th>트레이더 승률 타점</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>삼산 (三山)</strong></td>
      <td>세 번의 고점 형성 후 실패</td>
      <td>헤드앤숄더 / 삼중 고점 (Head & Shoulders)</td>
      <td>넥라인 이탈 시 전량 매도 및 숏 타점</td>
    </tr>
    <tr>
      <td><strong>삼천 (三川)</strong></td>
      <td>바닥권 세 번의 지지 확인</td>
      <td>역헤드앤숄더 / 삼중 바닥 (Triple Bottom)</td>
      <td>중간 고점 대량 거래대금 돌파 시 매수</td>
    </tr>
    <tr>
      <td><strong>삼병 (三兵)</strong></td>
      <td>적삼병 (3연속 양봉) / 흑삼병 (3연속 음봉)</td>
      <td>강력한 수급 유입 / 대세 투매 발생</td>
      <td>적삼병 첫 눌림목 5일선 매수</td>
    </tr>
    <tr>
      <td><strong>삼공 (三空)</strong></td>
      <td>연속 3번의 갭(Gap) 발생</td>
      <td>시세 과열의 극치 / 에너지 고갈</td>
      <td>3공 발생 후 역발상 과열 식히기 익절</td>
    </tr>
    <tr>
      <td><strong>삼법 (三法)</strong></td>
      <td>상승 후 3일간 건전한 음봉 쉬어가기</td>
      <td>상승 삼법 (Rising Three Methods)</td>
      <td>조정 후 장대양봉 돌파 시 2차 눌림목 매수</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 캔들 몸통 대 꼬리의 수급 모멘텀 공식</h2>
<p>혼마는 캔들의 시가 대비 종가 위치를 통해 매수세의 지배력을 수학적으로 측정했습니다.</p>

<div class="formula-box">
  Candle Dominance = (Close - Low) / (High - Low)
</div>

<p>Candle Dominance 수치가 0.8 이상(80%)으로 마감하는 적삼병 양봉이 출현할 경우, 이는 시장 주도주 매집의 확정 신호입니다.</p>

<hr />

<h2>3. 프로 트레이더의 사카타 오법 실전 전략</h2>
<ol>
  <li><strong>적삼병 수급 확인:</strong> 바닥권에서 거래대금이 3일 연속 증가하며 적삼병 형성 시 1차 매수.</li>
  <li><strong>상승 삼법 눌림목:</strong> 장대양봉 후 3일간 거래대금이 급감하는 음봉 도지가 나올 때 2차 분할 매수.</li>
  <li><strong>3공 과열 매도:</strong> 3번 연속 갭상승을 기록하며 밴드 상단을 이탈할 때 분할 이익 실현.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>흑삼병(3일 연속 장대음봉)이 터지며 주요 이동평균선이 훼손될 경우, 주포의 물량 분산이 진행되는 것이므로 즉시 손절매 프로토콜을 가동하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>적삼병 출현 시 당일 거래대금이 전일 대비 크게 확증적으로 증가하였는가?</li>
    <li>상승 삼법 조정 구간에서 음봉의 길이가 전일 장대양봉 몸통을 훼손하지 않았는가?</li>
    <li>삼산(헤드앤숄더) 저항대에서 거래량이 고갈되는 패턴이 관찰되는가?</li>
  </ol>
</div>`
  },
  col_13: {
    title: "찰스 다우: 다우존스 지수 창시와 현대 주식 시장 분석의 뿌리 '다우 이론' 6대 원칙",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 찰스 다우와 다우 이론(Dow Theory) 6대 원칙 정량 해부</h2>
<p>월스트리트저널(WSJ)의 창립자이자 다우존스 지수의 아버지인 **찰스 다우(Charles H. Dow, 1851~1902)**는 현대 주식 시장 분석의 근간을 세웠습니다. 그가 정립한 **'다우 이론(Dow Theory)'**은 추세(Trend)를 정의하고 자금의 흐름을 읽는 모든 기술적 분석의 헌법과 같습니다.</p>

<p>본 리포트에서는 다우 이론의 6대 원칙과 매집-대중참여-분산 3단계 국면을 정량 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>다우 이론 원칙</th>
      <th>핵심 매커니즘</th>
      <th>현대 주식 시장 적용</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. 평균은 모든 것을 반영한다</strong></td>
      <td>뉴스, 경제지표, 공포, 희망이 가격에 즉시 선반영</td>
      <td>차트 주가가 악재보다 먼저 반등하는 매커니즘</td>
    </tr>
    <tr>
      <td><strong>2. 추세의 3가지 유형</strong></td>
      <td>주 추세(1년 이상), 중기 추세, 소 추세(잔파도)</td>
      <td>단기 노이즈에 흔들리지 않는 주 추세 매매</td>
    </tr>
    <tr>
      <td><strong>3. 주 추세 3단계</strong></td>
      <td>매집 국면 -> 대중 참여 국면 -> 분산 국면</td>
      <td>스마트 머니의 매집과 개인의 FOMO 분산 구별</td>
    </tr>
    <tr>
      <td><strong>4. 상호 확인의 원칙</strong></td>
      <td>다우 산업지수와 운송지수의 동반 신고가 갱신</td>
      <td>KOSPI와 KOSDAQ, 반도체와 소부장의 동반 급등</td>
    </tr>
    <tr>
      <td><strong>5. 거래량은 추세를 확인한다</strong></td>
      <td>추세 방향으로 주가 이동 시 거래량 폭발 필수</td>
      <td>상승 시 거래대금 폭발, 조정 시 거래대금 급감</td>
    </tr>
    <tr>
      <td><strong>6. 명확한 반전 신호 전까지 유지</strong></td>
      <td>고점/저점이 높아지는 한 상승 추세는 지속됨</td>
      <td>Higher High & Higher Low 법칙 고수</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 추세 지속성 및 고점/저점 수식</h2>
<p>상승 추세의 유효성은 이전 저점(Higher Low)을 깨지 않는 구조적 조건에 의해 결정됩니다.</p>

<div class="formula-box">
  Trend Valid = (Low_t > Low_{t-1}) AND (High_t > High_{t-1})
</div>

<p>이 조건이 만족하는 한, 주가는 상승 추세를 유지하는 것이며 조기에 고점을 단정하고 손절하거나 매도해서는 안 됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 다우 이론 실전 전략</h2>
<ol>
  <li><strong>1단계 매집 국면 포착:</strong> 대중이 공포에 질려 투매할 때, 거래대금이 실리며 바닥을 잡는 스마트 머니 매집 동참.</li>
  <li><strong>2단계 대중 참여 국면 탑승:</strong> 돌파 양봉과 함께 주 추세 우상향이 확정될 때 비중 확대.</li>
  <li><strong>3단계 분산 국면 이탈:</strong> 호재 뉴스가 쏟아지나 거래량이 터지며 고점에서 밀릴 때 전량 이익 실현.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>주가가 전저점(Higher Low)을 깨고 내려가는 음봉이 발생할 때 다우 이론상 상승 추세는 종료된 것입니다. 미련 없이 손절 후 하락 추세 전환에 대응하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>현재 종목의 차트가 고점과 저점을 지속적으로 높이는 정석 상승 추세인가?</li>
    <li>상승 파동에서 거래대금이 증가하고, 조정 파동에서 거래대금이 급감하는가?</li>
    <li>동일 섹터 내 다른 대장주가 동반 신고가를 경신하며 상호 확인 원칙을 만족하는가?</li>
  </ol>
</div>`
  },
  col_14: {
    title: "리처드 샤바커: 차트 패턴 분석의 아버지, 헤드앤숄더와 대칭 삼각형의 발견",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 리처드 샤바커: 차트 패턴 체계화와 정량적 매물대 분석</h2>
<p>헤드앤숄더(Head & Shoulders), 이중바닥(Double Bottom), 대칭 삼각형(Symmetrical Triangle) 등 현대 기술적 분석가들이 사용하는 패턴의 대의는 1930년대 <strong>리처드 샤바커(Richard W. Schabacker)</strong>에 의해 최초로 체계화되었습니다.</p>

<p>샤바커는 차트에 나타나는 기하학적 형태가 **'지주 세력과 대중 간의 지지와 저항 싸움 결과물'**임을 밝혀냈습니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>패턴 유형</th>
      <th>기하학적 형성 구조</th>
      <th>거래량 특징</th>
      <th>목표가 계산 및 대응</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>헤드앤숄더 (Top)</strong></td>
      <td>왼쪽 어깨 < 머리 > 오른쪽 어깨</td>
      <td>머리 대비 오른쪽 어깨 거래량 급감</td>
      <td>넥라인 이탈 지점에서 (머리-넥라인) 높이만큼 하락</td>
    </tr>
    <tr>
      <td><strong>이중바닥 (W바닥)</strong></td>
      <td>동일 가격대에서 2회 지지 확인</td>
      <td>두 번째 바닥 돌파 시 대량 거래대금</td>
      <td>중간 넥라인 돌파 시 매수 (목표가: 바닥-넥라인)</td>
    </tr>
    <tr>
      <td><strong>대칭 삼각형</strong></td>
      <td>고점은 낮아지고 저점은 높아짐</td>
      <td>삼각형 수렴 끝자락에서 거래량 급감</td>
      <td>2/3 지점 돌파 방향으로 폭발적 시세 분출</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 패턴 목표가 및 3% 돌파 수식</h2>
<p>샤바커는 가짜 돌파(Fakeout)를 방지하기 위해 **3% 종가 이탈 수식**을 강조했습니다.</p>

<div class="formula-box">
  Breakout Confirmed = (Close_t > Neckline * 1.03) AND (TV_t > Average TV * 2.0)
</div>

<p>종가가 넥라인을 3% 이상 상향 돌파하고 당일 거래대금이 평균 대비 200% 이상을 기록할 때, 패턴 완성이 확정됩니다.</p>

<hr />

<h2>3. 프로 트레이더의 패턴 매매 실전 전략</h2>
<ol>
  <li><strong>이중바닥 넥라인 돌파:</strong> 두 번째 바닥을 형성하고 넥라인을 대량 거래대금으로 뚫어낼 때 1차 매수.</li>
  <li><strong>대칭 삼각형 2/3 지점 공략:</strong> 에너지 수렴 끝자락에서 상방 돌파 양봉 발생 시 진입.</li>
  <li><strong>풀백(Pullback) 재확인 매수:</strong> 뚫었던 넥라인까지 주가가 잠시 지지 테스트를 받을 때 2차 분할 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>넥라인 돌파 후 주가가 다시 넥라인 내부로 되돌아와 음봉 마감할 경우 패턴은 실패한 것입니다. 즉시 손절하여 손실을 최소화하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>돌파하려는 넥라인 가격대가 종가 기준으로 3% 이상 확정적으로 넘어섰는가?</li>
    <li>돌파 시 발생한 거래대금이 평소 평균 대비 2배 이상 폭발하였는가?</li>
    <li>목표가 대비 손절가 비율(Risk-Reward Ratio)이 최소 1:2 이상 보장되는가?</li>
  </ol>
</div>`
  },
  col_15: {
    title: "R.N. 엘리어트: 피보나치 수열 기반의 상승 5파/하락 3파 '엘리어트 파동 이론' 창시",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] R.N. 엘리어트와 피보나치 파동 수량화 리포트</h2>
<p>주식 시장은 프랙탈 구조와 피보나치 황금비(Golden Ratio)를 따릅니다. 1930년대 **랄프 넬슨 엘리어트(Ralph N. Elliott, 1871~1948)**는 주가가 **상승 5파와 하락 3파로 이루어진 거대한 파동의 사이클**을 반복함을 입증했습니다.</p>

<p>본 리포트에서는 엘리어트 파동의 절대 규칙과 피보나치 되돌림 비율을 통한 정량 타점을 해부합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>파동 단계</th>
      <th>파동 성격 및 수급 심리</th>
      <th>피보나치 비율 (Fibonacci Ratio)</th>
      <th>트레이더 대응 전략</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1파 (발동)</strong></td>
      <td>침체기를 뚫고 나오는 첫 반등</td>
      <td>기본 파동 형성</td>
      <td>관찰 및 2파 눌림목 대기</td>
    </tr>
    <tr>
      <td><strong>2파 (조정)</strong></td>
      <td>1파 상승분의 깊은 되돌림</td>
      <td>1파의 50.0% ~ 61.8% 되돌림</td>
      <td>1파 저점 손절잡고 황금 매수 타점</td>
    </tr>
    <tr>
      <td><strong>3파 (주도 폭발)</strong></td>
      <td>가장 길고 강력한 수급 폭발</td>
      <td>1파의 1.618배 ~ 2.618배 확장</td>
      <td>최대 비중 실어 대시세 누리기</td>
    </tr>
    <tr>
      <td><strong>4파 (복잡 조정)</strong></td>
      <td>3파의 과열을 식히는 횡보</td>
      <td>3파의 38.2% 되돌림</td>
      <td>1파 고점 미침범 확인 후 2차 매수</td>
    </tr>
    <tr>
      <td><strong>5파 (최종 과열)</strong></td>
      <td>개인의 FOMO로 쏘아올리는 불꽃</td>
      <td>1파 길이와 동등 (1.000배)</td>
      <td>다이버전스 확인 후 미련 없이 전량 익절</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 엘리어트 파동 3대 절대 불가침 규칙 및 수식</h2>
<p>카운팅 오류를 방지하기 위해 반드시 지켜야 하는 3가지 절대 법칙입니다.</p>

<div class="formula-box">
  Rule 1: Low(Wave 2) > Low(Wave 1) <br/>
  Rule 2: Length(Wave 3) != Min(Length(Wave 1, 3, 5)) <br/>
  Rule 3: Low(Wave 4) > High(Wave 1)
</div>

<p>이 3가지 법칙 중 단 하나라도 위배될 경우, 현재 진행 중인 파동 카운팅은 완전히 잘못된 것이므로 즉시 재설정해야 합니다.</p>

<hr />

<h2>3. 프로 트레이더의 엘리어트 파동 실전 전략</h2>
<ol>
  <li><strong>2파 피보나치 61.8% 매수:</strong> 1파 확인 후 2파 조정이 61.8% 지점에 도달할 때 손절가(1파 저점) 잡고 진입.</li>
  <li><strong>3파 폭발 구간 추세 보유:</strong> 3파가 진행되는 동안 3분봉/일봉 20선을 깨지 않는 한 끝까지 홀딩.</li>
  <li><strong>5파 고점 다이버전스 청산:</strong> 주가는 최고가를 치나 RSI/MACD 지표가 낮아질 때 전량 매도.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>2파 조정이 1파의 시작점 이하로 떨어지거나, 4파 조정이 1파의 고점을 침범할 경우 파동 정당성은 파괴됩니다. 즉시 손절 청산하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>현재 노리는 파동이 가장 길고 강력한 '3번 주도 폭발 파동' 구간인가?</li>
    <li>4번 조정 파동의 저점이 1번 파동의 고점을 침범하지 않았는가?</li>
    <li>피보나치 되돌림 비율(0.382 또는 0.618) 지점과 차트 지지선이 정교하게 일치하는가?</li>
  </ol>
</div>`
  },
  col_16: {
    title: "W.D. 개안: 시간과 가격의 수학적 대칭성, 개안 각도선(Gann Fan)과 마법의 1x1선",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] W.D. 개안: 시간과 가격의 기하학적 대칭성 해부</h2>
<p>1900년대 초반 월스트리트에서 50년간 승률 92%를 기록한 전설적 트레이더 **W.D. 개안(William D. Gann, 1878~1955)**은 차트 분석을 수학과 기하학, 그리고 시간 주기의 대칭 과학으로 승화시켰습니다.</p>

<p>개안은 **"시간(Time)과 가격(Price)이 일치할 때 거대한 시세 변곡점이 발생한다"**는 철학을 바탕으로 **개안 각도선(Gann Fan)**을 개발했습니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>개안 각도선 (Gann Angle)</th>
      <th>기하학적 기울기</th>
      <th>수학적 대칭 의미</th>
      <th>실전 적용 및 지지/저항</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1x1 선 (45도)</strong></td>
      <td>45° (기본축)</td>
      <td>1단위 시간 동안 1단위 가격 상승</td>
      <td>강세장/약세장을 가르는 절대 균형선</td>
    </tr>
    <tr>
      <td><strong>1x2 선 (26.25도)</strong></td>
      <td>26.25°</td>
      <td>2단위 시간에 1단위 가격 상승</td>
      <td>1x1 이탈 시 2차 강력 하방 지지선</td>
    </tr>
    <tr>
      <td><strong>2x1 선 (63.75도)</strong></td>
      <td>63.75°</td>
      <td>1단위 시간에 2단위 가격 상승</td>
      <td>극심한 과열 각도로 급격한 조정 임박 경고</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 시간-가격 Squaring 공식 및 주기 매커니즘</h2>
<p>개안의 가장 위대한 통찰인 **'Squaring Time and Price'** 수식입니다.</p>

<div class="formula-box">
  Gann Balance Point: Price = K * (Time Angle in Degrees)^2
</div>

<p>주요 저점 발생 후 30일, 60일, 90일, 180일, 360일이 경과하는 날짜에 가격이 개안 각도선 지지대에 도달하면 90% 이상의 확률로 거대한 방향 전환이 일어납니다.</p>

<hr />

<h2>3. 프로 트레이더의 개안 각도선 실전 전략</h2>
<ol>
  <li><strong>45도(1x1) 선 지지 매수:</strong> 주요 저점에서 45도 개안선을 긋고 주가가 1x1 선 위에서 우상향할 때 보유.</li>
  <li><strong>2x1 오버슈팅 익절:</strong> 주가가 급등하여 2x1 선(63.75도) 이상으로 치솟을 때 분할 매도.</li>
  <li><strong>시간 변곡일 매매:</strong> 저점 형성 후 30일/60일 마디 날짜에 맞추어 역발상 타점 잡기.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>주가가 1x1(45도) 선 아래로 종가 기준 음봉 이탈할 경우, 강세장 기조가 깨진 것입니다. 미련 없이 비중을 줄이십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>현재 주가가 45도(1x1) 개안 각도선 위에서 정석 지지를 받고 있는가?</li>
    <li>저점 형성 후 경과된 시간 주기가 개안의 마법 일수(30, 60, 90일)에 도달하였는가?</li>
    <li>가격 조정 시 다음 개안 각도선(1x2 등) 지지 가격대가 명확히 계산되는가?</li>
  </ol>
</div>`
  },
  col_17: {
    title: "J. 웨일즈 와일더: 현대 트레이딩 지표의 거장, RSI·ADX·ATR·Parabolic SAR 개발의 비밀",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] J. 웨일즈 와일더와 현대 4대 보조지표 정량 분석</h2>
<p>오늘날 모든 HTS/MTS 차트의 핵심 지표인 **RSI, ADX, ATR, Parabolic SAR**은 단 한 사람, 기계공학자 출신의 **J. 웨일즈 와일더(J. Welles Wilder Jr., 1935~2021)**가 고안해 낸 작품입니다.</p>

<p>본 리포트에서는 와일더 4대 지표의 수학적 수식과 지표 간의 시너지 조합법을 해부합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>보조지표</th>
      <th>수학적 산출 목적</th>
      <th>기준 수치 및 의미</th>
      <th>실전 매매 타점</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>RSI</strong></td>
      <td>매수/매도 상대적 모멘텀 강도</td>
      <td>70 이상(과매수), 30 이하(과매도)</td>
      <td>RSI 다이버전스 발생 시 최우선 추세 반전 매매</td>
    </tr>
    <tr>
      <td><strong>ADX</strong></td>
      <td>추세의 방향과 무관한 '추세의 힘'</td>
      <td>25 이상 (추세장), 20 이하 (박스권)</td>
      <td>ADX > 25 돌파 시 추세 추종 매매 전격 가동</td>
    </tr>
    <tr>
      <td><strong>ATR</strong></td>
      <td>갭을 포함한 진짜 일일 변동성 폭</td>
      <td>평균 진폭 가격 수치 (원)</td>
      <td>ATR * 2배를 트레일링 스탑 손절가로 활용</td>
    </tr>
    <tr>
      <td><strong>Parabolic SAR</strong></td>
      <td>가속도를 적용한 시세 반전 점 지표</td>
      <td>점 위치 (차트 위 = 매도, 차트 아래 = 매수)</td>
      <td>점의 위치 반전 시 기계적 포지션 스위칭</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. RSI 및 ATR 수학적 수식</h2>
<p>와일더가 집필한 14일 기준 RSI 산출 공식입니다.</p>

<div class="formula-box">
  RS = Average Gain / Average Loss &nbsp;&nbsp;|&nbsp;&nbsp; RSI = 100 - (100 / (1 + RS))
</div>

<p>또한 일일 진정한 변동성 폭인 **True Range(TR)** 공식은 다음과 같습니다.</p>

<div class="formula-box">
  TR = Max(High - Low, |High - Close_{prev}|, |Low - Close_{prev}|)
</div>

<hr />

<h2>3. 프로 트레이더의 와일더 지표 조합 실전 전략</h2>
<ol>
  <li><strong>ADX 판별 전략:</strong> ADX가 25 이상일 때는 RSI의 과매수를 무시하고 Parabolic SAR을 따라 추세 매매.</li>
  <li><strong>RSI 다이버전스 타점:</strong> 주가는 신저가이나 RSI 지표는 상승하는 강세 다이버전스 시 과감히 바닥 매수.</li>
  <li><strong>ATR 트레일링 스탑:</strong> 진입 후 주가 고점에서 (ATR $\times$ 2) 만큼 밀릴 경우 기계적 익절.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>ADX가 20 이하로 떨어진 박스권 시장에서 추세 추종 지표(Parabolic SAR)를 사용하면 가짜 신호(Whipsaw)로 계좌가 깎입니다. 시장 상태에 맞게 지표를 전환하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>ADX 지수가 25를 넘어서서 현재 시장이 명확한 추세장임을 증명하고 있는가?</li>
    <li>RSI 지표에서 주가 흐름과 반대로 움직이는 다이버전스 신호가 포착되었는가?</li>
    <li>ATR 지표를 활용하여 산출한 트레일링 스탑 손절가가 명확하게 설정되었는가?</li>
  </ol>
</div>`
  },
  col_18: {
    title: "제럴드 아펠: 이동평균선의 수렴과 확산을 이용한 'MACD' 지표 개발",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 제럴드 아펠과 MACD 지표 정량 해부</h2>
<p>전 세계 트레이더들이 가장 신뢰하는 추세 모멘텀 지표 **MACD(Moving Average Convergence Divergence)**는 1970년대 후반 뉴욕의 자산운용가 **제럴드 아펠(Gerald Appel)**에 의해 개발되었습니다.</p>

<p>아펠은 지수이동평균(EMA)의 수렴과 확산 속도를 시각화하여, 단순 이평선의 시차(Lagging) 한계를 완벽히 극복했습니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>MACD 구성 요소</th>
      <th>수학적 연산 구조</th>
      <th>시각적 표현</th>
      <th>실전 해석 및 타점</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>MACD 선 (Fast)</strong></td>
      <td>12일 EMA - 26일 EMA</td>
      <td>실선 그래프</td>
      <td>0선 돌파 시 대세 상승 전환 승인</td>
    </tr>
    <tr>
      <td><strong>시그널 선 (Signal)</strong></td>
      <td>MACD 선의 9일 EMA</td>
      <td>점선/평행선</td>
      <td>MACD와의 크로스 시 1차 매수/매도 신호</td>
    </tr>
    <tr>
      <td><strong>MACD 히스토그램</strong></td>
      <td>MACD 선 - 시그널 선</td>
      <td>막대그래프 (Oscillator)</td>
      <td>에너지의 확산(+) 및 축소(-) 직관적 판별</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. MACD 지수이동평균 연산 수식</h2>
<p>지수이동평균(EMA)을 기반으로 한 MACD 공식입니다.</p>

<div class="formula-box">
  MACD Line = EMA_{12}(Price) - EMA_{26}(Price) <br/>
  Signal Line = EMA_9(MACD Line) <br/>
  Histogram = MACD Line - Signal Line
</div>

<p>MACD 선이 0선 위로 올라선 상태에서 히스토그램 막대가 다시 양수로 가속될 때, 주도주의 2차 파동 승률은 80%를 돌파합니다.</p>

<hr />

<h2>3. 프로 트레이더의 MACD 3대 승률 타점</h2>
<ol>
  <li><strong>0선 위 첫 골든크로스:</strong> MACD가 0선 위 강세 영역에 안착한 후 시그널 선을 재차 뚫어내는 눌림목 매수.</li>
  <li><strong>히스토그램 반전 타점:</strong> 히스토그램 음수 막대가 줄어들며 첫 양수 막대로 전환되는 시점 1차 진입.</li>
  <li><strong>MACD 다이버전스:</strong> 주가 신저가 속 MACD 저점 상승 시 최고 승률의 반전 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>MACD 선이 0선 아래로 하향 이탈할 경우 주가는 장기 약세권에 진입합니다. 즉시 전량 손절하고 0선 재회복 전까지 매수를 금지하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>MACD 선이 플러스(+) 영역인 0선 위에서 우상향 추세를 유지하고 있는가?</li>
    <li>MACD 히스토그램 막대가 음수 감소 후 양수로 막 전환되는 가속 타이밍인가?</li>
    <li>주가의 고점/저점과 MACD 지표 간에 다이버전스 경고 신호가 없는가?</li>
  </ol>
</div>`
  },
  col_19: {
    title: "존 볼린저: 통계학 표준편차와 주가의 만남, '볼린저 밴드' 스퀴즈와 스파이크 타점 잡기",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 존 볼린저와 볼린저 밴드(Bollinger Bands) 정량 분석</h2>
<p>정규분포 곡선의 통계학 원리를 주식 차트에 결합한 지표가 바로 **존 볼린저(John A. Bollinger, 1950~)**의 **볼린저 밴드(Bollinger Bands)**입니다.</p>

<p>주가의 최근 변동성(Standard Deviation)에 따라 밴드 폭이 가변적으로 오므라들었다가 벌어지는 동적 구조를 지닙니다. 통계학적으로 주가가 밴드 안에서 움직일 확률은 **95.4%**입니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>볼린저 밴드 구성</th>
      <th>수학적 산출 수식</th>
      <th>통계학적 의미</th>
      <th>실전 트레이딩 적용</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>중앙선 (Middle)</strong></td>
      <td>20일 단순이동평균 (SMA)</td>
      <td>주가의 중심축 평균 단가</td>
      <td>눌림목 지지선 및 추세 기준선</td>
    </tr>
    <tr>
      <td><strong>상한선 (Upper)</strong></td>
      <td>SMA_20 + (2 * Standard Deviation)</td>
      <td>상방 95.4% 통계적 한계선</td>
      <td>스퀴즈 후 돌파 시 '밴드 워킹' 대시세 시작</td>
    </tr>
    <tr>
      <td><strong>하한선 (Lower)</strong></td>
      <td>SMA_20 - (2 * Standard Deviation)</td>
      <td>하방 95.4% 통계적 한계선</td>
      <td>침체권 아랫꼬리 반등 지지선</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 밴드위드(BandWidth) 및 %b 정량 수식</h2>
<p>존 볼린저가 제시한 변동성 응축 측정 수식인 **BandWidth**입니다.</p>

<div class="formula-box">
  BandWidth = ((Upper - Lower) / Middle) * 100 &nbsp;&nbsp;|&nbsp;&nbsp; %b = (Price - Lower) / (Upper - Lower)
</div>

<p>BandWidth 수치가 6개월 내 최저치로 오므라드는 **'스퀴즈(Squeeze)'** 현상 발생 후, %b가 1.0을 뚫고 올라가는 순간 거대한 시세 폭발이 일어납니다.</p>

<hr />

<h2>3. 프로 트레이더의 볼린저 밴드 실전 전략</h2>
<ol>
  <li><strong>스퀴즈 브레이크아웃:</strong> 밴드 폭이 극도로 좁아진 스퀴즈 상태에서 상한선을 대량 거래대금 양봉으로 뚫을 때 매수.</li>
  <li><strong>밴드 워킹 홀딩:</strong> 주도주가 밴드 상한선을 타고 우상향하는 'Band Walking' 동안은 20일선 이탈 전까지 기계적 보유.</li>
  <li><strong>%b 다이버전스 매도:</strong> 주가는 최고가를 치나 %b 지수 고점이 낮아질 때 과감히 이익 실현.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>상한선 돌파 후 주가가 20일 중앙선 아래로 종가 음봉 이탈할 경우, 시세 폭발 파동은 종료된 것입니다. 즉시 손절 프로토콜을 가동하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>BandWidth 지수가 최저 수준으로 응축된 완벽한 '스퀴즈' 상태를 거쳤는가?</li>
    <li>상한선 돌파 시 당일 거래대금이 평균 대비 최소 200% 이상 폭발하였는가?</li>
    <li>%b 지수가 1.0을 초과하며 주가가 밴드 외곽을 찢는 진성 오버슈팅인가?</li>
  </ol>
</div>`
  },
  col_20: {
    title: "조지 레인: 가격 속도의 변화를 읽는 '스토캐스틱(Stochastic Oscillator)' %K와 %D 매매법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Master Report] 조지 레인과 스토캐스틱(Stochastic Oscillator) 정량 분석</h2>
<p>주가가 고점에서 꺾이기 직전 가장 먼저 가격의 '속도(Velocity)'가 줄어드는 원리를 지표화한 인물이 전설적 트레이더 **조지 레인(George C. Lane, 1921~2004)**입니다.</p>

<p>스토캐스틱은 단순 가격이 아닌 **'가격 모멘텀의 위치와 속도'**를 측정하여 바닥과 천정을 선제 포착합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>스토캐스틱 요소</th>
      <th>수학적 공식 및 기간</th>
      <th>의미 및 지연 여부</th>
      <th>실전 적용 방법</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>%K (Fast)</strong></td>
      <td>((Close - Low_N) / (High_N - Low_N)) * 100</td>
      <td>최근 N일 가격 범위 내 현재 위치</td>
      <td>노이즈가 심하므로 단독 사용 자제</td>
    </tr>
    <tr>
      <td><strong>%D (Slow)</strong></td>
      <td>%K의 3일 단순 이동평균 (SMA)</td>
      <td>매매 신호 평탄화 지표</td>
      <td>%K와 %D의 크로스를 메인 타점으로 활용</td>
    </tr>
    <tr>
      <td><strong>Slow Stochastic</strong></td>
      <td>%K를 Slow %K(3일)로 재이동평균 연산</td>
      <td>노이즈 제거된 실전용 스토캐스틱</td>
      <td>(15, 5, 3) 또는 (5, 3, 3) 파라미터 적용</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 스토캐스틱 수식 및 과매수/과매도 수치</h2>
<p>조지 레인이 정립한 스토캐스틱 %K 공식입니다.</p>

<div class="formula-box">
  %K = ((Close - Lowest(Low, N)) / (Highest(High, N) - Lowest(Low, N))) * 100
</div>

<p>수치가 20 이하이면 과매도(Chamber of Bullish Reversal), 80 이상이면 과매수(Chamber of Bearish Reversal) 구간으로 판정합니다.</p>

<hr />

<h2>3. 프로 트레이더의 스토캐스틱 실전 전략</h2>
<ol>
  <li><strong>과매도 20 이하 골든크로스:</strong> Slow %K가 20 이하 침체권에서 %D를 위로 상향 돌파할 때 1차 매수.</li>
  <li><strong>스토캐스틱 다이버전스:</strong> 주가는 신저가이나 스토캐스틱 저점은 상승하는 최고 승률의 반전 매수.</li>
  <li><strong>쌍바닥(Double Bottom) 크로스:</strong> 20선 아래에서 스토캐스틱이 엉덩이를 높이는 W자 쌍바닥 형성 시 비중 확대.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>강력한 원웨이 추세장에서는 스토캐스틱이 80 이상 과매수권에서 둔화되는 속임수(Whipsaw)가 자주 발생합니다. 반드시 이동평균선 방향성을 최우선으로 확인하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>Slow Stochastic 지표가 20 이하 침체권에서 양봉과 함께 골든크로스를 냈는가?</li>
    <li>스토캐스틱 지표의 저점이 이전 저점보다 높아지는 '쌍바닥' 패턴인가?</li>
    <li>주가의 장기 이동평균선(20일/60일선)이 우상향하고 있어 추세와 부합하는가?</li>
  </ol>
</div>`
  },
  col_21: {
    title: "미국 증시(나스닥·S&P500) 야간 흐름이 다음 날 한국 증시 시가에 미치는 영향 및 시초가 대응법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Macro Report] 미 증시 야간 흐름과 한국 증시 시초가 상관관계 정량 분석</h2>
<p>한국 주식 시장은 전 세계에서 가장 높은 글로벌 유동성 개방도를 가집니다. 밤사이 미국 뉴욕 증시(NASDAQ, S&P 500, 필라델피아 반도체 지수)의 종가 및 야간 선물 지수는 **다음 날 아침 09:00 한국 증시의 시초가 갭(Gap)**을 결정짓는 절대적 요소입니다.</p>

<p>본 리포트에서는 미 증시 지수와 KOSPI/KOSDAQ 시초가 간의 Beta 및 상관계수를 분석하여 오버나이트 전략을 제시합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>미국 글로벌 지수</th>
      <th>한국 증시 직접 영향 섹터</th>
      <th>상관계수 (Correlation)</th>
      <th>시초가 대응 프로토콜</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SOX (필라델피아 반도체)</strong></td>
      <td>SK하이닉스, 삼성전자, 반도체 소부장</td>
      <td>r = 0.88 (매우 높음)</td>
      <td>SOX +2% 이상 시 한국 반도체 섹터 시초가 갭상승 타점</td>
    </tr>
    <tr>
      <td><strong>나스닥 100 (NDX)</strong></td>
      <td>KOSDAQ 성장주, 바이오, 플랫폼</td>
      <td>r = 0.81 (높음)</td>
      <td>빅테크 실적에 따른 KOSDAQ 시초가 갭 유동성 형성</td>
    </tr>
    <tr>
      <td><strong>US 10Y 국채 금리</strong></td>
      <td>원/달러 환율, 외국인 수급 패시브 자금</td>
      <td>역상관 (금리 급등 시 외국인 매도)</td>
      <td>국채 금리 폭등 시 시초가 갭하강 음봉 경계</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 시초가 갭 예산 수식 및 Beta 매커니즘</h2>
<p>미 증시 변동률 대비 한국 증시 시초가 갭 비율을 예측하는 **Beta 수식**입니다.</p>

<div class="formula-box">
  Expected KOSPI Open Gap (%) = Beta_{US} * US Index Change (%) + FX Change (%)
</div>

<p>미 필라델피아 반도체 지수가 +3% 폭등하더라도 원/달러 환율이 +15원 이상 급등하면, 외국인 환차손 매물로 인해 시초가 갭상승 후 장대음봉(Gap and Fade)이 발생할 위험이 커집니다.</p>

<hr />

<h2>3. 프로 트레이더의 야간 미 증시 연동 매매 전략</h2>
<ol>
  <li><strong>갭상승 동참 매매:</strong> 미 증시 호풍으로 시초가 +2%~+4% 갭상승 후 3분봉 첫 양봉 형성 시 주도주 동참.</li>
  <li><strong>갭하락 역발상 매매:</strong> 미 증시 일시적 악재로 -3% 이상과도한 갭하락 출현 시 외국인 저가 매수 수급 유입 타점.</li>
  <li><strong>서학개미 보유주 체크:</strong> 테슬라, 엔비디아 급등 시 국내 2차전지/반도체 밸류체인 커플링 대응.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>미 증시 폭등으로 한국 증시 시초가 갭이 +5% 이상 지나치게 높게 뜰 경우(Over-gapping), 장 초반 차익 실현 물량이 쏟아질 확률이 높습니다. 갭상승 지점에서의 뇌동매수를 자제하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>야간 미 증시 3대 지수 및 필라델피아 반도체 지수 마감 상승률을 확인하였는가?</li>
    <li>야간 원/달러 환율 및 미국 10년물 국채 금리 변동 추이가 안정을 유지하는가?</li>
    <li>시초가 갭상승률이 적정 범위(+1%~+3%) 내에서 형성되어 손익비가 보장되는가?</li>
  </ol>
</div>`
  },
  col_23: {
    title: "공매도 잔고와 대차잔고 추이로 파악하는 숏커버링 유망 섹터 정량 분석",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Supply-Demand Report] 공매도 및 대차잔고 분석을 통한 숏커버링(Short Covering) 수급 해부</h2>
<p>주식 시장에서 가장 폭발적인 짧은 시간 내 급등을 만들어내는 매커니즘 중 하나가 바로 **'숏커버링(Short Covering)'**과 **'숏스퀴즈(Short Squeeze)'**입니다. 기관 및 외국인 공매도 세력이 주가 상승 저항에 가로막혀, 손실을 제한하기 위해 장중 시장가로 주식을 되사들이는 강제 매수 파동입니다.</p>

<p>본 리포트에서는 대차잔고 수량과 공매도 잔고 비율을 통해 숏커버링 폭발 타점을 정량 계산합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>대차잔고 (Stock Borrowing)</th>
      <th>공매도 잔고 (Short Interest)</th>
      <th>숏커버링 / 숏스퀴즈 유발 조건</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>개념</strong></td>
      <td>공매도를 치기 위해 주식을 빌려둔 대기 수량</td>
      <td>실제 공매도를 집행하고 아직 갚지 않은 수량</td>
      <td>공매도 잔고 비중 > 5% 이상 누적 종목</td>
    </tr>
    <tr>
      <td><strong>수급 신호</strong></td>
      <td>대차잔고 감소 = 공매도 상환 신호</td>
      <td>공매도 잔고 급감 = 숏커버링 본격화</td>
      <td>주가 전고점 돌파 시 공매도 세력 손절매 발동</td>
    </tr>
    <tr>
      <td><strong>시세 파급력</strong></td>
      <td>잠재적 숏커버링 에너지 저장</td>
      <td>실질적인 주가 상향 매수 압력 전환</td>
      <td>단 2~3일 만에 +30%~+50% 폭발적 급등 분출</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. Days-to-Cover 및 숏스퀴즈 수식</h2>
<p>기관 공매도 세력이 포지션을 전량 상환하는 데 걸리는 일수를 나타내는 **Days-to-Cover** 공식입니다.</p>

<div class="formula-box">
  Days to Cover = Short Interest Volume / Average Daily Volume
</div>

<p>Days-to-Cover 수치가 5일 이상인 상태에서 종목에 호재 뉴스가 터져 거래대금이 실릴 경우, 공매도 세력의 손절매가 연쇄적으로 터지며 대규모 숏스퀴즈가 발생합니다.</p>

<hr />

<h2>3. 프로 트레이더의 숏커버링 매매 전략</h2>
<ol>
  <li><strong>공매도 잔고 상위 종목 스크리닝:</strong> 시가총액 대비 공매도 잔고 비율이 5% 이상인 종목 선별.</li>
  <li><strong>대차잔고 급감 및 주가 돌파 포착:</strong> 대차잔고 수량이 줄어들면서 일봉상 20일 이평선을 대량 거래대금으로 돌파할 때 매수.</li>
  <li><strong>연속 숏커버링 추세 보유:</strong> 외국인 기관의 양매수 유입과 함께 공매도 잔고 수량이 일평균 수십만 주씩 감소할 때 익절 타점 조절.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>공매도 잔고가 많은 종목은 기업의 재무구조나 실적 악재가 존재하는 경우가 많습니다. 숏커버링 파동이 일단 일단락되면 재차 밀려 내려갈 수 있으므로 정해진 이익 실현 목표가에서 전량 청산하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>타겟 종목의 공매도 잔고 수량이 최근 3일 연속 감소 추세로 전환되었는가?</li>
    <li>대차잔고 상환 수량이 새로 빌리는 대차 체결 수량을 압도하고 있는가?</li>
    <li>차트상 전고점 저항대를 대량 거래대금 양봉으로 돌파하며 공매도 손절을 유도하는가?</li>
  </ol>
</div>`
  },
  col_25: {
    title: "옵션만기일(네 마녀의 날) 변동성 생존 규칙과 메이저 포지션 정량 파악법",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Derivatives Report] 파생상품 만기일(Quadruple Witching Day) 메이저 기관 수급 분석</h2>
<p>3월, 6월, 9월, 12월 두 번째 목요일은 주가지수 선물·옵션, 개별주식 선물·옵션 4가지 파생상품의 만기가 겹치는 **'네 마녀의 날(Quadruple Witching Day)'**입니다. 매월 발생하는 미니 옵션만기일 역시 장 마감 직전 **동시호가 10분(15:20~15:30)** 동안 수천억 원의 금융투자 프로그래밍 매물이 쏟아져 주가를 극도로 흔듭니다.</p>

<p>본 리포트에서는 메이저 기관의 주식 선물/옵션 감마(Gamma) 포지션과 동시호가 프로그램 수급 매커니즘을 정밀 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>평상시 장 마감 수급</th>
      <th>옵션/선물 만기일 동시호가 수급</th>
      <th>트레이더 대응 전략</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>주요 주체</strong></td>
      <td>외국인/기관의 현물 순매수/순매도</td>
      <td>금융투자 차익거래 및 메이저 옵션 포지션 헤지</td>
      <td>만기일 14:30 이후 신규 매수 금지</td>
    </tr>
    <tr>
      <td><strong>변동성 폭</strong></td>
      <td>동시호가 변동률 +-0.3% 이내</td>
      <td>동시호가 단 10분 만에 +-2%~+-5% 폭등락</td>
      <td>풋/콜 옵션 행사가격대 벽 형성 확인</td>
    </tr>
    <tr>
      <td><strong>프로그램 수급</strong></td>
      <td>비차익 순매수 중심</td>
      <td>베이시스(Basis)에 연동된 차익 프로그램 매물 쏟아짐</td>
      <td>선물-현물 베이시스 콘탱고/백워데이션 체크</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 선물-현물 베이시스(Basis) 및 차익거래 수식</h2>
<p>금융투자 차익거래 물량의 유입 방향을 결정하는 **선물 베이시스(Basis)** 산출 수식입니다.</p>

<div class="formula-box">
  Market Basis = Futures Price - Spot Index (KOSPI 200)
</div>

<p>Basis가 플러스(+)인 콘탱고(Contango) 상태에서는 주식을 사고 선물을 파는 차익 매수세가 유입되나, 마이너스(-)인 백워데이션(Backwardation)으로 전환되면 동시호가에 수천억 원의 주식 매도 폭탄이 쏟아집니다.</p>

<hr />

<h2>3. 프로 트레이더의 만기일 변동성 대응 전략</h2>
<ol>
  <li><strong>15:00 이전 현금화 프로토콜:</strong> 만기일 당일 15:00 이전에 단기 트레이딩 종목은 전량 정리하여 변동성 위험 제거.</li>
  <li><strong>옵션 행사가격대 벽(Max Pain) 파악:</strong> 메이저 기관이 최대 이익을 얻는 코스피 200 지수 행사가격대 추정.</li>
  <li><strong>동시호가 급락주 저가 매수:</strong> 만기일 동시호가 왜곡으로 수급 악재 없이 -4% 이상 왜곡 급락한 주도주를 종가 매수하여 다음 날 시초가 차익 실현.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>옵션만기일 당일에는 아무리 좋은 개별 호재 재료가 존재하더라도, 파생상품 포지션 매물에 의해 주가가 왜곡될 수 있습니다. 만기일 당일 신규 비중 확대는 철저히 자제하십시오.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>오늘이 선물·옵션 만기일(또는 미니 만기일)인지 파생 달력을 확인하였는가?</li>
    <li>선물-현물 베이시스가 콘탱고 상태를 유지하며 차익 매수 우위를 보이고 있는가?</li>
    <li>장 마감 동시호가(15:20~15:30) 파생 프로그램 출회 수량을 체크할 준비가 되었는가?</li>
  </ol>
</div>`
  },
  col_26: {
    title: "신고가 돌파 후 첫 눌림목 매수 전략: 성공률 90% 거래 타점 공식과 피보나치 비율",
    author: "K-STOCK 수석 에디터",
    content: `<h2>[K-STOCK Strategy Report] 52주 신고가 돌파 후 첫 눌림목(First Pullback) 매수 공식</h2>
<p>주식 시장에서 가장 기대 수익률이 높고 손익비가 뛰어난 타점은 바로 **'52주 신고가를 대량 거래대금으로 돌파한 주도주의 첫 번째 눌림목'**입니다. 신고가를 뚫어낸 종목은 상방에 매물 저항대가 존재하지 않는 '무중력 공간'에 진입하게 되며, 첫 눌림목은 대기 수급이 가장 강하게 분출되는 기회의 장입니다.</p>

<p>본 리포트에서는 신고가 첫 눌림목의 성공률 90%를 완성하는 정량적 피보나치 타점과 거래대금 감량 규칙을 분석합니다.</p>

<hr />

<h2>1. 핵심 요약 (Key Summary Table)</h2>
<table>
  <thead>
    <tr>
      <th>구분</th>
      <th>신고가 돌파 파동 (1차 파동)</th>
      <th>첫 눌림목 조정 구간 (First Pullback)</th>
      <th>2차 폭발 재반등 파동</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>거래대금 조건</strong></td>
      <td>사상 최대 거래대금 폭발 (수천억 원)</td>
      <td>1차 파동 거래대금 대비 70% 이상 급감</td>
      <td>2차 상승과 함께 거래대금 재차 증가</td>
    </tr>
    <tr>
      <td><strong>이동평균선/피보나치</strong></td>
      <td>이평선 정배열 급격한 확산</td>
      <td>5일선/10일선/20일선 및 피보나치 38.2% 지지</td>
      <td>지급선 지지 후 첫 양봉 캔들 출현</td>
    </tr>
    <tr>
      <td><strong>수급 주체</strong></td>
      <td>외국인/기관 메이저 수급 대량 매집</td>
      <td>개인 손절 물량 소화 및 메이저 수급 유지</td>
      <td>외국인/기관 재차 동반 순매수 분출</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>2. 신고가 눌림목 거래대금 감량 수식</h2>
<p>진성 눌림목과 가짜 하락을 구별하는 **거래대금 감량 비율(Volume Reduction Ratio)** 공식입니다.</p>

<div class="formula-box">
  VRR (%) = (TV_{pullback} / TV_{breakout}) * 100
</div>

<p>신고가 돌파 당일 거래대금 대비 조정일의 거래대금 VRR 비율이 30% 이하로 바싹 마르면서 10일선 또는 20일선 지지를 받을 때, 첫 눌림목 성공률은 90%에 달합니다.</p>

<hr />

<h2>3. 프로 트레이더의 신고가 첫 눌림목 매수 공식</h2>
<ol>
  <li><strong>신고가 돌파 확인:</strong> 52주 신고가를 2,000억 원 이상 거래대금 장대양봉으로 돌파하는 종목 포착.</li>
  <li><strong>눌림목 대기:</strong> 돌파 후 2~4일간 거래대금이 급감하며 5일선 또는 10일선까지 차분히 밀려 내려올 때 대기.</li>
  <li><strong>첫 양봉 타점 매수:</strong> 조정 지지선에서 아랫꼬리를 달고 첫 양봉 캔들이 완성되는 종가에 50% 진입, 다음 날 시가 추가 매수.</li>
</ol>

<hr />

<h2>4. 리스크 관리 프로토콜</h2>
<p>눌림목 조정 시 거래대금이 줄어들지 않고 장대음봉으로 20일 이동평균선을 하향 이탈할 경우, 이는 신고가 트랩(Trap)입니다. 즉시 손절매하여 자금을 지켜야 합니다.</p>

<div class="checklist-box">
  <h3>실전 매매 전 3가지 체크리스트</h3>
  <ol>
    <li>1차 돌파 시 발생한 거래대금이 52주 사상 최대 수준(최소 1,500억 이상)이었는가?</li>
    <li>눌림목 조정 일수가 3~5일 이내이며 거래대금이 70% 이상 가파르게 줄어들었는가?</li>
    <li>피보나치 38.2% 지점 또는 10일/20일 이동평균선에서 아랫꼬리 지지가 확인되었는가?</li>
  </ol>
</div>`
  }
};

async function upgradeAllPosts() {
  console.log('--- Starting All Posts Upgrade Script ---');
  
  // Read current posts.json
  const rawPosts = fs.readFileSync(postsPath, 'utf8');
  const postsList = JSON.parse(rawPosts);

  let updatedCount = 0;

  postsList.forEach(post => {
    const upgradedData = upgradedPostsData[post.id];
    if (upgradedData) {
      // PRESERVE EXISTING VIEWS!
      const originalViews = post.views;
      
      post.title = upgradedData.title;
      post.content = upgradedData.content;
      post.views = originalViews; // Strictly enforce existing views integer!

      updatedCount++;
      console.log(`[UPGRADED] ${post.id} | Views Preserved: ${originalViews} | Title: ${post.title.substring(0, 35)}...`);
    } else {
      console.warn(`[WARNING] No upgraded data found for ${post.id}`);
    }
  });

  // Write back to data/content/posts.json
  fs.writeFileSync(postsPath, JSON.stringify(postsList, null, 2), 'utf8');
  console.log(`Saved ${updatedCount} upgraded posts to data/content/posts.json.`);

  // Sync with Supabase if credentials exist
  if (url && key) {
    console.log('Connecting to Supabase to sync upgraded posts...');
    const supabase = createClient(url, key);

    for (const post of postsList) {
      const numId = parseInt(post.id.replace('col_', ''));
      if (isNaN(numId)) continue;

      const { error: upsertErr } = await supabase.from('posts').upsert({
        id: numId,
        title: post.title,
        content: post.content,
        is_published: post.is_published,
        published_at: post.published_at
      }, { onConflict: 'id' });

      if (upsertErr) {
        console.error(`Supabase sync error for ${post.id}:`, upsertErr.message);
      } else {
        console.log(`Supabase synced ${post.id}`);
      }
    }
  }

  console.log('--- ALL POSTS UPGRADE & VIEWS PRESERVATION COMPLETED ---');
}

upgradeAllPosts();
