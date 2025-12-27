import { NextRequest, NextResponse } from 'next/server';
import { getAllTeams, getAllParticipants, getTeamById, updateTeam, updateParticipant } from '@/lib/db';

// チーム一覧取得
export async function GET() {
  try {
    const teams = await getAllTeams();
    teams.sort((a, b) => a.name.localeCompare(b.name));
    const participants = await getAllParticipants();
    participants.sort((a, b) => a.name.localeCompare(b.name));

    // チームにリーダー情報を追加
    const teamsWithLeaders = teams.map((team) => {
      const leader = participants.find((p) => p.id === team.leader_id);
      return {
        ...team,
        leader: leader || null,
      };
    });

    return NextResponse.json({
      teams: teamsWithLeaders,
      participants,
    });
  } catch (error) {
    console.error('Teams GET error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// チーム更新（リーダー設定・チーム名変更）
export async function PUT(request: NextRequest) {
  try {
    const { teamId, teamName, leaderId } = await request.json();

    if (!teamId) {
      return NextResponse.json(
        { error: 'チームIDが必要です' },
        { status: 400 }
      );
    }

    // 現在のチーム情報を取得
    const currentTeam = await getTeamById(teamId);

    if (!currentTeam) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }

    // 古いリーダーのフラグを解除
    if (currentTeam.leader_id) {
      await updateParticipant(currentTeam.leader_id, { is_leader: false, team_id: null });
    }

    // 新しいリーダーを設定
    if (leaderId) {
      await updateParticipant(leaderId, { is_leader: true, team_id: teamId });
    }

    // チーム情報を更新
    await updateTeam(teamId, {
      name: teamName,
      leader_id: leaderId || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teams PUT error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
