import { sql } from '@vercel/postgres';
import { Participant, Team, AppState, LevelValue } from '@/types';

// 初期化（テーブル作成 + 初期データ）
export async function initializeDatabase() {
  // テーブル作成
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      leader_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      level SMALLINT NOT NULL,
      token VARCHAR(50) UNIQUE NOT NULL,
      team_id VARCHAR(50) REFERENCES teams(id),
      is_leader BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      is_assigned BOOLEAN DEFAULT FALSE,
      is_published BOOLEAN DEFAULT FALSE,
      assigned_at TIMESTAMP
    )
  `;

  // 初期データ確認・挿入
  const { rows: existingTeams } = await sql`SELECT COUNT(*) as count FROM teams`;
  if (Number(existingTeams[0].count) === 0) {
    // チーム作成
    await sql`INSERT INTO teams (id, name, leader_id) VALUES ('team-komai', 'チームこまい', 'leader-komai')`;
    await sql`INSERT INTO teams (id, name, leader_id) VALUES ('team-nagi', 'チームなぎ', 'leader-nagi')`;
    await sql`INSERT INTO teams (id, name, leader_id) VALUES ('team-kazuma', 'チームかずま', 'leader-kazuma')`;
    await sql`INSERT INTO teams (id, name, leader_id) VALUES ('team-muramatsu', 'チームむらまつ', 'leader-muramatsu')`;

    // リーダー作成
    await sql`INSERT INTO participants (id, name, level, token, team_id, is_leader) VALUES ('leader-komai', 'こまい', 5, 'leader-komai-token', 'team-komai', true)`;
    await sql`INSERT INTO participants (id, name, level, token, team_id, is_leader) VALUES ('leader-nagi', 'なぎ', 5, 'leader-nagi-token', 'team-nagi', true)`;
    await sql`INSERT INTO participants (id, name, level, token, team_id, is_leader) VALUES ('leader-kazuma', 'かずま', 5, 'leader-kazuma-token', 'team-kazuma', true)`;
    await sql`INSERT INTO participants (id, name, level, token, team_id, is_leader) VALUES ('leader-muramatsu', 'むらまつ', 5, 'leader-muramatsu-token', 'team-muramatsu', true)`;
  }

  const { rows: existingState } = await sql`SELECT COUNT(*) as count FROM app_state`;
  if (Number(existingState[0].count) === 0) {
    await sql`INSERT INTO app_state (id, is_assigned, is_published) VALUES (1, false, false)`;
  }
}

// 参加者操作
export async function getAllParticipants(): Promise<Participant[]> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM participants ORDER BY created_at DESC`;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    level: row.level as LevelValue,
    token: row.token,
    team_id: row.team_id,
    is_leader: row.is_leader,
    created_at: row.created_at?.toISOString() || new Date().toISOString(),
  }));
}

export async function getParticipantByToken(token: string): Promise<Participant | undefined> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM participants WHERE token = ${token}`;
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    level: row.level as LevelValue,
    token: row.token,
    team_id: row.team_id,
    is_leader: row.is_leader,
    created_at: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getParticipantById(id: string): Promise<Participant | undefined> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM participants WHERE id = ${id}`;
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    level: row.level as LevelValue,
    token: row.token,
    team_id: row.team_id,
    is_leader: row.is_leader,
    created_at: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function addParticipant(participant: Participant): Promise<Participant> {
  await initializeDatabase();
  await sql`
    INSERT INTO participants (id, name, level, token, team_id, is_leader)
    VALUES (${participant.id}, ${participant.name}, ${participant.level}, ${participant.token}, ${participant.team_id}, ${participant.is_leader})
  `;
  return participant;
}

export async function updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
  await initializeDatabase();
  const current = await getParticipantById(id);
  if (!current) return null;

  const updated = { ...current, ...updates };
  await sql`
    UPDATE participants
    SET name = ${updated.name}, level = ${updated.level}, token = ${updated.token},
        team_id = ${updated.team_id}, is_leader = ${updated.is_leader}
    WHERE id = ${id}
  `;
  return updated;
}

export async function deleteParticipant(id: string): Promise<boolean> {
  await initializeDatabase();
  const result = await sql`DELETE FROM participants WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

// チーム操作
export async function getAllTeams(): Promise<Team[]> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM teams ORDER BY name`;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    leader_id: row.leader_id,
    created_at: row.created_at?.toISOString() || new Date().toISOString(),
  }));
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM teams WHERE id = ${id}`;
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    leader_id: row.leader_id,
    created_at: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
  await initializeDatabase();
  const current = await getTeamById(id);
  if (!current) return null;

  const updated = { ...current, ...updates };
  await sql`
    UPDATE teams
    SET name = ${updated.name}, leader_id = ${updated.leader_id}
    WHERE id = ${id}
  `;
  return updated;
}

// アプリ状態操作
export async function getAppState(): Promise<AppState> {
  await initializeDatabase();
  const { rows } = await sql`SELECT * FROM app_state WHERE id = 1`;
  if (rows.length === 0) {
    return { id: 1, is_assigned: false, is_published: false, assigned_at: null };
  }
  const row = rows[0];
  return {
    id: 1,
    is_assigned: row.is_assigned,
    is_published: row.is_published,
    assigned_at: row.assigned_at?.toISOString() || null,
  };
}

export async function updateAppState(updates: Partial<AppState>): Promise<AppState> {
  await initializeDatabase();
  const current = await getAppState();
  const updated = { ...current, ...updates };
  await sql`
    UPDATE app_state
    SET is_assigned = ${updated.is_assigned}, is_published = ${updated.is_published}, assigned_at = ${updated.assigned_at}
    WHERE id = 1
  `;
  return updated;
}

// バルク更新
export async function bulkUpdateParticipants(updates: { id: string; team_id: string }[]): Promise<void> {
  await initializeDatabase();
  for (const update of updates) {
    await sql`UPDATE participants SET team_id = ${update.team_id} WHERE id = ${update.id}`;
  }
}

// リセット
export async function resetAssignments(): Promise<void> {
  await initializeDatabase();
  await sql`UPDATE participants SET team_id = NULL WHERE is_leader = false`;
  await sql`UPDATE app_state SET is_assigned = false, is_published = false, assigned_at = NULL WHERE id = 1`;
}
