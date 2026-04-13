'use client';

import { useEffect, useState } from 'react';
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

export default function RecordsPage() {
  const [records, setRecords] = useState<PaintingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllRecords().then((r) => { setRecords(r); setLoaded(true); });
  }, []);

  async function handleDelete(id: string) {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const successCount = records.filter((r) => r.result === 'success').length;
  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0;

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
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{records.length}</p>
              <p className="text-xs text-gray-400 mt-1">記録数</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-xs text-gray-400 mt-1">成功</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{avgScore}</p>
              <p className="text-xs text-gray-400 mt-1">平均スコア</p>
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
        ) : (
          <div className="space-y-3">
            {records.map((rec) => {
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
        )}

        <div className="mt-8 text-center">
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
