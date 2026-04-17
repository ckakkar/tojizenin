import { database } from './index';
import UserProfile from './models/UserProfile';
import Routine from './models/Routine';
import RoutineDay from './models/RoutineDay';
import RoutineDayExercise from './models/RoutineDayExercise';
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

type ExerciseDef = { name: string; primaryTag: string; secondaryTag?: string };

async function createExercise(
  exercisesCollection: any,
  tagsCollection: any,
  def: ExerciseDef
): Promise<Exercise> {
  const ex = await exercisesCollection.create((e: Exercise) => {
    e.name = def.name;
  });
  await tagsCollection.create((t: Tag) => {
    t.name = def.primaryTag;
    t.category = 'Primary';
    t.exercise.set(ex);
  });
  if (def.secondaryTag) {
    await tagsCollection.create((t: Tag) => {
      t.name = def.secondaryTag!;
      t.category = 'Secondary';
      t.exercise.set(ex);
    });
  }
  return ex;
}

async function linkExercisesToDay(
  junctionCollection: any,
  day: RoutineDay,
  exercises: Exercise[]
) {
  for (const ex of exercises) {
    await junctionCollection.create((r: RoutineDayExercise) => {
      r.routineDay.set(day);
      r.exercise.set(ex);
    });
  }
}

export async function seedPresetRoutines() {
  await database.write(async () => {
    const routinesCol = database.collections.get<Routine>('routines');
    const daysCol = database.collections.get<RoutineDay>('routine_days');
    const exercisesCol = database.collections.get<Exercise>('exercises');
    const tagsCol = database.collections.get<Tag>('tags');
    const junctionCol = database.collections.get<RoutineDayExercise>('routine_day_exercises');

    const ppl = await routinesCol.create((r: Routine) => {
      r.name = 'Push Pull Legs (Preset)';
      r.isPreset = true;
    });

    // Push Day
    const pushDay = await daysCol.create((d: RoutineDay) => {
      d.name = 'Push';
      d.routine.set(ppl);
    });
    const benchPress = await createExercise(exercisesCol, tagsCol, { name: 'Barbell Bench Press', primaryTag: 'Chest', secondaryTag: 'Triceps' });
    const overheadPress = await createExercise(exercisesCol, tagsCol, { name: 'Overhead Press', primaryTag: 'Shoulders', secondaryTag: 'Triceps' });
    const tricepPushdown = await createExercise(exercisesCol, tagsCol, { name: 'Tricep Pushdown', primaryTag: 'Triceps' });
    await linkExercisesToDay(junctionCol, pushDay, [benchPress, overheadPress, tricepPushdown]);

    // Pull Day
    const pullDay = await daysCol.create((d: RoutineDay) => {
      d.name = 'Pull';
      d.routine.set(ppl);
    });
    const barbellRow = await createExercise(exercisesCol, tagsCol, { name: 'Barbell Row', primaryTag: 'Back', secondaryTag: 'Biceps' });
    const pullUp = await createExercise(exercisesCol, tagsCol, { name: 'Pull-up', primaryTag: 'Back', secondaryTag: 'Biceps' });
    const bicepCurl = await createExercise(exercisesCol, tagsCol, { name: 'Barbell Curl', primaryTag: 'Biceps' });
    await linkExercisesToDay(junctionCol, pullDay, [barbellRow, pullUp, bicepCurl]);

    // Legs Day
    const legsDay = await daysCol.create((d: RoutineDay) => {
      d.name = 'Legs';
      d.routine.set(ppl);
    });
    const squat = await createExercise(exercisesCol, tagsCol, { name: 'Barbell Squat', primaryTag: 'Quads', secondaryTag: 'Glutes' });
    const rdl = await createExercise(exercisesCol, tagsCol, { name: 'Romanian Deadlift', primaryTag: 'Hamstrings', secondaryTag: 'Glutes' });
    const legPress = await createExercise(exercisesCol, tagsCol, { name: 'Leg Press', primaryTag: 'Quads' });
    await linkExercisesToDay(junctionCol, legsDay, [squat, rdl, legPress]);
  });
}
