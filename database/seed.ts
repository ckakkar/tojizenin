import { database } from './index';
import UserProfile from './models/UserProfile';
import Routine from './models/Routine';
import RoutineDay from './models/RoutineDay';
import Exercise from './models/Exercise';
import Tag from './models/Tag';

export async function resetDatabase() {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

export async function hasUserProfile(): Promise<boolean> {
  const count = await database.collections.get<UserProfile>('user_profiles').query().fetchCount();
  return count > 0;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const profiles = await database.collections.get<UserProfile>('user_profiles').query().fetch();
  return profiles.length > 0 ? profiles[0] : null;
}

export async function saveUserProfile(name: string, height: number, weight: number, unitPreference: 'imperial' | 'metric') {
  await database.write(async () => {
    await database.collections.get<UserProfile>('user_profiles').create((profile) => {
      profile.name = name;
      profile.height = height;
      profile.weight = weight;
      profile.unitPreference = unitPreference;
    });
  });
}

export async function seedPresetRoutines() {
  await database.write(async () => {
    // Basic PPL Setup
    const routinesCollection = database.collections.get<Routine>('routines');
    const daysCollection = database.collections.get<RoutineDay>('routine_days');
    const exercisesCollection = database.collections.get<Exercise>('exercises');
    const tagsCollection = database.collections.get<Tag>('tags');

    const ppl = await routinesCollection.create((routine) => {
      routine.name = 'Push Pull Legs (Preset)';
      routine.isPreset = true;
    });

    const pushDay = await daysCollection.create((day) => {
      day.name = 'Push';
      day.routine.set(ppl);
    });

    // Create a base exercise
    const benchPress = await exercisesCollection.create((exercise) => {
      exercise.name = 'Barbell Bench Press';
    });
    await tagsCollection.create((tag) => {
      tag.name = 'Chest';
      tag.category = 'Primary';
      tag.exercise.set(benchPress);
    });
  });
}
