import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Clock, Zap, FileText, Database, Sparkles, 
  Check, Save, Trash2, RefreshCw, AlertTriangle, Key 
} from 'lucide-react';
import { PreMarketBriefing, AfterMarketReport } from '../types';

interface AdminConsoleProps {
  briefing: PreMarketBriefing | null;
  report: AfterMarketReport | null;
  onUpdateBriefing: (updated: PreMarketBriefing) => Promise<void>;
  onUpdateReport: (updated: AfterMarketReport) => Promise<void>;
  onTriggerBriefing: () => Promise<void>;
  onTriggerReport: () => Promise<void>;
  onTriggerStudyGuide: (symbol: string) => Promise<void>;
  onOpenDebug?: () => void;
  providerIndex?: number;
  setProviderIndex?: (index: number) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  briefing,
  report,
  onUpdateBriefing,
  onUpdateReport,
  onTriggerBriefing,
  onTriggerReport,
  onTriggerStudyGuide,
  onOpenDebug,
  providerIndex,
  setProviderIndex
}) => {
  const [adminTab, setAdminTab] = useState<'report' | 'logs'>('report');
  const [kisVerifyResult, setKisVerifyResult] = useState<any>(null);
  const [kisVerifyLoading, setKisVerifyLoading] = useState<boolean>(false);

  const handleVerifyKis = async () => {
    setKisVerifyLoading(true);
    setKisVerifyResult(null);
    try {
      const res = await fetch('/api/kis-verify');
      if (res.ok) {
        const data = await res.json();
        setKisVerifyResult(data);
      } else {
        setKisVerifyResult({
          tokenSuccess: false,
          tokenError: '서버 에러가 발생했습니다.'
        });
      }
    } catch (err: any) {
      setKisVerifyResult({
        tokenSuccess: false,
        tokenError: err.message || String(err)
      });
    } finally {
      setKisVerifyLoading(false);
    }
  };
  
  // Editorial States
  const [briefingText, setBriefingText] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');
  const [briefingJsonError, setBriefingJsonError] = useState<string | null>(null);
  const [reportJsonError, setReportJsonError] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [triggeringBriefing, setTriggeringBriefing] = useState<boolean>(false);
  const [triggeringReport, setTriggeringReport] = useState<boolean>(false);
  const [guideSymbol, setGuideSymbol] = useState<string>('000250');
  const [triggeringGuide, setTriggeringGuide] = useState<boolean>(false);

  // Sync props to text areas
  useEffect(() => {
    if (briefing) {
      setBriefingText(JSON.stringify(briefing, null, 2));
    }
  }, [briefing]);

  useEffect(() => {
    if (report) {
      setReportText(JSON.stringify(report, null, 2));
    }
  }, [report]);

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/platform/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'logs') {
      loadAuditLogs();
    }
  }, [adminTab]);

  const handleSaveBriefingText = async () => {
    try {
      const parsed = JSON.parse(briefingText);
      setBriefingJsonError(null);
      await onUpdateBriefing(parsed);
      alert('장전 브리핑 JSON 데이터가 성공적으로 반영되었습니다.');
    } catch (err: any) {
      setBriefingJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleSaveReportText = async () => {
    try {
      const parsed = JSON.parse(reportText);
      setReportJsonError(null);
      await onUpdateReport(parsed);
      alert('장마감 주도주 리포트 JSON 데이터가 성공적으로 반영되었습니다.');
    } catch (err: any) {
      setReportJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleForceGenerateBriefing = async () => {
    setTriggeringBriefing(true);
    try {
      await onTriggerBriefing();
      alert('07:50 장전 브리핑 데이터가 최신 미국 시장 상황을 바탕으로 성공적으로 백그라운드 재생성 완료되었습니다.');
    } catch (err) {
      alert('생성 중 오류 발생');
    } finally {
      setTriggeringBriefing(false);
    }
  };

  const handleForceGenerateReport = async () => {
    setTriggeringReport(true);
    try {
      await onTriggerReport();
      alert('16:00 장마감 주도주 리포트 데이터가 수급 통계를 기반으로 성공적으로 백그라운드 재생성 완료되었습니다.');
    } catch (err) {
      alert('생성 중 오류 발생');
    } finally {
      setTriggeringReport(false);
    }
  };

  const handleForceGenerateGuide = async () => {
    if (!guideSymbol.trim()) return;
    setTriggeringGuide(true);
    try {
      await onTriggerStudyGuide(guideSymbol.trim());
      alert(`종목코드 ${guideSymbol}에 대한 AI 학습 차트 가이드가 성공적으로 생성되었습니다.`);
    } catch (err) {
      alert('가이드 생성 중 오류 발생');
    } finally {
      setTriggeringGuide(false);
    }
  };

  return (
    <div className="col-span-12 space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-slate-100">AI 복기 플랫폼 시스템 관리자 (Admin Console)</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            07:50 및 16:00 정기 발행 콘텐츠의 수동 제어, 데이터 즉시 재생성 및 감사 로그 추적을 담당합니다.
          </p>
        </div>

        {onOpenDebug && (
          <button
            onClick={onOpenDebug}
            className="px-3.5 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 hover:text-indigo-200 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold self-start md:self-center"
            title="시스템 아키텍처 진단 & 디버그 모드"
          >
            <Shield className="w-4 h-4 animate-pulse" />
            <span>디버그 모드 구동 ⚙️</span>
          </button>
        )}
      </div>

      {/* 데이터 공급원 설정 (Data Provider Selector) */}
      {providerIndex !== undefined && setProviderIndex !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-slate-100">차트 시세 공급망 설정 (Data Provider Control)</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              시뮬레이터에서 복기할 주도주 차트의 백엔드 원천 데이터 공급 방식을 실시간으로 스위칭합니다.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-96 flex-shrink-0 font-mono">
            <button
              onClick={() => setProviderIndex(0)}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                providerIndex === 0
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Naver Finance 실시간 일봉/분봉 API"
            >
              실시간 API
            </button>
            <button
              onClick={() => setProviderIndex(1)}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                providerIndex === 1
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="시뮬레이션 기반 난수 정밀 생성 공급자"
            >
              시뮬 시세
            </button>
            <button
              onClick={() => setProviderIndex(2)}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                providerIndex === 2
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="고정 모크 차트 정합성 공급자"
            >
              모크 데이터
            </button>
            <button
              onClick={() => setProviderIndex(3)}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                providerIndex === 3
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="로컬 저장소의 JSON.gz 압축 파일로부터 차트를 복기합니다."
            >
              GZIP DB
            </button>
          </div>
        </div>
      )}

      {/* Tab select bar */}
      <div className="flex border-b border-slate-800 gap-1.5 overflow-x-auto pb-px">
        <button
          onClick={() => setAdminTab('report')}
          className={`px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            adminTab === 'report'
              ? 'border-blue-500 text-blue-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>장마감 리포트 JSON 편집 & 수동생성</span>
        </button>

        <button
          onClick={() => setAdminTab('logs')}
          className={`px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            adminTab === 'logs'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>시스템 감사 로그 (Audit Logs)</span>
        </button>
      </div>

      {/* Panel container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
        
        {/* TAB 1: REPORT (JSON Schema Editor Only) */}
        {adminTab === 'report' && (
          <div className="space-y-4">
            {/* JSON Code editor */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">After-Market Report JSON Schema Editor</span>
                {reportJsonError ? (
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>구문 오류</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>정상 스키마</span>
                  </span>
                )}
              </div>
              <textarea
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setReportJsonError(null);
                  } catch (err: any) {
                    setReportJsonError(err.message);
                  }
                }}
                className="w-full h-96 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-blue-300/90 focus:outline-none focus:border-blue-500/50 custom-scrollbar resize-none"
              />
              {reportJsonError && (
                <p className="text-[11px] text-red-400 font-mono bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                  {reportJsonError}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800/60">
              <button
                onClick={handleSaveReportText}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>장마감 리포트 JSON 편집본 저장하기</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {adminTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>실시간 플랫폼 로깅 및 추적 (Audit Trail)</span>
              </h4>
              <button
                disabled={logsLoading}
                onClick={loadAuditLogs}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/70">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold bg-slate-950">
                    <th className="p-3">타임스탬프</th>
                    <th className="p-3">작업명 (Action)</th>
                    <th className="p-3">대상 매개변수 (Params)</th>
                    <th className="p-3">상태 (Status)</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-mono">감사로그를 조회하는 중입니다...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">조회된 감사 기록이 아직 없습니다. 가이드라인이나 매매 분석을 진행해보세요!</td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={idx} className="border-b border-slate-850 hover:bg-slate-900/30 font-mono text-[11px] text-slate-300">
                        <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 font-bold text-slate-200">{log.action}</td>
                        <td className="p-3 text-slate-400 truncate max-w-[300px]" title={JSON.stringify(log.params)}>{JSON.stringify(log.params)}</td>
                        <td className="p-3">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
