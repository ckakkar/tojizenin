import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import Exercise from './models/Exercise';
import Tag from './models/Tag';
import Routine from './models/Routine';
import RoutineDay from './models/RoutineDay';
import WorkoutSession from './models/WorkoutSession';
import SetLog from './models/SetLog';
import UserProfile from './models/UserProfile';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  jsi: true,
  onSetUpError: error => {
    // Database failed to load. Provide error handling here.
    console.error("WatermelonDB build error", error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    UserProfile,
    Exercise,
    Tag,
    Routine,
    RoutineDay,
    WorkoutSession,
    SetLog,
  ],
});
