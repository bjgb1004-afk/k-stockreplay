import { useEffect, useState } from 'react';
import { Upload, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { Screen, Section } from './ui';
import { parseSpreadsheetFile } from '../lib/marketDataParse';
import { detectColumnMapping, normalizeRows, type MarketDataRow } from '../lib/marketDataNormalize';
import { saveDataset, listDatasets, getMarketData, deleteDataset, type Dataset } from '../lib/marketDataStore';
import ReplayTrading from './ReplayTrading';

type View = { kind: 'list' } | { kind: 'upload' } | { kind: 'play'; dataset: Dataset; rows: MarketDataRow[] };

const MARKETS = ['코스피', '코스닥'] as const;

export default function ReplayScreen() {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  function refresh() {
    listDatasets().then((list) => setDatasets(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  }

  useEffect(refresh, []);

  async function handleOpen(dataset: Dataset) {
    const rows = await getMarketData(dataset.id);
    setView({ kind: 'play', dataset, rows });
  }

  async function handleDelete(id: string) {
    await deleteDataset(id);
    refresh();
  }

  if (view.kind === 'play') {
    return (
      <Screen>
        <header className="mb-4 flex items-center gap-3">
          <button onClick={() => setView({ kind: 'list' })} aria-label="목록으로" className="text-slate-400 p-1.5">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{view.dataset.symbol}</h1>
            <p className="text-xs text-slate-500">{view.dataset.startDate} ~ {view.dataset.endDate}</p>
          </div>
        </header>
        <ReplayTrading datasetId={view.dataset.id} rows={view.rows} />
      </Screen>
    );
  }

  if (view.kind === 'upload') {
    return <UploadForm onDone={() => { refresh(); setView({ kind: 'list' }); }} onCancel={() => setView({ kind: 'list' })} />;
  }

  return (
    <Screen>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">REPLAY</h1>
          <p className="text-xs text-slate-500">업로드한 파일은 이 기기에만 저장됩니다</p>
        </div>
        <button
          onClick={() => setView({ kind: 'upload' })}
          className="shrink-0 flex items-center gap-1 text-xs bg-slate-800 text-slate-100 rounded-lg px-3 py-2"
        >
          <Upload size={14} /> 업로드
        </button>
      </header>

      <details className="mb-6 bg-slate-900 rounded-lg px-3 py-2 text-sm text-slate-300 open:pb-3">
        <summary className="cursor-pointer text-slate-100 font-medium py-1">사용법 자세히 보기 (데이터는 어디서 받나요?)</summary>

        <div className="mt-3 space-y-4 text-xs text-slate-400">
          <div>
            <p className="text-slate-200 font-medium mb-1">1. 데이터 파일 구하기</p>
            <p>공통적으로 PC용 HTS의 차트 화면에서 마우스 우클릭 → "엑셀로 저장" 계열 메뉴를 찾으면 됩니다. 증권사별로 알려진 위치는 아래와 같은데, 프로그램 버전에 따라 메뉴 이름이나 위치가 조금 다를 수 있으니 참고용으로 보고 안 보이면 차트 화면에서 "엑셀"이나 "저장"으로 검색해보세요.</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li><span className="text-slate-300">키움증권(영웅문4/S)</span> — 차트 창 우클릭 → "다른 이름으로 저장" 또는 "Excel로 저장"</li>
              <li><span className="text-slate-300">삼성증권(POP HTS)</span> — 차트 우클릭 → "데이터 추출" / "엑셀 저장"</li>
              <li><span className="text-slate-300">NH투자증권(나무)</span> — 차트 화면 상단 툴바의 엑셀 아이콘</li>
              <li><span className="text-slate-300">한국투자증권(eBEST/한국투자 HTS)</span> — 차트 우클릭 → "엑셀로 저장"</li>
              <li><span className="text-slate-300">대신증권(크레온)</span> — 차트 우클릭 → "차트 데이터 저장"</li>
              <li>그 외 증권사도 대부분 같은 패턴(차트 우클릭 → 엑셀/저장 계열)을 씁니다.</li>
            </ul>
            <ul className="list-disc list-inside mt-2 space-y-0.5">
              <li>모바일(MTS) 앱은 보통 이 기능이 없어서 PC용 HTS가 필요합니다.</li>
              <li>네이버 금융(finance.naver.com) 종목 페이지에서도 일별 시세를 받을 수 있는 경우가 있습니다.</li>
              <li>일봉(하루 단위) 기준 최근 6개월~2년 정도 받으면 재생용으로 충분합니다.</li>
            </ul>
          </div>

          <div>
            <p className="text-slate-200 font-medium mb-1">2. 파일 형식</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>CSV, 구형 엑셀(.xls), 최신 엑셀(.xlsx) 전부 업로드 가능합니다.</li>
              <li>한글이 깨지는 CP949(EUC-KR) 인코딩 파일도 자동으로 알아서 처리하니 신경 쓰지 않아도 됩니다.</li>
              <li>필요한 컬럼은 날짜·시가·고가·저가·종가·거래량 6개뿐입니다. 컬럼 순서는 상관없고, "일자 / 시간"이나 "현재가"처럼 이름이 정확히 안 맞아도 비슷한 이름을 자동으로 찾아 연결합니다.</li>
              <li>컬럼을 못 찾으면 어떤 컬럼이 빠졌는지 화면에 바로 알려줍니다.</li>
            </ul>
          </div>

          <div>
            <p className="text-slate-200 font-medium mb-1">3. 업로드 → 재생 준비</p>
            <p>위 "업로드" 버튼 → 파일 선택 → 자동으로 행 개수가 확인되면 종목명(또는 코드)과 코스피/코스닥을 입력하고 저장합니다. 저장된 종목은 아래 목록에 기간·행 개수와 함께 남고, 언제든 삭제할 수 있습니다. 목록에서 종목을 누르면 투자금을 먼저 입력하는데, 여기서 정한 금액 안에서만 매수가 가능합니다(초과하면 매수 버튼이 자동으로 막힙니다).</p>
          </div>

          <div>
            <p className="text-slate-200 font-medium mb-1">4. 재생하며 연습하기</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>처음엔 앞쪽 30개 봉만 보이고, 재생 버튼이나 "다음 구간"으로 한 봉씩 진행합니다. 다음 봉으로 넘어갈 때는 종가가 바로 뜨지 않고 잠깐 위아래로 흔들리다 확정됩니다.</li>
              <li>슬라이더로 원하는 시점으로 바로 건너뛸 수 있고, 재생 속도(느리게/보통/빠르게)도 바꿀 수 있습니다.</li>
              <li>매수/매도는 수량을 직접 입력하거나, 10%/25%/50%/100% 버튼으로 그 시점 남은 현금 기준 수량을 자동 계산할 수 있습니다. 여러 번 나눠 사면(분할매수) 평단가가 자동으로 다시 계산되고, 차트에 노란 점선으로 표시됩니다.</li>
              <li>매수·매도한 지점은 차트에 화살표로 남습니다(매수는 초록 아래쪽, 매도는 빨강 위쪽). 매도할 때마다 그 매도의 손익이, 하단에는 누적 총 손익이 표시됩니다.</li>
            </ul>
          </div>

          <div>
            <p className="text-slate-200 font-medium mb-1">5. 데이터는 어디에 저장되나요</p>
            <p>업로드한 파일과 매매 기록은 서버로 전송되지 않고 이 브라우저(기기)에만 저장됩니다. 다른 기기나 브라우저에서는 다시 업로드해야 하고, 브라우저 저장공간(사이트 데이터)을 지우면 함께 사라집니다.</p>
          </div>
        </div>
      </details>

      <Section title="저장된 데이터">
        {datasets.length === 0 ? (
          <p className="text-sm text-slate-500">업로드한 데이터가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {datasets.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm bg-slate-900 rounded-lg pl-3 pr-1 py-1">
                <button onClick={() => handleOpen(d)} className="flex-1 flex items-center justify-between text-left py-1.5 min-w-0">
                  <span className="truncate">
                    <span className="font-medium">{d.symbol}</span>
                    <span className="text-slate-500 ml-2 text-xs">{d.market} · {d.rowCount}개 · {d.startDate}~{d.endDate}</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-600 shrink-0 ml-1" />
                </button>
                <button onClick={() => handleDelete(d.id)} aria-label={`${d.symbol} 삭제`} className="text-slate-500 hover:text-red-400 shrink-0 p-2">
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
}

function UploadForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [rows, setRows] = useState<MarketDataRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<(typeof MARKETS)[number]>('코스피');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setRows(null);
    try {
      const sheet = await parseSpreadsheetFile(file);
      const mapping = detectColumnMapping(sheet.headers);
      const parsed = normalizeRows(sheet.rows, mapping);
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 읽을 수 없습니다.');
    }
  }

  async function handleSave() {
    if (!rows || !symbol.trim()) return;
    setSaving(true);
    try {
      await saveDataset({ fileName, symbol: symbol.trim(), market, timeframe: '일봉' }, rows);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <header className="mb-6 flex items-center gap-3">
        <button onClick={onCancel} aria-label="취소" className="text-slate-400 p-1.5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">데이터 업로드</h1>
      </header>

      <Section title="파일 선택">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-100 file:text-xs"
        />
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {rows && <p className="text-xs text-slate-500 mt-2">{fileName} · {rows.length}개 행 확인됨</p>}
      </Section>

      {rows && (
        <Section title="종목 정보">
          <div className="space-y-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="종목명 또는 코드 (예: 삼성전자)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
            />
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as (typeof MARKETS)[number])}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            >
              {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              onClick={handleSave}
              disabled={!symbol.trim() || saving}
              className="w-full bg-slate-100 text-slate-950 rounded-lg py-2 text-sm font-medium disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </Section>
      )}
    </Screen>
  );
}
