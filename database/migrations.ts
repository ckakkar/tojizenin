import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'user_profiles',
          columns: [
            { name: 'deepseek_api_key', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
