// レベルの定義
export const LEVELS = {
  1: '未経験',
  2: '触ったことある',
  3: 'たまにやる',
  4: 'よくやる',
  5: '上級者',
} as const;

export type LevelValue = 1 | 2 | 3 | 4 | 5;

// 参加者
export interface Participant {
  id: string;
  name: string;
  level: LevelValue;
  token: string;
  team_id: string | null;
  is_leader: boolean;
  created_at: string;
}

// チーム
export interface Team {
  id: string;
  name: string;
  leader_id: string | null;
  created_at: string;
}

// チームとメンバー情報
export interface TeamWithMembers extends Team {
  leader: Participant | null;
  members: Participant[];
  score: number;
  memberCount: number;
}

// アプリ状態
export interface AppState {
  id: number;
  is_assigned: boolean;
  is_published: boolean;
  assigned_at: string | null;
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 登録フォームデータ
export interface RegisterFormData {
  name: string;
  level: LevelValue;
}

// リーダー設定フォームデータ
export interface LeaderFormData {
  teamId: string;
  teamName: string;
  participantId: string | null;
}
