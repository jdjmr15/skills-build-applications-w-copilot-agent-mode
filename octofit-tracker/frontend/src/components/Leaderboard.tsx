import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const loadLeaderboard = useCallback(() => getJson<LeaderboardResponse>('/api/leaderboard'), []);
  const resource = useApiResource(loadLeaderboard);

  return (
    <section>
      <h2>Leaderboard</h2>
      <p>Compare team point totals.</p>
      {resource.status === 'loading' && <p role="status">Loading leaderboard...</p>}
      {resource.status === 'error' && <p role="alert">Unable to load leaderboard: {resource.message}</p>}
      {resource.status === 'success' && (resource.data.leaderboard.length === 0
        ? <p>No leaderboard rankings yet.</p>
        : <ol>{resource.data.leaderboard.map((entry) => (
          <li key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>
        ))}</ol>)}
    </section>
  );
}
