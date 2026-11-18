import { useApiResource } from '../hooks/useApiResource.js';

type WorkoutSuggestion = { _id?: string; title: string; focus: string; minutes: number; reason: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const resource = useApiResource<WorkoutResponse>(
    `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
  );

  return (
    <section>
      <h2>Workout suggestions</h2>
      <p>Recommend workouts from activity patterns.</p>
      {resource.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
      {resource.status === 'error' && <p role="alert">Unable to load workout suggestions: {resource.message}</p>}
      {resource.status === 'success' && (resource.data.suggestions.length === 0
        ? <p>No workout suggestions yet.</p>
        : <ul>{resource.data.suggestions.map((suggestion, index) => (
          <li key={suggestion._id ?? `${suggestion.title}-${index}`}>
            <strong>{suggestion.title}</strong> — {suggestion.focus}, {suggestion.minutes} minutes. {suggestion.reason}
          </li>
        ))}</ul>)}
    </section>
  );
}
