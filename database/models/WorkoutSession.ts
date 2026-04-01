import { Model } from '@nozbe/watermelondb';
import { relation, children, date } from '@nozbe/watermelondb/decorators';

export default class WorkoutSession extends Model {
  static table = 'workout_sessions';
  @date('created_at') createdAt!: Date;
  @relation('routine_days', 'routine_day_id') routineDay!: any;
  @children('set_logs') setLogs!: any;
}
