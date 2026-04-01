import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class SetLog extends Model {
  static table = 'set_logs';
  @field('weight') weight!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe!: number;
  @field('is_pr') isPr!: boolean;
  @relation('workout_sessions', 'workout_session_id') workoutSession!: any;
  @relation('exercises', 'exercise_id') exercise!: any;
}
