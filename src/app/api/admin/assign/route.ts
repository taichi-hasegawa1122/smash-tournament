import { NextResponse } from 'next/server';
import { getAllTeams, getAllParticipants, getAppState, bulkUpdateParticipants, updateAppState, resetAssignments } from '@/lib/db';
import { assignTeams, generatePreview } from '@/lib/assignment';

// プレビュー取得
export async function GET() {
  try {
    const teams = getAllTeams().sort((a, b) => a.name.localeCompare(b.name));
    const participants = getAllParticipants();
    const appState = getAppState();

    // リーダーが4人設定されているか確認
    const leaders = participants.filter((p) => p.is_leader);
    if (leaders.length < 4) {
      return NextResponse.json({
        error: 'リーダーが4人設定されていません',
        leadersCount: leaders.length,
        teams: [],
        stats: null,
        isAssigned: false,
        isPublished: false,
      });
    }

    // 既に確定済みの場合は現在の編成を返す
    if (appState.is_assigned) {
      const teamsWithMembers = teams.map((team) => {
        const members = participants
          .filter((p) => p.team_id === team.id)
          .sort((a, b) => {
            if (a.is_leader !== b.is_leader) return a.is_leader ? -1 : 1;
            return b.level - a.level;
          });
        const score = members.reduce((sum, m) => sum + m.level, 0);
        return {
          id: team.id,
          name: team.name,
          members,
          score,
          memberCount: members.length,
        };
      });

      const scores = teamsWithMembers.map((t) => t.score);
      const memberCounts = teamsWithMembers.map((t) => t.memberCount);

      return NextResponse.json({
        teams: teamsWithMembers,
        stats: {
          totalParticipants: participants.length,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          scoreDiff: Math.max(...scores) - Math.min(...scores),
          maxMembers: Math.max(...memberCounts),
          minMembers: Math.min(...memberCounts),
          memberDiff: Math.max(...memberCounts) - Math.min(...memberCounts),
        },
        isAssigned: true,
        isPublished: appState.is_published,
      });
    }

    // 編成を実行（プレビュー）
    const assignments = assignTeams(teams, participants);
    const preview = generatePreview(teams, participants, assignments);

    return NextResponse.json({
      ...preview,
      isAssigned: false,
      isPublished: false,
    });
  } catch (error) {
    console.error('Assign GET error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 編成を確定
export async function POST() {
  try {
    const teams = getAllTeams();
    const participants = getAllParticipants();

    // リーダーが4人設定されているか確認
    const leaders = participants.filter((p) => p.is_leader);
    if (leaders.length < 4) {
      return NextResponse.json(
        { error: 'リーダーが4人設定されていません' },
        { status: 400 }
      );
    }

    // 編成を実行
    const assignments = assignTeams(teams, participants);

    // データベースを更新
    const updates: { id: string; team_id: string }[] = [];
    for (const [teamId, memberIds] of assignments) {
      for (const memberId of memberIds) {
        updates.push({ id: memberId, team_id: teamId });
      }
    }
    bulkUpdateParticipants(updates);

    // アプリ状態を更新
    updateAppState({
      is_assigned: true,
      assigned_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assign POST error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 編成をリセット
export async function DELETE() {
  try {
    resetAssignments();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assign DELETE error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
