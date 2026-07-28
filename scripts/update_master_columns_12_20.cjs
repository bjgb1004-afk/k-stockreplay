const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables if present
const url = process.env.SUPABASE_URL || 'https://xfrfxrbxlkuxldmaeobr.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const masterPosts = [
  {
    id: "col_12",
    title: "무네히사 혼마: 세계 최초 캔들차트 및 사카타 오법(酒田五法) 개발과 현대 트레이딩 적용",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["혼마무네히사", "캔들차트", "사카타오법", "기술적분석", "캔들패턴"],
    slug: "munehisa-homma-candlestick-chart-sakata-gohou",
    createdAt: "2026-07-21T10:00:00+00:00",
    published_at: "2026-07-21T10:00:00+00:00",
    is_published: true,
    views: 412,
    content: `<h2>[전설의 트레이더 Insight] 무네히사 혼마와 캔들차트: 250년 역사의 사카타 오법(酒田五法) 분석</h2>

<p>오늘날 전 세계 모든 주식 시장의 모니터 위에 오르내리는 '양봉과 음봉', 즉 캔들차트(Candlestick Chart)는 어디서 시작되었을까요? 미국 월스트리트가 생기기도 훨씬 전인 18세기 일본 에도 시대, 오사카 도지마 쌀 시장을 호령했던 거상 <strong>무네히사 혼마(本間宗久, 1724~1803)</strong>가 세계 최초로 창안한 위대한 유산입니다.</p>

<p>당시 쌀 시장은 세계 최초의 미래 선물 거래소 형식을 띠고 있었습니다. 혼마는 단순한 쌀 수급뿐만 아니라 <strong>'인간 심리의 격동과 자본의 쏠림'</strong>이 가격을 결정한다는 본질을 간파하고, 시가·고가·저가·종가를 하나의 초촛불(Candle) 형상으로 시각화했습니다. 그가 정립한 <strong>사카타 오법(酒田五法)</strong>은 250년이 지난 오늘날 코스피·코스닥 시장에서도 완벽하게 작동하는 승률 높은 주도주 분석 틀입니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 시장 심리를 시각화한 캔들차트의 본질</h3>

<p>캔들차트가 종면 차트(선 차트)나 서양의 바 차트보다 압도적으로 우수한 이유는 단 하나의 봉 안에 <strong>'매수 세력(Bull)과 매도 세력(Bear)의 하루 종일 벌인 치열한 전투 과정'</strong>이 함축되어 있기 때문입니다.</p>

<ul>
    <li><strong>몸통(Real Body):</strong> 시가와 종가 사이의 실질적 승패 결과입니다. 붉은색 양봉은 매수 세력의 완전 승리, 푸른색 음봉은 매도 세력의 승리를 의미합니다.</li>
    <li><strong>윗꼬리(Upper Shadow):</strong> 장중 고점까지 진격했으나 매도 압력에 밀려 후퇴한 '상방 저항'의 흔적입니다.</li>
    <li><strong>아랫꼬리(Lower Shadow):</strong> 장중 폭락했으나 밑바닥에서 대량 저가 매수세가 유입되어 가격을 끌어올린 '하방 지지'의 흔적입니다.</li>
</ul>

<p>혼마는 매일 상인들을 고용해 에도에서 오사카까지 수십 킬로미터마다 깃발을 흔드는 신호망을 구축하여 쌀값을 실시간 수집했습니다. 정보의 속도와 캔들차트라는 분석 무기가 결합한 결과, 그는 100승 무패에 가까운 전설적인 부를 축적했습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 현대 주식 트레이딩을 지배하는 '사카타 오법(酒田五法)' 핵심 분석</h3>

<p>사카타 오법은 혼마가 고향 사카타(酒田)의 지명을 따서 만든 5가지 차트 패턴 형성 원리입니다. 현대 주도주 눌림목 및 돌파 매매 시 반드시 체크해야 할 5대 원칙입니다.</p>

<ol>
    <li><strong>삼산 (三山 - Three Mountains):</strong> 주가가 세 번 고점을 형성하고 넘지 못하는 형상으로, 현대의 '헤드앤숄더(Head & Shoulders)' 또는 '삼중 고점'에 해당합니다. 강력한 대세 하락 전환 신호입니다.</li>
    <li><strong>삼천 (三川 - Three Rivers):</strong> 바닥권에서 세 번 저점을 확인하는 형상으로, '역헤드앤숄더' 또는 '삼중 바닥'입니다. 장기 침체를 끝내고 수급이 들어오는 대세 상승 신호입니다.</li>
    <li><strong>삼공 (三空 - Three Gaps):</strong> 주가가 갭(Gap)을 세 번 연속 형성하며 폭등 또는 폭락하는 현상입니다. '삼공 매도'는 과열의 극치에서 과감히 이익을 실현하고 역발상 쇼트 타점을 잡는 핵심입니다.</li>
    <li><strong>삼병 (三兵 - Three Soldiers):</strong> 바닥권에서 3일 연속 양봉이 출현하는 '적삼병(赤三兵)'은 주도주의 강력한 출발을 고합니다. 반대로 고점권에서 3일 연속 음봉이 떨어지는 '흑삼병(黑三兵)'은 투매의 시발점입니다.</li>
    <li><strong>삼법 (三法 - Three Methods):</strong> 상승 중 쉬어가는 3일 간의 건전한 음봉 조정(쉬어가는 도지/소음봉) 후 다시 대량 양봉으로 뚫어내는 '상승 삼법'입니다. 주도주 매매 시 가장 안전한 2차 눌림목 매수 타점입니다.</li>
</ol>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>3. K-STOCK 실전 적용: 캔들 조합과 대량 거래대금의 접목</h3>

<p>현대 트레이더가 혼마 무네히사의 캔들 분석법을 적용할 때 범하기 쉬운 오류는 '거래량 없는 캔들'에 속는 것입니다. 혼마의 쌀 거래소 역시 거래량이 실리지 않은 가격 조작은 금방 무너졌습니다.</p>

<blockquote style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-style: italic;">
"바닥권에서 발생한 장대양봉이 수천억 원의 거래대금을 동반하고 적삼병 형태를 띨 때, 이는 개인이 아닌 메이저 기관과 외국인의 주도주 매집 확정 신호이다."
</blockquote>

<p>결론적으로 무네히사 혼마의 가르침은 250년 전이나 지금이나 동일합니다. 차트 위의 양봉과 음봉을 단순한 기호로 보지 않고, 그 뒤에 숨겨진 인간의 '탐욕과 공포'의 밸런스를 읽어내는 자만이 주식 시장에서 영속적인 수익을 쟁취할 수 있습니다.</p>`
  },
  {
    id: "col_13",
    title: "찰스 다우: 다우존스 지수 창시와 현대 주식 시장 분석의 뿌리 '다우 이론' 6대 원칙",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["찰스다우", "다우이론", "기술적분석", "추세분석", "월스트리트"],
    slug: "charles-dow-dow-jones-index-dow-theory",
    createdAt: "2026-07-22T10:00:00+00:00",
    published_at: "2026-07-22T10:00:00+00:00",
    is_published: true,
    views: 388,
    content: `<h2>[기술적 분석의 뼈대] 찰스 다우와 다우 이론(Dow Theory) 6대 원칙</h2>

<p>월스트리트저널(WSJ)의 창립자이자 다우존스 산업평균지수(Dow Jones Industrial Average)의 아버지인 <strong>찰스 다우(Charles Dow, 1851~1902)</strong>는 현대 주식 시장 분석의 모든 기초를 쌓아 올린 위대한 사상가입니다.</p>

<p>그가 집필한 사설을 바탕으로 후대 학자들이 정리한 <strong>'다우 이론(Dow Theory)'</strong>은 추세(Trend)를 정의하고 자금의 흐름을 읽는 모든 기술적 분석의 헌법과 같습니다. 오늘날 알고리즘과 AI가 주도하는 한국 증시에서도 다우 이론의 추세 지속성과 전환 규칙은 여전히 정교하게 작동합니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 다우 이론을 관통하는 6대 핵심 원칙</h3>

<ol>
    <li><strong>평균 지수는 모든 요소를 반영한다 (The Averages Discount Everything):</strong> 금리, 기업 실적, 전쟁, 기후, 심지어 미래의 공포와 희망까지 시장의 모든 정보는 이미 주가지수(Price Action)에 실시간으로 반영되어 있습니다. 뉴스보다 차트가 빠른 이유입니다.</li>
    <li><strong>시장의 3가지 추세 (Three Trends):</strong> 주식 시장의 움직임은 **주 추세(Primary Trend, 1년 이상)**, **중기 추세(Secondary Trend, 3주~3개월)**, **소 추세(Minor Trend, 3주 미만)**로 나뉩니다. 트레이더는 소 추세의 소음에 흔들리지 말고 주 추세의 방향을 타야 합니다.</li>
    <li><strong>주 추세의 3단계 진행 과정 (Three Phases):</strong>
        <ul>
            <li><strong>1단계 매집 국면 (Accumulation Phase):</strong> 악재가 넘쳐나고 개인들이 투매할 때 스마트 머니가 조용히 저가 매집하는 단계입니다.</li>
            <li><strong>2단계 대중 참여 국면 (Public Participation Phase):</strong> 호재가 터지고 이익이 개선되며 기술적 분석가와 일반 투자자가 대거 유입되어 급등하는 국면입니다.</li>
            <li><strong>3단계 분산/분배 국면 (Distribution Phase):</strong> 대중이 환호에 젖어 시장에 뛰어들 때, 1단계에서 매집했던 스마트 머니가 물량을 넘기고 이익을 실현하는 단계입니다.</li>
        </ul>
    </li>
    <li><strong>상호 확인의 원칙 (Confirmation Principle):</strong> 다우 산업지수와 운송지수(한국의 경우 코스피와 코스닥, 혹은 반도체 지수와 운송/화물 수급)가 동시에 신고가를 갱신해야 진정한 상승 추세로 승인됩니다.</li>
    <li><strong>거래량은 추세를 확인해준다 (Volume Confirms the Trend):</strong> 주 추세 방향으로 주가가 움직일 때는 거래량이 증가하고, 반대 방향(조정)으로 움직일 때는 거래량이 감소해야 건전한 추세입니다.</li>
    <li><strong>명확한 반전 신호가 나올 때까지 추세는 유효하다 (Trends Persist Until Reversal):</strong> 고점과 저점이 계속해서 높아지는 한(Higher Highs & Higher Lows) 상승 추세는 유지되며, 함부로 고점을 단정하고 쇼트 치거나 조기 매도해서는 안 됩니다.</li>
</ol>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. K-STOCK 트레이더를 위한 다우 이론 실전 응용</h3>

<p>다우 이론의 가장 위대한 가치는 **"추세의 전환(Reversal)"을 판단하는 수리적 기준**을 제공한다는 점입니다.</p>

<p>상승 추세가 무너지는 순간은 이전의 **저점(Higher Low)을 깨고 내려가는 음봉이 발생할 때**입니다. 반대로 하락 추세가 상승 추세로 반전하는 순간은 **전고점(Lower High)을 대량 거래대금으로 뚫어내는 파동**이 출현할 때입니다.</p>

<blockquote style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;">
"시장의 잔파도(소 추세)에 시선을 빼앗기지 마라. 매집-대중참여-분산의 3단계를 구별하고, 거대한 주 추세의 물결에 몸을 실을 때 비로소 압도적인 계좌 성장이 이루어진다."
</blockquote>

<p>찰스 다우가 남긴 6대 원칙을 트레이딩 룸의 기준표로 삼는다면, 시장의 온갖 가짜 뉴스나 단기 소음에 뇌동매수하는 우를 범하지 않고 냉철한 주도주 승자 트레이더로 살아남을 수 있습니다.</p>`
  },
  {
    id: "col_14",
    title: "리처드 샤바커: 차트 패턴 분석의 아버지, 헤드앤숄더와 대칭 삼각형의 발견",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["리처드샤바커", "차트패턴", "헤드앤숄더", "이중바닥", "기술적분석"],
    slug: "richard-schabacker-chart-pattern-head-and-shoulders",
    createdAt: "2026-07-23T10:00:00+00:00",
    published_at: "2026-07-23T10:00:00+00:00",
    is_published: true,
    views: 360,
    content: `<h2>[패턴 분석의 정수] 리처드 샤바커: 차트 패턴 분석의 체계화와 실전 전략</h2>

<p>헤드앤숄더(Head & Shoulders), 이중바닥(Double Bottom), 대칭 삼각형(Symmetrical Triangle)... 오늘날 주식 트레이더들이 일상적으로 사용하는 차트 패턴의 대부분은 1930년대 포브스(Forbes) 금융 에디터였던 <strong>리처드 샤바커(Richard W. Schabacker)</strong>에 의해 최초로 분류되고 체계화되었습니다.</p>

<p>샤바커는 차트에 나타나는 특정 기하학적 형태가 단순한 무작위 곡선이 아니라, <strong>'지주 세력과 대중 간의 지지와 저항 싸움 결과물'</strong>임을 밝혀냈습니다. 그의 저서 『Technical Analysis and Stock Market Profits』는 패턴 매매의 성경으로 추앙받고 있습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 샤바커가 정리한 3대 대표 차트 패턴 분석</h3>

<h4>① 헤드앤숄더 (Head & Shoulders Top Pattern)</h4>
<p>가장 강력한 천정 완성 패턴입니다. 왼쪽 어깨(Left Shoulder), 머리(Head), 오른쪽 어깨(Right Shoulder) 순으로 고점을 형성하며, 두 골짜기를 연결한 **넥라인(Neckline)**이 하방 돌파될 때 대세 하락이 확정됩니다.</p>
<ul>
    <li><strong>핵심 거래량 특징:</strong> 머리를 형성할 때보다 오른쪽 어깨를 만들 때 거래량이 현저히 줄어듭니다. 매수 수급의 고갈을 상징합니다.</li>
    <li><strong>목표가 계산:</strong> 머리 정상에서 넥라인까지의 수직 거리가, 넥라인 이탈 지점부터 아래로 하락 목표치가 됩니다.</li>
</ul>

<h4>② 이중바닥 / W바닥 (Double Bottom Pattern)</h4>
<p>첫 번째 저점 부근까지 주가가 밀렸으나, 강력한 저가 매수세가 들어오며 동일 구간에서 바닥을 2번 다지고 중간 고점(Neckline)을 거래량과 함께 돌파하는 강력한 추세 반전 패턴입니다.</p>

<h4>③ 대칭 삼각형 패턴 (Symmetrical Triangle)</h4>
<p>고점은 낮아지고 저점은 높아지며 에너지(변동성)가 극도로 수렴하는 구간입니다. 삼각형의 2/3 지점에서 위든 아래든 대량 거래대금을 터트리는 방향으로 수십 퍼센트의 폭발적 시세가 분출됩니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 샤바커의 패턴 매매 시 필수 주의사항: '가짜 돌파(Fakeout)' 예방 원칙</h3>

<p>샤바커는 교과서적인 패턴 모양만 믿고 성급하게 진입하는 트레이더들에게 3가지 엄격한 검증 가이드라인을 강조했습니다.</p>

<ol>
    <li><strong>넥라인 이탈의 확증 (3% 법칙):</strong> 단순 장중 꼬리가 아니라, 종가 기준으로 넥라인을 3% 이상 확실히 이탈하거나 돌파해야 진정한 패턴 완성입니다.</li>
    <li><strong>거래량 수반 필수:</strong> 바닥권 패턴 돌파 시 이전 평균 거래량의 최소 150~200% 이상 대량 거래대금이 터져야 세력의 진성 매수입니다.</li>
    <li><strong>돌파 후 풀백(Pullback) 재확인:</strong> 뚫었던 넥라인까지 주가가 잠시 눌려줄 때 지지 여부를 확인하고 진입하는 것이 리스크 관리 측면에서 가장 안전합니다.</li>
</ol>

<blockquote style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0;">
"차트 패턴은 미래를 예언하는 마법의 구슬이 아니다. 확률상 압도적인 우위를 제공하는 거래 구조일 뿐이므로, 패턴 실패 시 목숨처럼 손절 라인을 지켜야 한다."
</blockquote>

<p>리처드 샤바커의 가르침을 따라 차트 속 거대한 세력의 지지와 저항 패턴을 명확히 판독한다면, 손익비가 극대화되는 황금 타점만을 골라 매매하는 기쁨을 누릴 수 있습니다.</p>`
  },
  {
    id: "col_15",
    title: "R.N. 엘리어트: 피보나치 수열 기반의 상승 5파/하락 3파 '엘리어트 파동 이론' 창시",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["엘리어트", "파동이론", "피보나치", "상승5파", "하락3파"],
    slug: "rn-elliott-wave-theory-fibonacci",
    createdAt: "2026-07-24T10:00:00+00:00",
    published_at: "2026-07-24T10:00:00+00:00",
    is_published: true,
    views: 425,
    content: `<h2>[자연의 법칙과 주식 시장] R.N. 엘리어트와 엘리어트 파동 이론(Elliott Wave Theory)</h2>

<p>주식 시장은 과연 인간의 제어 범위를 벗어난 혼돈(Chaos)일까요, 아니면 일정한 신비로운 기하학적 질서를 따르고 있을까요? 1930년대 <strong>랄프 넬슨 엘리어트(Ralph Nelson Elliott, 1871~1948)</strong>는 중병을 앓는 동안 75년 분량의 미국 주식 차트를 수작업으로 분석한 끝에, 주가는 **상승 5파와 하락 3파로 이루어진 거대한 파동의 사이클**을 반복한다는 사실을 발견했습니다.</p>

<p>특히 이 파동의 수직·수평 비율이 자연계의 프랙탈 구조이자 수학적 황금비인 **피보나치 수열(Fibonacci Sequence)**과 완벽히 일치한다는 엘리어트의 발견은 금융 역사상 가장 파격적인 통찰로 평가받고 있습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 엘리어트 파동 이론의 기본 구조: 상승 5파 + 하락 3파</h3>

<p>하나의 거대한 주기(Cycle)는 시장을 주도하는 5개의 추진 파동(Impulse Waves)과 이를 되돌리는 3개의 수정 파동(Corrective Waves)으로 구성됩니다.</p>

<ul>
    <li><strong>1파 (발동 파동):</strong> 악재 속에서 침체기를 뚫고 나오는 첫 번째 상승 파동. 대중은 여전히 의심합니다.</li>
    <li><strong>2파 (조정 파동):</strong> 1파 상승분의 50%~61.8%를 거칠게 되돌리는 눌림목 파동. 그러나 1파의 시작점을 침범하지 않습니다.</li>
    <li><strong>3파 (주도 폭발 파동):</strong> 가장 길고 강력하며 무서운 수급이 집중되는 핵심 파동. 거래대금이 사상 최대치를 경신합니다.</li>
    <li><strong>4파 (복잡 조정 파동):</strong> 3파의 과열을 식히는 박스권 또는 삼각형 형태의 얕은 조정 파동. 1파의 고점을 침범하지 않습니다.</li>
    <li><strong>5파 (최종 과열 파동):</strong> 실적보다 개인의 탐욕과 FOMO(소외 공포)에 의해 쏘아 올리는 마지막 불꽃 파동. 다이버전스가 발생합니다.</li>
    <li><strong>A-B-C 파동 (하락 조정):</strong> 5파의 피날레 이후 시장을 참혹하게 되돌리는 하락 3파 구간입니다.</li>
</ul>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 결코 침범할 수 없는 엘리어트 파동의 3대 절대 불가침 법칙</h3>

<p>엘리어트 파동 이론을 실전에 적용할 때 파동 카운팅 오류를 방지하기 위해 반드시 지켜야 하는 3가지 절대 규칙(Absolute Rules)이 있습니다.</p>

<ol>
    <li><strong>규칙 1:</strong> 2번 파동은 절대로 1번 파동의 시작점 밑으로 내려갈 수 없다. (만약 깨진다면 그것은 1파가 아니었음)</li>
    <li><strong>규칙 2:</strong> 1, 3, 5번 상승 파동 중에서 3번 파동이 가장 짧은 파동일 수 없다. (대개 3파가 가장 길고 강력함)</li>
    <li><strong>규칙 3:</strong> 4번 파동의 저점은 절대로 1번 파동의 고점 가격과 겹칠 수 없다. (상승 구도가 훼손되지 않아야 함)</li>
</ol>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>3. 피보나치 되돌림 비율(0.382 / 0.500 / 0.618)과 실전 트레이딩 타점</h3>

<p>엘리어트 파동 이론의 진가는 피보나치 비율을 결합할 때 발휘됩니다. 3파 폭발 후 4파 조정이 들어올 때 **3파 전체 상승폭의 38.2%(0.382) 또는 50.0%(0.500)** 지점에서 강력한 반등 지지선이 형성됩니다.</p>

<blockquote style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 12px 16px; margin: 16px 0;">
"주식 시장의 모든 파동은 인간 군중의 심리가 만들어내는 거대한 해일이다. 가장 강력한 3파 구간에 탑승하고, 과열된 5파 끝자락에서 미련 없이 빠져 나오는 것이 엘리어트 파동의 진정한 지혜이다."
</blockquote>

<p>파동의 마디를 정확히 이해하고 피보나치 비율의 지지대를 포착하는 훈련을 반복한다면, 시장의 대세 상승주가 어느 위치에 서 있는지 숲과 나무를 동시에 보는 차원 다른 안목을 갖추게 될 것입니다.</p>`
  },
  {
    id: "col_16",
    title: "W.D. 개안: 시간과 가격의 수학적 대칭성, 개안 각도선(Gann Fan)과 마법의 1x1선",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["WD개안", "개안각도선", "시간가격대칭", "기하학분석", "GannFan"],
    slug: "wd-gann-angle-fan-time-price-geometry",
    createdAt: "2026-07-25T10:00:00+00:00",
    published_at: "2026-07-25T10:00:00+00:00",
    is_published: true,
    views: 395,
    content: `<h2>[월가의 신비한 연금술사] W.D. 개안과 시간-가격의 기하학적 대칭성</h2>

<p>1900년대 초반 월스트리트에서 50년 동안 5천만 달러(현재 가치 수조 원) 이상의 거액을 벌어들이며 승률 92%를 기록한 전설적인 트레이더 <strong>윌리엄 델버트 개안(William Delbert Gann, 1878~1955)</strong>은 차트 분석을 단순한 주가 추적이 아닌 **수학, 기하학, 그리고 시간 주기(Time Cycles)의 대칭 과학**으로 승화시켰습니다.</p>

<p>개안은 **"시간(Time)과 가격(Price)이 일치할 때(Squaring Time and Price) 비로소 거대한 시세 변곡점이 발생한다"**는 철학을 바탕으로 **개안 각도선(Gann Fan)**과 **개안 휠(Gann Wheel)**을 개발했습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 개안 각도선(Gann Fan)의 핵심: 45도 1x1 선의 비밀</h3>

<p>개안의 기하학 분석에서 가장 중추적인 역할을 하는 선이 바로 **1x1 각도선(45도 선)**입니다. 이 선은 **'1단위의 시간 동안 1단위의 가격이 상승한다'**는 완벽한 대칭 균형 상태를 의미합니다.</p>

<ul>
    <li><strong>1x1 선 위(45도 이상):</strong> 매수세가 완벽히 시장을 지배하는 강력한 강세장입니다. 1x1 선이 깨지지 않는 한 추세 매매를 유지합니다.</li>
    <li><strong>1x2 선 (26.25도):</strong> 1단위의 시간에 0.5단위 가격이 오르는 선으로, 1x1 선이 무너졌을 때 다음 2차 강력 지지선 역할을 수행합니다.</li>
    <li><strong>2x1 선 (63.75도):</strong> 극심한 과열 각도로, 주가가 이 이상 올라가면 급격한 시간/가격 조정이 임박했음을 경고합니다.</li>
</ul>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 시간 주기의 대칭성과 계절성 변곡점 포착</h3>

<p>대부분의 기술적 분석가들이 '가격'에만 몰두할 때, 개안은 **'시간(Time)'이 가격보다 더 우위에 있다**고 주장했습니다. 주가가 아무리 많이 올라갔어도 정해진 시간 주기가 차기 전에는 꺾이지 않으며, 반대로 시간이 도달하면 이유 없이 하락한다는 논리입니다.</p>

<ul>
    <li><strong>주요 시간 변곡 주기:</strong> 30일, 60일, 90일, 180일, 360일(1년) 단위의 주기는 한국 증시의 대시세 종목들에서도 저점 후 변곡이 발생하는 놀라운 정교함을 보여줍니다.</li>
    <li><strong>원형 및 사각형의 분할:</strong> 360도 원을 8등분(45도, 90도, 135도, 180도 등)하여 주요 시간 및 가격 저항대를 산출하는 방식입니다.</li>
</ul>

<blockquote style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
"기억하라. 시간은 가격을 지배한다. 가격이 저항선에 다다랐을 때 시간의 주기가 함께 도달한다면, 그곳이 바로 평생에 몇 번 오지 않는 완벽한 트레이딩 타점이다."
</blockquote>

<p>개안의 철학이 전달하는 교훈은 트레이더가 차트의 수평 지지선뿐만 아니라, **시간의 경과에 따른 대각선 각도 지지대(Gann Fan)**를 함께 그려 넣을 때 시장의 진짜 입체적 지형을 파악할 수 있다는 점입니다.</p>`
  },
  {
    id: "col_17",
    title: "J. 웨일즈 와일더: 현대 트레이딩 지표의 거장, RSI·ADX·ATR·Parabolic SAR 개발의 비밀",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["웨일즈와일더", "RSI", "ADX", "ATR", "파라볼릭SAR"],
    slug: "j-welles-wilder-rsi-adx-atr-parabolic-sar",
    createdAt: "2026-07-25T15:00:00+00:00",
    published_at: "2026-07-25T15:00:00+00:00",
    is_published: true,
    views: 408,
    content: `<h2>[보조지표의 아버지] J. 웨일즈 와일더와 현대 트레이딩 4대 지표</h2>

<p>오늘날 모바일 HTS/MTS 앱의 차트 설정 창을 열면 나타나는 대표 보조지표들—**RSI, ADX, ATR, Parabolic SAR**—이 놀랍게도 단 한 사람의 천재적인 머리에서 나왔다는 사실을 알고 계십니까? 기계공학자이자 부동산 투자자였던 <strong>J. 웨일즈 와일더(J. Welles Wilder Jr., 1935~2021)</strong>는 1978년 저서 『New Concepts in Technical Trading Systems』를 통해 이 위대한 지표들을 일시에 세상에 공개했습니다.</p>

<p>수학적 정교함과 실전 유용성을 겸비한 그의 4대 지표는 컴퓨터가 없던 시절 수작업 계산법으로 고안되었으나, 오늘날 양적 투자(Quant Trading)와 시스템 매매의 핵심 알고리즘으로 자리잡았습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 와일더의 4대 보조지표 핵심 분석 및 타점</h3>

<h4>① RSI (상대강도지수 - Relative Strength Index)</h4>
<p>일정 기간(기본 14일) 동안 주가가 상승한 변화량과 하락한 변화량의 평균값을 비교하여 **상대적인 매수/매도 강도(0~100)**를 측정합니다.</p>
<ul>
    <li><strong>과매수(70 이상) / 과매도(30 이하):</strong> 주가가 단기 과열이나 침체에 도달했음을 알립니다.</li>
    <li><strong>RSI 다이버전스(Divergence):</strong> 주가는 신고가를 쳤으나 RSI 고점이 낮아지는 현상은 트레이더가 즉각 손절 및 이익 실현을 단행해야 하는 강력한 추세 전환 경고입니다.</li>
</ul>

<h4>② ADX (평균방향성지수 - Average Directional Index)</h4>
<p>주가의 상승/하락 방향과 무관하게 **'현재 추세의 힘이 얼마나 강력한가'**만을 측정하는 지표입니다. ADX가 25를 돌파하여 올라갈 때가 진정한 주도주의 대세 상승 추세 진입 구간입니다.</p>

<h4>③ ATR (평균진폭 - Average True Range)</h4>
<p>갭(Gap)을 포함한 하루의 진정한 변동성 크기를 측정합니다. 와일더는 ATR의 2배, 3배 값을 기준으로 **트레이더의 트레일링 스탑(Trailing Stop) 손절가**를 설정하는 기법을 창안했습니다.</p>

<h4>④ Parabolic SAR (Stop and Reverse)</h4>
<p>차트 위아래에 점(Dot) 형태로 표시되며, 점이 차트 아래에 있으면 매수 보유, 차트 위로 점이 반전되면 즉시 매도 후 반대 포지션을 취하는 명확한 추세 추종 시스템 지표입니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 와일더 지표 조합의 최적 가이드: '지표 과다 복용' 예방법</h3>

<p>많은 초보 트레이더들이 와일더의 지표들을 한꺼번에 화면에 띄워 놓고 서로 상충하는 신호 때문에 혼란을 겪습니다. 와일더 본인이 추천한 최적 조합은 다음과 같습니다.</p>

<blockquote style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0;">
"ADX로 시장이 추세장인지 박스권인지를 먼저 판별하라. ADX가 높은 추세장에서는 Parabolic SAR을 따라가고, ADX가 낮은 박스권에서는 RSI의 과매수/과매도를 이용해 역매매하라."
</blockquote>

<p>단순히 지표의 숫자에만 매달리지 않고, 와일더가 정립한 변동성과 추세의 본질을 이해할 때 비로소 노이즈를 걷어내고 승률 높고 깔끔한 차트 분석을 완성할 수 있습니다.</p>`
  },
  {
    id: "col_18",
    title: "제럴드 아펠: 이동평균선의 수렴과 확산을 이용한 'MACD' 지표 개발",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["제럴드아펠", "MACD", "시그널선", "히스토그램", "다이버전스"],
    slug: "gerald-appel-macd-moving-average-convergence-divergence",
    createdAt: "2026-07-26T10:00:00+00:00",
    published_at: "2026-07-26T10:00:00+00:00",
    is_published: true,
    views: 432,
    content: `<h2>[추세 모멘텀의 마스터] 제럴드 아펠과 MACD 지표 매매법</h2>

<p>전 세계 주식 시장에서 가장 널리 쓰이며, 대중 트레이더와 시스템 알고리즘이 동시에 최우선으로 모니터링하는 보조지표를 하나만 꼽으라면 단연 **MACD(Moving Average Convergence Divergence, 이동평균 수렴·확산 지표)**일 것입니다. 이 위대한 지표는 1970년대 후반 뉴욕의 자산운용가이자 기술적 분석가인 <strong>제럴드 아펠(Gerald Appel)</strong>에 의해 정립되었습니다.</p>

<p>아펠은 단순 이동평균선의 시차(Lagging) 단점을 극복하기 위해 **지수이동평균선(EMA)**을 도입하고, 단기 이평선과 장기 이평선이 서로 가까워졌다(Convergence) 멀어지는(Divergence) 에너지의 변화 속도를 시각화했습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. MACD 지표를 구성하는 3가지 요소의 수학적 구조</h3>

<ul>
    <li><strong>MACD 선 (Fast Line):</strong> 단기 지수이동평균(12일)에서 장기 지수이동평균(26일)을 뺀 값입니다. 두 이평선의 거리가 벌어질수록 MACD 선이 급격히 상승합니다.</li>
    <li><strong>시그널 선 (Signal Line / Slow Line):</strong> MACD 선의 9일 지수이동평균값입니다. MACD 자체의 단기 노이즈를 부드럽게 정화해 주는 평행선입니다.</li>
    <li><strong>MACD 히스토그램 (Oscillator):</strong> MACD 선에서 시그널 선을 뺀 값을 막대그래프로 표현한 것입니다. 에너지가 플러스(+)로 확산되는지 마이너스(-)로 축소되는지 한눈에 직관적으로 보여줍니다.</li>
</ul>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 실전 트레이딩에서 필승하는 MACD 3대 타점 공식</h3>

<ol>
    <li><strong>골든크로스 / 데드크로스 타점:</strong> MACD 선이 아래에서 시그널 선을 위로 돌파할 때(골든크로스) 매수하고, 위에서 아래로 뚫고 내려갈 때(데드크로스) 매도합니다.</li>
    <li><strong>제로선(0선) 돌파 타점:</strong> MACD 선이 음수(-) 영역에서 플러스(+) 영역인 0선 위로 안착하는 순간은 단기 조정이 끝나고 **대세 상승 파동으로 진입하는 가장 강력한 가속 구간**입니다.</li>
    <li><strong>MACD 다이버전스 (Divergence - 최고 승률 타점):</strong> 주가는 전저점을 깨고 하락했으나 MACD 히스토그램의 저점은 오르는 **강세 다이버전스**는 세력의 바닥 매집 신호입니다. 반대로 주가 신저가 속 MACD 고점 하락은 강력한 매도 신호입니다.</li>
</ol>

<blockquote style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0;">
"MACD는 속임수(False Breakout)가 적은 가장 성숙한 지표이다. 특히 0선 위에서 발생한 첫 번째 MACD 골든크로스는 주도주 눌림목의 황금 열쇠이다."
</blockquote>

<p>제럴드 아펠의 MACD를 단독으로 사용하기보다 주가의 주요 저항대 돌파 및 거래대금 폭발과 병행하여 체크한다면, 가짜 파동에 흔들리지 않고 대시세의 정중앙을 온전히 누릴 수 있습니다.</p>`
  },
  {
    id: "col_19",
    title: "존 볼린저: 통계학 표준편차와 주가의 만남, '볼린저 밴드' 스퀴즈와 스파이크 타점 잡기",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["존볼린저", "볼린저밴드", "표준편차", "스퀴즈", "상한선돌파"],
    slug: "john-bollinger-bollinger-bands-volatility-squeeze",
    createdAt: "2026-07-26T15:00:00+00:00",
    published_at: "2026-07-26T15:00:00+00:00",
    is_published: true,
    views: 450,
    content: `<h2>[통계학 분석의 정수] 존 볼린저와 볼린저 밴드(Bollinger Bands)</h2>

<p>정규분포 곡선의 통계학적 원리를 주식 차트에 접목하여 폭발적인 시세의 시작과 끝을 밝혀낸 지표, 바로 <strong>존 볼린저(John A. Bollinger, 1950~)</strong>가 1980년대 개발한 **볼린저 밴드(Bollinger Bands)**입니다.</p>

<p>기존의 고정된 엔벨로프(Envelope) 밴드와 달리, 볼린저 밴드는 주가의 최근 변동성(Standard Deviation)에 따라 **상하한선 폭이 스스로 오므라들었다가 벌어지는 가변적 동적 구조**를 가집니다. 통계학적으로 주가가 이 밴드 범위 안에서 움직일 확률은 **95.4%**에 달합니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 볼린저 밴드를 이루는 3개 선의 구조</h3>

<ul>
    <li><strong>중앙선 (Middle Band):</strong> 기본 20일 단순 이동평균선(SMA)입니다. 주가의 단기 중심축 역할을 수행합니다.</li>
    <li><strong>상한선 (Upper Band):</strong> 20일 이평선 + (20일 표준편차 $\times$ 2) 값입니다. 통계적 과열 한계선입니다.</li>
    <li><strong>하한선 (Lower Band):</strong> 20일 이평선 - (20일 표준편차 $\times$ 2) 값입니다. 통계적 침체 한계선입니다.</li>
</ul>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 트레이더가 반드시 포착해야 할 볼린저 밴드 2대 핵심 패턴</h3>

<h4>① 스퀴즈 (Squeeze - 에너지가 극도로 축적된 응축 구간)</h4>
<p>상한선과 하한선의 폭이 마치 병목처럼 극도로 좁아지는 현상입니다. 이는 시장의 변동성이 최저로 죽어 있으며, **조만간 상방이든 하방이든 거대한 폭발적 시세 분출이 임박했음**을 고하는 가장 중요한 폭풍전야 신호입니다.</p>

<h4>② 밴드 워킹 (Band Walking - 주도주의 상한선 타고 오르기)</h4>
<p>흔히 초보자들은 주가가 상한선에 닿으면 매도해야 한다고 오해합니다. 그러나 사상 최대 거래대금을 동반한 주도주는 **상한선을 뚫고 밴드 외각을 찢으며 계속 우상향하는 '밴드 워킹'**을 보여줍니다. 이것이 대시세 주도주의 진면목입니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<blockquote style="background: #f8fafc; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0;">
"밴드 폭이 극도로 응축된 스퀴즈 상태에서, 상한선을 뚫어내는 장대양봉과 거래대금이 터질 때가 주도주 탑승의 최고 적기이다."
</blockquote>

<p>존 볼린저의 가르침대로 밴드의 응축(Squeeze)과 확산(Expansion) 주기를 정교하게 추적한다면, 오랜 횡보를 끝내고 폭발하는 대장주의 초입 타점을 놓치지 않고 선점할 수 있습니다.</p>`
  },
  {
    id: "col_20",
    title: "조지 레인: 가격 속도의 변화를 읽는 '스토캐스틱(Stochastic Oscillator)' %K와 %D 매매법",
    author: "K-STOCK 수석 에디터",
    category: "blog",
    tags: ["조지레인", "스토캐스틱", "과매수과매도", "SlowStochastic", "모멘텀"],
    slug: "george-lane-stochastic-oscillator-k-d",
    createdAt: "2026-07-27T10:00:00+00:00",
    published_at: "2026-07-27T10:00:00+00:00",
    is_published: true,
    views: 468,
    content: `<h2>[모멘텀 분석의 거장] 조지 레인과 스토캐스틱(Stochastic Oscillator)</h2>

<p>주가가 고점에 도달해 꺾이기 직전, 가장 먼저 속도가 줄어드는 법칙을 기술적 지표로 완성한 인물이 바로 의사 출신의 전설적 트레이더 <strong>조지 레인(George Lane, 1921~2004)</strong>입니다. 그가 1950년대 후반 정립한 **스토캐스틱 오실레이터(Stochastic Oscillator)**는 주식의 가격 자체가 아니라 **'가격이 움직이는 모멘텀 속도'**를 측정합니다.</p>

<p>조지 레인은 "로켓이 하늘로 솟아오를 때 실제 방향을 바꾸기 직전 먼저 속도가 감속하듯, 주가 역시 고점 경신 전 모멘텀 속도가 먼저 둔화된다"는 통찰을 수학공식으로 시각화했습니다.</p>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>1. 스토캐스틱 %K와 %D의 구성과 Slow Stochastic의 필연성</h3>

<ul>
    <li><strong>%K (Fast Line):</strong> 최근 N일 동안 형성된 최고가와 최저가 범위 내에서, 현재 종가가 어디에 위치하는지를 퍼센트(0~100%)로 나타낸 수치입니다.</li>
    <li><strong>%D (Slow Line):</strong> %K 값의 이동평균선으로, 매매 신호의 지연과 평탄화를 담당합니다.</li>
    <li><strong>Fast vs Slow Stochastic:</strong> Fast Stochastic은 노이즈와 속임수(Whipsaw)가 너무 심하므로, 실전 매매에서는 %K를 한 번 더 이동평균하여 정화한 **Slow Stochastic (5, 3, 3 또는 14, 3, 3)**을 사용하는 것이 필수적입니다.</li>
</ul>

<!-- 애드센스 자동 광고 삽입 위치 -->

<h3>2. 실전 트레이더를 위한 스토캐스틱 핵심 매매 전략</h3>

<ol>
    <li><strong>과매도 20 이하 골든크로스:</strong> 지표가 20 이하의 침체권에 진입했다가, %K 선이 %D 선을 위로 상향 돌파할 때가 강력한 단기 저점 매수 신호입니다.</li>
    <li><strong>과매수 80 이상 데드크로스:</strong> 80 이상의 과열권에서 %K 선이 %D 선을 아래로 하향 이탈할 때는 단기 이익 실현 타점입니다.</li>
    <li><strong>스토캐스틱 다이버전스(Stochastic Divergence):</strong> 주가는 연속 신저가를 썼으나 스토캐스틱 저점은 오르는 현상은 강력한 추세 반전의 조짐입니다.</li>
</ol>

<blockquote style="background: #f8fafc; border-left: 4px solid #ea580c; padding: 12px 16px; margin: 16px 0;">
"강한 추세장에서는 스토캐스틱이 80 이상에서 둔화되는 속임수가 발생하므로, 반드시 이동평균선 및 거래량 지표와 병행하여 판단하라."
</blockquote>

<p>조지 레인의 스토캐스틱 지표를 통해 가격 속도의 미세한 감속 신호를 읽어낸다면, 남들보다 한발 앞서 바닥을 감지하고 차분하게 승률 높은 매수 타점을 포착하는 트레이더로 거듭날 수 있습니다.</p>`
  }
];

