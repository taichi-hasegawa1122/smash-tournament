import { NextRequest, NextResponse } from 'next/server';
import { getAppState, updateAppState } from '@/lib/db';

// 公開状態を取得
export async function GET() {
  try {
    const appState = getAppState();

    return NextResponse.json({
      isAssigned: appState.is_assigned,
      isPublished: appState.is_published,
    });
  } catch (error) {
    console.error('Publish GET error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 公開/非公開を切り替え
export async function POST(request: NextRequest) {
  try {
    const { publish } = await request.json();

    // 公開する場合は編成が確定済みか確認
    if (publish) {
      const appState = getAppState();

      if (!appState.is_assigned) {
        return NextResponse.json(
          { error: '編成が確定されていません' },
          { status: 400 }
        );
      }
    }

    updateAppState({ is_published: publish });

    return NextResponse.json({ success: true, isPublished: publish });
  } catch (error) {
    console.error('Publish POST error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
