import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';

export default class Routine extends Model {
  static table = 'routines';
  @field('name') name!: string;
  @field('is_preset') isPreset!: boolean;
  @children('routine_days') routineDays!: any;
}
