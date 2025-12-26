'use client';

import { useState } from 'react';
import { LEVELS, LevelValue } from '@/types';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<LevelValue>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultToken, setResultToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), level }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      setResultToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resultToken) {
    const resultUrl = `/result?t=${resultToken}`;
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">登録完了!</h1>
          <p className="text-gray-600 mb-6">
            大会への参加登録が完了しました。<br />
            以下のリンクから結果を確認できます。
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">あなた専用のURL（大切に保管してください）</p>
            <a
              href={resultUrl}
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {typeof window !== 'undefined' ? window.location.origin : ''}{resultUrl}
            </a>
          </div>
          <a
            href={resultUrl}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            結果ページへ
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-gray-800">スマブラ社内大会</h1>
          <p className="text-gray-600 mt-2">参加登録フォーム</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名前（表示名）
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="例: たろう"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              あなたのレベル
            </label>
            <div className="space-y-2">
              {(Object.entries(LEVELS) as [string, string][]).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    level === Number(value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={value}
                    checked={level === Number(value)}
                    onChange={(e) => setLevel(Number(e.target.value) as LevelValue)}
                    className="sr-only"
                  />
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-bold mr-3">
                    {value}
                  </span>
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? '登録中...' : '参加登録する'}
          </button>
        </form>
      </div>
    </main>
  );
}
