import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const loadActivities = useCallback(() => getJson<ActivityResponse>('/api/activities'), []);
  const resource = useApiResource(loadActivities);

  return (
    <section>
      <h2>Activities</h2>
      <p>Track student activity minutes and points.</p>
      {resource.status === 'loading' && <p role="status">Loading activities...</p>}
      {resource.status === 'error' && <p role="alert">Unable to load activities: {resource.message}</p>}
      {resource.status === 'success' && (resource.data.activities.length === 0
        ? <p>No activities yet.</p>
        : <ul>{resource.data.activities.map((activity, index) => (
          <li key={activity._id ?? `${activity.type}-${index}`}>
            {activity.type}: {activity.minutes} minutes, {activity.points} points
          </li>
        ))}</ul>)}
    </section>
  );
}
