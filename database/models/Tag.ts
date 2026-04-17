import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class Tag extends Model {
  static table = 'tags';
  @field('name') name!: string;
  @field('category') category!: string;
  @field('exercise_id') exerciseId!: string;
  @relation('exercises', 'exercise_id') exercise!: any;
}
