'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllRecords, deleteRecord } from '@/lib/records';
import type { PaintingRecord } from '@/lib/records';
import type { PaintType, WorkEnvironment } from '@/types';

const PAINT_LABELS: Record<PaintType, string> = {
  lacquer: 'ラッカー', waterbase: '水性', enamel: 'エナメル',
};
const ENV_LABELS: Record<WorkEnvironment, string> = {
  indoor: '🏠 室内', outdoor: '🌤️ 屋外',
};
const RESULT_CONFIG = {
  success: { label: '成功', style: 'bg-green-100 text-green-700' },
  ok:      { label: '普通', style: 'bg-gray-100 text-gray-600' },
  failure: { label: '失敗', style: 'bg-red-100 text-red-700' },
};

type ResultFilter = 'all' | 'success' | 'ok' | 'failure';
type PaintFilter  = 'all' | PaintType;

/** records を CSV 文字列に変換 */
function toCSV(records: PaintingRecord[]): string {
  const header = '日付,塗料種別,作業環境,結果,スコア,メモ';
  const rows = records.map((r) =>
    [
      r.date,
      PAINT_LABELS[r.paintType],
      r.environment === 'indoor' ? '室内' : '屋外',
      RESULT_CONFIG[r.result].label,
      r.score,
      `"${(r.note ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

/** CSV をファイルとしてダウンロードする */
function downloadCSV(records: PaintingRecord[]) {
  const csv = '\uFEFF' + toCSV(records); // BOM付きでExcelでも文字化けなし
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `塗装記録_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecordsPage() {
  const [records, setRecords] = useState<PaintingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [paintFilter, setPaintFilter] = useState<PaintFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');

  useEffect(() => {
    getAllRecords().then((r) => { setRecords(r); setLoaded(true); });
  }, []);

  async function handleDelete(id: string) {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  // フィルター後の記録
  const filtered = useMemo(() => records.filter((r) => {
    if (paintFilter  !== 'all' && r.paintType !== paintFilter)  return false;
    if (resultFilter !== 'all' && r.result    !== resultFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo   && r.date > dateTo)   return false;
    return true;
  }), [records, paintFilter, resultFilter, dateFrom, dateTo]);

  // サマリー（全記録ベース）
  const summary = useMemo(() => {
    const byType = (['lacquer', 'waterbase', 'enamel'] as PaintType[]).map((type) => {
      const group = records.filter((r) => r.paintType === type);
      const success = group.filter((r) => r.result === 'success').length;
      return { type, total: group.length, success };
    });
    return {
      total: records.length,
      successCount: records.filter((r) => r.result === 'success').length,
      avgScore: records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
        : 0,
      byType,
    };
  }, [records]);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <header className="mb-6">
          <Link href="/" className="text-xs text-indigo-500 hover:underline">← トップに戻る</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">📝 塗装記録</h1>
          <p className="text-gray-500 text-sm mt-1">過去の塗装結果の記録</p>
        </header>

        {/* サマリー */}
        {records.length > 0 && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                <p className="text-xs text-gray-400 mt-1">記録数</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.successCount}</p>
                <p className="text-xs text-gray-400 mt-1">成功</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{summary.avgScore}</p>
                <p className="text-xs text-gray-400 mt-1">平均スコア</p>
              </div>
            </div>

            {/* 塗料別成功率 */}
            <div className="mb-5 bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">塗料別成功率</p>
              <div className="space-y-2">
                {summary.byType.filter((b) => b.total > 0).map(({ type, total, success }) => {
                  const rate = Math.round((success / total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{PAINT_LABELS[type]}</span>
                        <span className="text-gray-500">{success}/{total}回  {rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        {/* 視覚補助バー（数値はテキストで提供済みのため aria 属性なし） */}
                        <div
                          className="h-full bg-green-400 rounded-full transition-all"
                          style={{ width: `${rate}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* フィルター */}
        {records.length > 0 && (
          <div className="mb-4 bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">絞り込み</p>

            {/* 塗料種別 */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'lacquer', 'waterbase', 'enamel'] as PaintFilter[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPaintFilter(v)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    paintFilter === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {v === 'all' ? 'すべて' : PAINT_LABELS[v]}
                </button>
              ))}
            </div>

            {/* 結果 */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'success', 'ok', 'failure'] as ResultFilter[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setResultFilter(v)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    resultFilter === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {v === 'all' ? 'すべて' : RESULT_CONFIG[v].label}
                </button>
              ))}
            </div>

            {/* 日付範囲 */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="開始日"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <span className="text-gray-400 text-xs">〜</span>
              <input
                type="date"
                aria-label="終了日"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 記録リスト */}
        {!loaded ? (
          <div className="text-center py-16 text-gray-400">読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">まだ記録がありません</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              🎨 今日の塗装を記録する
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            条件に一致する記録がありません
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-2">{filtered.length}件表示</p>
            <div className="space-y-3">
              {filtered.map((rec) => {
                const rc = RESULT_CONFIG[rec.result];
                return (
                  <div key={rec.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-800">{rec.date}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rc.style}`}>
                            {rc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                          <span>{PAINT_LABELS[rec.paintType]}</span>
                          <span>·</span>
                          <span>{ENV_LABELS[rec.environment]}</span>
                          <span>·</span>
                          <span>スコア {rec.score}</span>
                        </div>
                        {rec.note && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{rec.note}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        className="ml-3 text-xs text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        aria-label="削除"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* フッター */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCSV(records)}
              className="inline-block px-5 py-2 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              📥 CSV エクスポート
            </button>
          )}
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            🎨 今日の塗装スコアを確認する
          </Link>
        </div>

      </div>
    </div>
  );
}
