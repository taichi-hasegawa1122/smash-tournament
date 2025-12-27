import { NextRequest, NextResponse } from 'next/server';
import { getAllParticipants, deleteParticipant } from '@/lib/db';

// 参加者一覧取得
export async function GET() {
  try {
    const participants = await getAllParticipants();
    participants.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Players GET error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 参加者削除
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      );
    }

    const deleted = await deleteParticipant(id);

    if (!deleted) {
      return NextResponse.json(
        { error: '参加者が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Players DELETE error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
