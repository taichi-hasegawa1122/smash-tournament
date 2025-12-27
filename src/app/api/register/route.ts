import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addParticipant } from '@/lib/db';
import { Participant, LevelValue } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { name, level } = await request.json();

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '名前を入力してください' },
        { status: 400 }
      );
    }

    if (!level || typeof level !== 'number' || level < 1 || level > 5) {
      return NextResponse.json(
        { error: 'レベルは1〜5で選択してください' },
        { status: 400 }
      );
    }

    // トークン生成（16文字のランダム文字列）
    const token = uuidv4().replace(/-/g, '').substring(0, 16);

    // 参加者を登録
    const participant: Participant = {
      id: uuidv4(),
      name: name.trim(),
      level: level as LevelValue,
      token,
      team_id: null,
      is_leader: false,
      created_at: new Date().toISOString(),
    };

    await addParticipant(participant);

    return NextResponse.json({
      success: true,
      token: participant.token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
