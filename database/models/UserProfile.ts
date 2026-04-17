import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class UserProfile extends Model {
  static table = 'user_profiles';

  @field('name') name!: string;
  @field('height') height!: number;
  @field('weight') weight!: number;
  @field('unit_preference') unitPreference!: 'imperial' | 'metric';
  @field('deepseek_api_key') deepseekApiKey?: string;
}
