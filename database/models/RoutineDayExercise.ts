import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class RoutineDayExercise extends Model {
  static table = 'routine_day_exercises';

  @field('routine_day_id') routineDayId!: string;
  @field('exercise_id') exerciseId!: string;

  @relation('routine_days', 'routine_day_id') routineDay!: any;
  @relation('exercises', 'exercise_id') exercise!: any;
}
