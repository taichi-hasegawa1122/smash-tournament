import { Participant, Team } from '@/types';

interface TeamState {
  id: string;
  name: string;
  members: Participant[];
  score: number;
}

/**
 * チーム編成アルゴリズム
 *
 * 1. リーダーをチームに固定して初期化
 * 2. リーダー以外の参加者をレベル高い順に並べる
 * 3. 上から順に、毎回：
 *    - 人数が少ないチームを優先
 *    - 同数ならスコア合計が低いチームへ入れる
 *    - それも同じならランダム
 */
export function assignTeams(
  teams: Team[],
  participants: Participant[]
): Map<string, string[]> {
  // チーム状態を初期化
  const teamStates: TeamState[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    members: [],
    score: 0,
  }));

  // リーダーを各チームに配置
  const leaders = participants.filter((p) => p.is_leader);
  for (const leader of leaders) {
    const teamState = teamStates.find((t) => t.id === leader.team_id);
    if (teamState) {
      teamState.members.push(leader);
      teamState.score += leader.level;
    }
  }

  // リーダー以外の参加者を抽出し、レベル高い順にソート
  const nonLeaders = participants
    .filter((p) => !p.is_leader)
    .sort((a, b) => b.level - a.level);

  // 参加者を順番に割り当て
  for (const participant of nonLeaders) {
    // 最適なチームを選択
    const bestTeam = selectBestTeam(teamStates);
    bestTeam.members.push(participant);
    bestTeam.score += participant.level;
  }

  // 結果をMapで返す（チームID -> 参加者ID配列）
  const result = new Map<string, string[]>();
  for (const teamState of teamStates) {
    result.set(
      teamState.id,
      teamState.members.map((m) => m.id)
    );
  }

  return result;
}

/**
 * 最適なチームを選択
 * 1. 人数が最も少ないチーム
 * 2. 同数ならスコアが最も低いチーム
 * 3. それも同じならランダム
 */
function selectBestTeam(teamStates: TeamState[]): TeamState {
  // 人数でソート（昇順）
  const sortedByCount = [...teamStates].sort(
    (a, b) => a.members.length - b.members.length
  );

  // 最小人数を持つチームを抽出
  const minCount = sortedByCount[0].members.length;
  const minCountTeams = sortedByCount.filter(
    (t) => t.members.length === minCount
  );

  if (minCountTeams.length === 1) {
    return minCountTeams[0];
  }

  // スコアでソート（昇順）
  const sortedByScore = [...minCountTeams].sort((a, b) => a.score - b.score);

  // 最小スコアを持つチームを抽出
  const minScore = sortedByScore[0].score;
  const minScoreTeams = sortedByScore.filter((t) => t.score === minScore);

  if (minScoreTeams.length === 1) {
    return minScoreTeams[0];
  }

  // ランダムに選択
  const randomIndex = Math.floor(Math.random() * minScoreTeams.length);
  return minScoreTeams[randomIndex];
}

/**
 * 編成結果のプレビュー情報を生成
 */
export interface AssignmentPreview {
  teams: {
    id: string;
    name: string;
    members: Participant[];
    score: number;
    memberCount: number;
  }[];
  stats: {
    totalParticipants: number;
    maxScore: number;
    minScore: number;
    scoreDiff: number;
    maxMembers: number;
    minMembers: number;
    memberDiff: number;
  };
}

export function generatePreview(
  teams: Team[],
  participants: Participant[],
  assignments: Map<string, string[]>
): AssignmentPreview {
  const teamPreviews = teams.map((team) => {
    const memberIds = assignments.get(team.id) || [];
    const members = memberIds
      .map((id) => participants.find((p) => p.id === id)!)
      .filter(Boolean)
      .sort((a, b) => {
        // リーダーを先頭に、次にレベル順
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

  const scores = teamPreviews.map((t) => t.score);
  const memberCounts = teamPreviews.map((t) => t.memberCount);

  return {
    teams: teamPreviews,
    stats: {
      totalParticipants: participants.length,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      scoreDiff: Math.max(...scores) - Math.min(...scores),
      maxMembers: Math.max(...memberCounts),
      minMembers: Math.min(...memberCounts),
      memberDiff: Math.max(...memberCounts) - Math.min(...memberCounts),
    },
  };
}
