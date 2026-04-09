'use client';

import { useState } from 'react';
import type { PaintType, WorkEnvironment } from '@/types';
import { addRecord } from '@/lib/records';

interface Props {
  date: string;
  score: number;
  paintType: PaintType;
  environment: WorkEnvironment;
  onClose: () => void;
  onSaved: () => void;
}

const RESULT_OPTIONS: { value: 'success' | 'ok' | 'failure'; label: string; color: string }[] = [
  { value: 'success', label: '✅ 成功',  color: 'bg-green-600 text-white border-green-600' },
  { value: 'ok',      label: '😐 普通',  color: 'bg-gray-500 text-white border-gray-500' },
  { value: 'failure', label: '❌ 失敗',  color: 'bg-red-500 text-white border-red-500' },
];

const PAINT_LABELS: Record<PaintType, string> = {
  lacquer: 'ラッカー', waterbase: '水性', enamel: 'エナメル',
};
const ENV_LABELS: Record<WorkEnvironment, string> = {
  indoor: '🏠 室内', outdoor: '🌤️ 屋外',
};

export function RecordModal({ date, score, paintType, environment, onClose, onSaved }: Props) {
  const [result, setResult] = useState<'success' | 'ok' | 'failure'>('ok');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await addRecord({ date, paintType, environment, score, result, note });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-base font-bold text-gray-800 mb-1">📝 塗装を記録する</h2>
        <p className="text-xs text-gray-400 mb-5">
          {date} · {PAINT_LABELS[paintType]} · {ENV_LABELS[environment]} · スコア {score}
        </p>

        {/* 結果 */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">結果</p>
        <div className="flex gap-2 mb-5">
          {RESULT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setResult(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                result === opt.value ? opt.color : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* メモ */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">メモ（任意）</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="気づいたこと、問題点など..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-indigo-400 resize-none mb-5"
        />

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
