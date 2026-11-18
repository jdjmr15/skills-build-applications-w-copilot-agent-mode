import { Activity, Team, User, Workout } from '../models/index.js';
import { isValidObjectId } from 'mongoose';

type InputRecord = Record<string, unknown>;

function isRecord(value: unknown): value is InputRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((member): member is string => (
    typeof member === 'string' && isValidObjectId(member)
  ));
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function normalizeFocus(value: string | undefined) {
  const focus = value?.trim().toLowerCase();
  if (!focus) return undefined;
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'cardio'].includes(focus)) return 'endurance';
  return focus;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !isValidObjectId(userId)) throw httpError(400, 'A valid userId is required');
  if (typeof teamId !== 'string' || !isValidObjectId(teamId)) throw httpError(400, 'A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');
  const { name, mascot } = input;
  const rawMembers = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'A team mascot is required');
  if (!isObjectIdList(rawMembers)) {
    throw httpError(400, 'Members must be an array of valid user IDs');
  }

  const members = rawMembers;
  const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (existingMembers.length !== members.length) throw httpError(404, 'One or more team members were not found');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: string; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = normalizeFocus(user.fitnessGoal);
  const activityFocus = normalizeFocus(recentActivity?.type);
  const focus = workouts.some((workout) => normalizeFocus(workout.focus) === goalFocus)
    ? goalFocus
    : activityFocus ?? goalFocus;
  const reasonBasis = focus && focus === goalFocus
    ? `your ${user.fitnessGoal} goal`
    : recentActivity
      ? `your recent ${recentActivity.type} activity`
      : 'your fitness goal';

  return workouts
    .sort((left, right) => Number(normalizeFocus(right.focus) === focus) - Number(normalizeFocus(left.focus) === focus))
    .map((workout) => ({ ...workout, reason: `Recommended based on ${reasonBasis}.` }));
}

export { User };
