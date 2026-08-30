import { useEffect, useState } from 'react';
import { Upload, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { Screen, Section } from './ui';
import { parseSpreadsheetFile } from '../lib/marketDataParse';
import { detectColumnMapping, normalizeRows, type MarketDataRow } from '../lib/marketDataNormalize';
import { saveDataset, listDatasets, getMarketData, deleteDataset, type Dataset } from '../lib/marketDataStore';
import ReplayPlayback from './ReplayPlayback';

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
        <ReplayPlayback rows={view.rows} />
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
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
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
