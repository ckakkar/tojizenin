import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';

export default class Exercise extends Model {
  static table = 'exercises';

  @field('name') name!: string;
  @children('tags') tags!: any;
}
