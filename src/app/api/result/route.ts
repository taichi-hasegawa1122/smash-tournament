import { NextRequest, NextResponse } from 'next/server';
import { getParticipantByToken, getAllParticipants, getAllTeams, getAppState } from '@/lib/db';
import { TeamWithMembers } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('t');

    if (!token) {
      return NextResponse.json(
        { error: 'トークンが必要です' },
        { status: 400 }
      );
    }

    // 参加者を取得
    const participant = getParticipantByToken(token);

    if (!participant) {
      return NextResponse.json(
        { error: '参加者が見つかりません' },
        { status: 404 }
      );
    }

    // アプリ状態を取得
    const appState = getAppState();
    const isPublished = appState.is_published;

    // 未公開の場合は参加者情報のみ返す
    if (!isPublished) {
      return NextResponse.json({
        participant,
        myTeam: null,
        allTeams: [],
        isPublished: false,
      });
    }

    // チームとメンバーを取得
    const teams = getAllTeams();
    const allParticipants = getAllParticipants();

    // チームごとにメンバーを整理
    const teamsWithMembers: TeamWithMembers[] = teams.map((team) => {
      const members = allParticipants
        .filter((p) => p.team_id === team.id)
        .sort((a, b) => {
          if (a.is_leader !== b.is_leader) return a.is_leader ? -1 : 1;
          return b.level - a.level;
        });
      const score = members.reduce((sum, m) => sum + m.level, 0);

      return {
        ...team,
        leader: members.find((m) => m.is_leader) || null,
        members,
        score,
        memberCount: members.length,
      };
    });

    // 自分のチームを特定
    const myTeam = teamsWithMembers.find(
      (team) => team.members.some((m) => m.id === participant.id)
    ) || null;

    return NextResponse.json({
      participant,
      myTeam,
      allTeams: teamsWithMembers,
      isPublished: true,
    });
  } catch (error) {
    console.error('Result API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
