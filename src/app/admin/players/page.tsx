'use client';

import { useEffect, useState } from 'react';
import { Participant, LEVELS, LevelValue } from '@/types';

export default function PlayersPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/admin/players');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setParticipants(data.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」さんを削除しますか？`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setParticipants((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">🎮</div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        エラー: {error}
      </div>
    );
  }

  const levelCounts = participants.reduce((acc, p) => {
    acc[p.level] = (acc[p.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">参加者一覧</h2>
        <button
          onClick={fetchParticipants}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          更新
        </button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{participants.length}</div>
          <div className="text-sm text-gray-600">合計参加者</div>
        </div>
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{levelCounts[level] || 0}</div>
            <div className="text-xs text-gray-500">Lv.{level} {LEVELS[level as LevelValue]}</div>
          </div>
        ))}
      </div>

      {/* 参加者テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            まだ参加者がいません
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">名前</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">レベル</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">役割</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">登録日時</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Lv.{p.level} {LEVELS[p.level as LevelValue]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_leader && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        👑 リーダー
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(p.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={p.is_leader}
                      title={p.is_leader ? 'リーダーは削除できません' : ''}
                    >
                      {p.is_leader ? '−' : '削除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
