import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type Team = { _id?: string; name: string; mascot: string; members: unknown[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const loadTeams = useCallback(() => getJson<TeamResponse>('/api/teams'), []);
  const resource = useApiResource(loadTeams);

  return (
    <section>
      <h2>Teams</h2>
      <p>Manage teams and members.</p>
      {resource.status === 'loading' && <p role="status">Loading teams...</p>}
      {resource.status === 'error' && <p role="alert">Unable to load teams: {resource.message}</p>}
      {resource.status === 'success' && (resource.data.teams.length === 0
        ? <p>No teams yet.</p>
        : <ul>{resource.data.teams.map((team, index) => (
          <li key={team._id ?? `${team.name}-${index}`}>
            {team.name} — {team.mascot} ({team.members.length} members)
          </li>
        ))}</ul>)}
    </section>
  );
}
