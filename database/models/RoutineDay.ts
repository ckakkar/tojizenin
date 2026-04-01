import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class RoutineDay extends Model {
  static table = 'routine_days';
  @field('name') name!: string;
  @relation('routines', 'routine_id') routine!: any;
}