async function updateMasterPosts() {
  console.log('--- Updating Master Posts col_12 to col_20 ---');
  const postsFilePath = path.resolve(__dirname, '../data/content/posts.json');
  let existingPosts = [];
  try {
    const raw = fs.readFileSync(postsFilePath, 'utf8');
    existingPosts = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read existing posts.json:', err.message);
  }

  // Map of existing by ID
  const postsMap = new Map();
  existingPosts.forEach(p => {
    postsMap.set(p.id, p);
  });

  // Update or insert masterPosts col_12 to col_20
  masterPosts.forEach(mp => {
    postsMap.set(mp.id, mp);
  });

  // Re-sort posts nicely
  const sortedPosts = Array.from(postsMap.values()).sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
    return numB - numA; // descending order col_26, col_25... col_1
  });

  // Write back to file
  fs.writeFileSync(postsFilePath, JSON.stringify(sortedPosts, null, 2), 'utf-8');
  console.log(`Successfully updated posts.json with ${sortedPosts.length} total posts.`);

  // Sync to Supabase
  if (url && key) {
    console.log('Connecting to Supabase to update posts table...');
    const supabase = createClient(url, key);

    for (const mp of masterPosts) {
      const numId = parseInt(mp.id.replace('col_', ''));
      
      // Upsert into Supabase posts table
      const { error: upsertErr } = await supabase.from('posts').upsert({
        id: numId,
        title: mp.title,
        content: mp.content,
        is_published: mp.is_published,
        published_at: mp.published_at
      }, { onConflict: 'id' });

      if (upsertErr) {
        console.error(`Supabase Upsert Error for ${mp.id}:`, upsertErr.message);
      } else {
        console.log(`Supabase Post ${mp.id} synced successfully.`);
      }

      // Also upload storage file
      try {
        const fileName = `posts/post_${numId}.html`;
        const { error: storageErr } = await supabase.storage
          .from('platform_data')
          .upload(fileName, mp.content, {
            contentType: 'text/html; charset=utf-8',
            upsert: true
          });
        if (storageErr) {
          console.warn(`Supabase Storage upload warning for ${fileName}:`, storageErr.message);
        } else {
          console.log(`Supabase Storage file ${fileName} uploaded.`);
        }
      } catch (stErr) {
        console.warn(`Storage exception for ${mp.id}:`, stErr.message);
      }
    }
  }

  console.log('--- ALL MASTER POSTS 12-20 SUCCESSFULLY UPDATED & SYNCED ---');
}

updateMasterPosts();
