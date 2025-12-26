import fs from 'fs';
import path from 'path';
import { Participant, Team, AppState } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface Database {
  participants: Participant[];
  teams: Team[];
  appState: AppState;
}

function getDefaultData(): Database {
  const now = new Date().toISOString();

  // リーダー4人の初期データ
  const leaders: Participant[] = [
    { id: 'leader-komai', name: 'こまい', level: 5, token: 'leader-komai-token', team_id: 'team-komai', is_leader: true, created_at: now },
    { id: 'leader-nagi', name: 'なぎ', level: 5, token: 'leader-nagi-token', team_id: 'team-nagi', is_leader: true, created_at: now },
    { id: 'leader-kazuma', name: 'かずま', level: 5, token: 'leader-kazuma-token', team_id: 'team-kazuma', is_leader: true, created_at: now },
    { id: 'leader-muramatsu', name: 'むらまつ', level: 5, token: 'leader-muramatsu-token', team_id: 'team-muramatsu', is_leader: true, created_at: now },
  ];

  return {
    participants: leaders,
    teams: [
      { id: 'team-komai', name: 'チームこまい', leader_id: 'leader-komai', created_at: now },
      { id: 'team-nagi', name: 'チームなぎ', leader_id: 'leader-nagi', created_at: now },
      { id: 'team-kazuma', name: 'チームかずま', leader_id: 'leader-kazuma', created_at: now },
      { id: 'team-muramatsu', name: 'チームむらまつ', leader_id: 'leader-muramatsu', created_at: now },
    ],
    appState: {
      id: 1,
      is_assigned: false,
      is_published: false,
      assigned_at: null,
    },
  };
}

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readDB(): Database {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading DB:', error);
  }
  return getDefaultData();
}

export function writeDB(data: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// 参加者操作
export function getAllParticipants(): Participant[] {
  return readDB().participants;
}

export function getParticipantByToken(token: string): Participant | undefined {
  return readDB().participants.find(p => p.token === token);
}

export function getParticipantById(id: string): Participant | undefined {
  return readDB().participants.find(p => p.id === id);
}

export function addParticipant(participant: Participant): Participant {
  const db = readDB();
  db.participants.push(participant);
  writeDB(db);
  return participant;
}

export function updateParticipant(id: string, updates: Partial<Participant>): Participant | null {
  const db = readDB();
  const index = db.participants.findIndex(p => p.id === id);
  if (index === -1) return null;

  db.participants[index] = { ...db.participants[index], ...updates };
  writeDB(db);
  return db.participants[index];
}

export function deleteParticipant(id: string): boolean {
  const db = readDB();
  const initialLength = db.participants.length;
  db.participants = db.participants.filter(p => p.id !== id);
  if (db.participants.length !== initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

// チーム操作
export function getAllTeams(): Team[] {
  return readDB().teams;
}

export function getTeamById(id: string): Team | undefined {
  return readDB().teams.find(t => t.id === id);
}

export function updateTeam(id: string, updates: Partial<Team>): Team | null {
  const db = readDB();
  const index = db.teams.findIndex(t => t.id === id);
  if (index === -1) return null;

  db.teams[index] = { ...db.teams[index], ...updates };
  writeDB(db);
  return db.teams[index];
}

// アプリ状態操作
export function getAppState(): AppState {
  return readDB().appState;
}

export function updateAppState(updates: Partial<AppState>): AppState {
  const db = readDB();
  db.appState = { ...db.appState, ...updates };
  writeDB(db);
  return db.appState;
}

// バルク更新
export function bulkUpdateParticipants(updates: { id: string; team_id: string }[]): void {
  const db = readDB();
  for (const update of updates) {
    const index = db.participants.findIndex(p => p.id === update.id);
    if (index !== -1) {
      db.participants[index].team_id = update.team_id;
    }
  }
  writeDB(db);
}

// リセット
export function resetAssignments(): void {
  const db = readDB();
  // リーダー以外のチーム割り当てをリセット
  db.participants = db.participants.map(p => ({
    ...p,
    team_id: p.is_leader ? p.team_id : null,
  }));
  db.appState.is_assigned = false;
  db.appState.is_published = false;
  db.appState.assigned_at = null;
  writeDB(db);
}
