import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class UserProfile extends Model {
  static table = 'user_profiles';

  @field('name') name!: string;
  @field('height') height!: number; // stored in cm or inches depending on preference, but let's store standard base unit (e.g. cm) and convert on UI, or just store what they put
  @field('weight') weight!: number;
  @field('unit_preference') unitPreference!: 'imperial' | 'metric';
}
