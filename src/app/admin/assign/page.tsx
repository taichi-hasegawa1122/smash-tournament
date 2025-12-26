'use client';

import { useEffect, useState } from 'react';
import { Participant, LEVELS, LevelValue } from '@/types';

interface TeamPreview {
  id: string;
  name: string;
  members: Participant[];
  score: number;
  memberCount: number;
}

interface Stats {
  totalParticipants: number;
  maxScore: number;
  minScore: number;
  scoreDiff: number;
  maxMembers: number;
  minMembers: number;
  memberDiff: number;
}

interface AssignmentData {
  teams: TeamPreview[];
  stats: Stats | null;
  isAssigned: boolean;
  isPublished: boolean;
  error?: string;
  leadersCount?: number;
}

export default function AssignPage() {
  const [data, setData] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/assign');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async () => {
    if (!confirm('編成を確定しますか？確定後も再編成は可能です。')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/assign', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '確定に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('編成をリセットしますか？公開も解除されます。')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/assign', { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'リセットに失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (publish: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshPreview = async () => {
    setLoading(true);
    // リセットしてから再取得することで新しいプレビューを生成
    if (data?.isAssigned) {
      await handleReset();
    }
    await fetchData();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">🎮</div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        データの取得に失敗しました
      </div>
    );
  }

  // リーダーが足りない場合
  if (data.error && data.leadersCount !== undefined) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">チーム編成</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">👑</div>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            リーダーが不足しています
          </h3>
          <p className="text-yellow-700 mb-4">
            現在 {data.leadersCount} / 4 人のリーダーが設定されています。
            <br />
            編成を行うには4人のリーダーを設定してください。
          </p>
          <a
            href="/admin/leaders"
            className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition"
          >
            リーダー設定へ
          </a>
        </div>
      </div>
    );
  }

  const { teams, stats, isAssigned, isPublished } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">チーム編成</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isAssigned
              ? isPublished
                ? '編成済み・公開中'
                : '編成済み・未公開'
              : 'プレビュー表示中'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isAssigned && (
            <button
              onClick={handleRefreshPreview}
              disabled={actionLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              プレビュー更新
            </button>
          )}
        </div>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="参加者数"
            value={stats.totalParticipants}
            unit="人"
          />
          <StatCard
            label="スコア差"
            value={stats.scoreDiff}
            unit=""
            highlight={stats.scoreDiff <= 2}
          />
          <StatCard
            label="人数差"
            value={stats.memberDiff}
            unit="人"
            highlight={stats.memberDiff <= 1}
          />
          <StatCard
            label="スコア範囲"
            value={`${stats.minScore}-${stats.maxScore}`}
            unit=""
          />
        </div>
      )}

      {/* チーム一覧 */}
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-gray-800">{team.name}</h3>
              <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  スコア: {team.score}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                  {team.memberCount}人
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    member.is_leader ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {member.is_leader && <span>👑</span>}
                    <span className="font-medium">{member.name}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Lv.{member.level} ({LEVELS[member.level as LevelValue]})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h3 className="font-bold text-gray-800">操作</h3>

        <div className="flex flex-wrap gap-3">
          {!isAssigned ? (
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {actionLoading ? '処理中...' : '編成を確定'}
            </button>
          ) : (
            <>
              {!isPublished ? (
                <button
                  onClick={() => handlePublish(true)}
                  disabled={actionLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  {actionLoading ? '処理中...' : '結果を公開する'}
                </button>
              ) : (
                <button
                  onClick={() => handlePublish(false)}
                  disabled={actionLoading}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 transition"
                >
                  {actionLoading ? '処理中...' : '公開を取り消す'}
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={actionLoading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {actionLoading ? '処理中...' : '編成をリセット'}
              </button>
            </>
          )}
        </div>

        {isAssigned && !isPublished && (
          <p className="text-sm text-gray-600">
            「結果を公開する」を押すと、参加者が結果ページで自分のチームを確認できるようになります。
          </p>
        )}

        {isPublished && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ 結果は公開中です。参加者は自分の専用URLから結果を確認できます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number | string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg shadow p-4 text-center ${
        highlight ? 'bg-green-50 border border-green-200' : 'bg-white'
      }`}
    >
      <div
        className={`text-2xl font-bold ${
          highlight ? 'text-green-600' : 'text-gray-700'
        }`}
      >
        {value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
