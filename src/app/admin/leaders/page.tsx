'use client';

import { useEffect, useState } from 'react';
import { Participant, Team, LEVELS, LevelValue } from '@/types';

interface TeamWithLeader extends Team {
  leader: Participant | null;
}

export default function LeadersPage() {
  const [teams, setTeams] = useState<TeamWithLeader[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setTeams(data.teams);
      setParticipants(data.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (teamId: string, teamName: string, leaderId: string | null) => {
    setSaving(teamId);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, teamName, leaderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // データを再取得
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSaving(null);
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

  // リーダーに設定されている参加者のID一覧
  const leaderIds = teams.map((t) => t.leader_id).filter(Boolean);

  // 選択可能な参加者（リーダーでない人）
  const availableParticipants = participants.filter(
    (p) => !leaderIds.includes(p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">リーダー設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            各チームのリーダーとチーム名を設定してください
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            availableParticipants={availableParticipants}
            currentLeader={team.leader}
            onUpdate={handleUpdate}
            isSaving={saving === team.id}
          />
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>注意:</strong> リーダーはチーム編成時に自動的にそのチームに配置されます。
          リーダーのレベルもチームスコアに含まれます。
        </p>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  availableParticipants,
  currentLeader,
  onUpdate,
  isSaving,
}: {
  team: TeamWithLeader;
  availableParticipants: Participant[];
  currentLeader: Participant | null;
  onUpdate: (teamId: string, teamName: string, leaderId: string | null) => void;
  isSaving: boolean;
}) {
  const [teamName, setTeamName] = useState(team.name);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(
    team.leader_id || ''
  );

  const hasChanges =
    teamName !== team.name || selectedLeaderId !== (team.leader_id || '');

  const handleSave = () => {
    onUpdate(team.id, teamName, selectedLeaderId || null);
  };

  // 選択可能なリーダー（現在のリーダー + 未割当の参加者）
  const selectableParticipants = currentLeader
    ? [currentLeader, ...availableParticipants]
    : availableParticipants;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チーム名
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="チーム名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            👑 リーダー
          </label>
          <select
            value={selectedLeaderId}
            onChange={(e) => setSelectedLeaderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">未設定</option>
            {selectableParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Lv.{p.level} {LEVELS[p.level as LevelValue]})
              </option>
            ))}
          </select>
        </div>

        {currentLeader && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              現在のリーダー:{' '}
              <span className="font-medium">{currentLeader.name}</span>
              <span className="ml-2 text-gray-500">
                Lv.{currentLeader.level}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {isSaving ? '保存中...' : hasChanges ? '保存' : '変更なし'}
        </button>
      </div>
    </div>
  );
}
