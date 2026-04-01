import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'height', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'unit_preference', type: 'string' }, // 'imperial' | 'metric'
      ]
    }),
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
      ]
    }),
    tableSchema({
      name: 'tags',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' }, // e.g. Primary, Secondary, Movement
        { name: 'exercise_id', type: 'string', isIndexed: true }
      ]
    }),
    tableSchema({
      name: 'routines',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'is_preset', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'routine_days',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'routine_id', type: 'string', isIndexed: true }
      ]
    }),
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'routine_day_id', type: 'string', isIndexed: true }
      ]
    }),
    tableSchema({
      name: 'set_logs',
      columns: [
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'is_pr', type: 'boolean' },
        { name: 'workout_session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true }
      ]
    })
  ]
})
