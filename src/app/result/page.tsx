'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LEVELS, Participant, TeamWithMembers, LevelValue } from '@/types';

interface ResultData {
  participant: Participant;
  myTeam: TeamWithMembers | null;
  allTeams: TeamWithMembers[];
  isPublished: boolean;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('URLが無効です');
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/result?t=${token}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'データの取得に失敗しました');
        }

        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎮</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-xl font-bold text-gray-800 mb-4">エラー</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const { participant, myTeam, allTeams, isPublished } = data;

  // 未公開の場合
  if (!isPublished) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">まだ公開されていません</h1>
          <p className="text-gray-600 mb-6">
            チーム編成の結果はまだ公開されていません。<br />
            もうしばらくお待ちください。
          </p>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">あなたの登録情報</p>
            <p className="font-bold text-gray-800">{participant.name}</p>
            <p className="text-sm text-gray-600">
              レベル: {participant.level} ({LEVELS[participant.level as LevelValue]})
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-8">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-2xl font-bold text-gray-800">チーム編成結果</h1>
        </div>

        {/* 自分のチーム（ハイライト） */}
        {myTeam && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-4 border-purple-400">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-600">
                あなたのチーム: {myTeam.name}
              </h2>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                スコア: {myTeam.score}
              </div>
            </div>
            <div className="grid gap-2">
              {myTeam.members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    member.id === participant.id
                      ? 'bg-purple-100 border-2 border-purple-300'
                      : member.is_leader
                      ? 'bg-yellow-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {member.is_leader && <span className="text-lg">👑</span>}
                    {member.id === participant.id && <span className="text-lg">👤</span>}
                    <span className={member.id === participant.id ? 'font-bold' : ''}>
                      {member.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Lv.{member.level} ({LEVELS[member.level as LevelValue]})
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right text-sm text-gray-500">
              メンバー数: {myTeam.memberCount}人
            </div>
          </div>
        )}

        {/* 全チーム一覧 */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">全チーム一覧</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {allTeams.map((team) => (
            <div
              key={team.id}
              className={`bg-white rounded-xl shadow-lg p-4 ${
                myTeam && team.id === myTeam.id ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{team.name}</h3>
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  スコア: {team.score}
                </div>
              </div>
              <div className="space-y-1">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-1">
                      {member.is_leader && <span>👑</span>}
                      {member.name}
                    </span>
                    <span className="text-gray-500">Lv.{member.level}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right text-xs text-gray-400">
                {team.memberCount}人
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎮</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </main>
    }>
      <ResultContent />
    </Suspense>
  );
}
