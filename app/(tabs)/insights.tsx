import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database/index';
import { getUserProfile } from '../../database/seed';
import UserProfile from '../../database/models/UserProfile';
import Exercise from '../../database/models/Exercise';
import RoutineDayExercise from '../../database/models/RoutineDayExercise';
import SetLog from '../../database/models/SetLog';
import WorkoutSession from '../../database/models/WorkoutSession';
import Tag from '../../database/models/Tag';
import { Skeleton } from '../../components/Skeleton';

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

interface SessionPoint {
  date: Date;
  e1rm: number;
  weight: number;
  reps: number;
}

interface ExerciseSummary {
  name: string;
  muscles: string;
  sessions: SessionPoint[];
}

async function gatherExerciseSummaries(profile: UserProfile): Promise<ExerciseSummary[]> {
  const unit = profile.unitPreference === 'metric' ? 'kg' : 'lbs';

  // All exercises in the user's routines (via junction table)
  const junctions = await database.collections
    .get<RoutineDayExercise>('routine_day_exercises')
    .query()
    .fetch();

  const exerciseIds = [...new Set(junctions.map(j => j.exerciseId))];
  if (exerciseIds.length === 0) return [];

  const [exercises, allTags, allSetLogs] = await Promise.all([
    database.collections.get<Exercise>('exercises')
      .query(Q.where('id', Q.oneOf(exerciseIds)))
      .fetch(),
    database.collections.get<Tag>('tags')
      .query(Q.where('exercise_id', Q.oneOf(exerciseIds)))
      .fetch(),
    database.collections.get<SetLog>('set_logs')
      .query(Q.where('exercise_id', Q.oneOf(exerciseIds)))
      .fetch(),
  ]);

  // Build tag map: exercise_id → "Primary · Secondary"
  const tagsByExercise = new Map<string, Tag[]>();
  for (const tag of allTags) {
    const list = tagsByExercise.get(tag.exerciseId) ?? [];
    list.push(tag);
    tagsByExercise.set(tag.exerciseId, list);
  }

  // Load workout sessions for all set logs
  const sessionIds = [...new Set(allSetLogs.map(l => l.workoutSessionId))];
  const sessions = sessionIds.length > 0
    ? await database.collections.get<WorkoutSession>('workout_sessions')
        .query(Q.where('id', Q.oneOf(sessionIds)))
        .fetch()
    : [];
  const sessionMap = new Map(sessions.map(s => [s.id, s]));

  // Group logs by exercise
  const logsByExercise = new Map<string, SetLog[]>();
  for (const log of allSetLogs) {
    const list = logsByExercise.get(log.exerciseId) ?? [];
    list.push(log);
    logsByExercise.set(log.exerciseId, list);
  }

  return exercises.map(ex => {
    const tags = tagsByExercise.get(ex.id) ?? [];
    const primary = tags.find(t => t.category === 'Primary')?.name ?? '';
    const secondary = tags.find(t => t.category === 'Secondary')?.name;
    const muscles = secondary ? `${primary} · ${secondary}` : primary;

    const logs = logsByExercise.get(ex.id) ?? [];

    // Group by session, keep best 1RM per session
    const bestBySession = new Map<string, SessionPoint>();
    for (const log of logs) {
      const session = sessionMap.get(log.workoutSessionId);
      if (!session) continue;
      const e1rm = log.weight * (1 + log.reps / 30);
      const existing = bestBySession.get(log.workoutSessionId);
      if (!existing || e1rm > existing.e1rm) {
        bestBySession.set(log.workoutSessionId, {
          date: new Date(session.createdAt),
          e1rm,
          weight: log.weight,
          reps: log.reps,
        });
      }
    }

    const sessionPoints = Array.from(bestBySession.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return { name: ex.name, muscles, sessions: sessionPoints };
  });
}

function buildPrompt(profile: UserProfile, summaries: ExerciseSummary[]): string {
  const unit = profile.unitPreference === 'metric' ? 'kg' : 'lbs';
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let block = '';
  summaries.forEach((ex, i) => {
    block += `${i + 1}. ${ex.name} (${ex.muscles})\n`;
    if (ex.sessions.length === 0) {
      block += `   → Not yet logged\n\n`;
      return;
    }
    const first = ex.sessions[0];
    const last = ex.sessions[ex.sessions.length - 1];
    const progress = ((last.e1rm - first.e1rm) / first.e1rm) * 100;
    block += `   Sessions logged: ${ex.sessions.length}\n`;
    if (ex.sessions.length === 1) {
      block += `   Only session (${fmt(first.date)}): ${first.weight}${unit} × ${first.reps} → 1RM ${first.e1rm.toFixed(1)}${unit}\n`;
    } else {
      block += `   Start  (${fmt(first.date)}): ${first.weight}${unit} × ${first.reps} → 1RM ${first.e1rm.toFixed(1)}${unit}\n`;
      block += `   Latest (${fmt(last.date)}):  ${last.weight}${unit} × ${last.reps} → 1RM ${last.e1rm.toFixed(1)}${unit}\n`;
      block += `   Change: ${progress >= 0 ? '+' : ''}${progress.toFixed(1)}%\n`;
    }
    block += '\n';
  });

  return `You are a strength training coach. Analyze this athlete's data and give specific, data-driven insights. Reference actual numbers.

ATHLETE: ${profile.name}
UNIT: ${unit}

EXERCISE PROGRESS:
${block}
Reply in exactly these four sections (use **Section Title** for headers):

**What's Progressing Well**
Which lifts are moving fast and why that's good. Cite percentages and weights.

**Needs Attention**
Which lifts are stagnant or lagging. Be specific about what's wrong.

**Muscle Balance Check**
Based on the muscle groups above, flag any push/pull, quad/posterior-chain, or other imbalances visible in the data.

**Top 3 Recommendations**
Specific, actionable steps for the next 4 weeks. Name the exact exercise and what to do differently.

Keep it tight. No generic fitness clichés.`;
}

// ---------------------------------------------------------------------------
// Streaming DeepSeek call
// ---------------------------------------------------------------------------

async function streamCompletion(
  apiKey: string,
  prompt: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 1200,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`DeepSeek ${res.status}: ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body from DeepSeek');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const delta: string = data.choices?.[0]?.delta?.content ?? '';
          if (delta) onDelta(delta);
        } catch {}
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Markdown renderer (minimal: bold headers + bullets)
// ---------------------------------------------------------------------------

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // **Bold header** on its own line
        if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
          return (
            <Text key={i} className="text-amber-400 font-black text-sm uppercase tracking-widest mt-5 mb-1">
              {trimmed.replace(/\*\*/g, '')}
            </Text>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <Text key={i} className="text-zinc-200 text-sm leading-relaxed mt-1 ml-1">
              {trimmed}
            </Text>
          );
        }

        // Bullet
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <Text key={i} className="text-zinc-300 text-sm leading-relaxed mt-1 ml-1">
              {trimmed}
            </Text>
          );
        }

        // Empty line
        if (!trimmed) return <View key={i} className="h-2" />;

        // Body text — render inline **bold** spans
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={i} className="text-zinc-400 text-sm leading-relaxed mt-1" selectable>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <Text key={j} className="text-zinc-200 font-bold">
                  {part.slice(2, -2)}
                </Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InsightsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState('');
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const insightsRef = useRef('');

  const loadState = useCallback(async () => {
    const prof = await getUserProfile();
    const count = await database.collections.get<SetLog>('set_logs').query().fetchCount();
    setProfile(prof);
    setHasApiKey(!!prof?.deepseekApiKey?.trim());
    setHasData(count > 0);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadState(); }, [loadState]));

  const handleAnalyze = async () => {
    if (!profile?.deepseekApiKey?.trim()) {
      Alert.alert('No API Key', 'Add your DeepSeek API key in the Settings tab first.');
      return;
    }
    if (!hasData) {
      Alert.alert('No Workout Data', 'Log at least one workout session before analyzing.');
      return;
    }

    setAnalyzing(true);
    setInsights('');
    setError(null);
    insightsRef.current = '';

    try {
      const summaries = await gatherExerciseSummaries(profile);
      const logged = summaries.filter(s => s.sessions.length > 0);
      if (logged.length === 0) {
        setError('No exercises have been logged yet. Complete a workout session first.');
        return;
      }

      const prompt = buildPrompt(profile, summaries);

      await streamCompletion(
        profile.deepseekApiKey!,
        prompt,
        (delta) => {
          insightsRef.current += delta;
          setInsights(insightsRef.current);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
        },
      );

      setLastRun(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Check your API key and network connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <View className="pt-10 pb-6">
            <Skeleton className="h-10 w-48 rounded-xl mb-3" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </View>
          <Skeleton className="w-full h-20 rounded-2xl mb-4" />
          <Skeleton className="w-full h-14 rounded-2xl" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="pt-10 pb-6">
          <Text className="text-4xl font-black text-amber-400 uppercase tracking-tighter">AI Insights</Text>
          <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-2">
            Powered by DeepSeek
          </Text>
        </View>

        {/* Status cards */}
        {!hasApiKey && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex-row items-start gap-4">
            <Text className="text-2xl">🔑</Text>
            <View className="flex-1">
              <Text className="text-white font-black mb-1">API Key Required</Text>
              <Text className="text-zinc-500 text-sm leading-relaxed">
                Add your DeepSeek API key in the Settings tab to enable AI analysis.
              </Text>
            </View>
          </View>
        )}

        {hasApiKey && !hasData && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex-row items-start gap-4">
            <Text className="text-2xl">📊</Text>
            <View className="flex-1">
              <Text className="text-white font-black mb-1">No Workout Data Yet</Text>
              <Text className="text-zinc-500 text-sm leading-relaxed">
                Log at least one session in the Routines tab and come back here for your first analysis.
              </Text>
            </View>
          </View>
        )}

        {/* Analyze button */}
        {hasApiKey && hasData && (
          <TouchableOpacity
            className={`w-full py-5 rounded-2xl items-center mb-6 ${analyzing ? 'bg-amber-400/40' : 'bg-amber-400'}`}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color="#000" size="small" />
                <Text className="text-black font-black text-base uppercase tracking-wider">Analyzing...</Text>
              </View>
            ) : (
              <Text className="text-black font-black text-lg uppercase tracking-wider">
                {insights ? 'Re-Analyze Training' : 'Analyze My Training'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-4">
            <Text className="text-red-400 font-bold text-sm">{error}</Text>
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {lastRun && !analyzing && (
              <Text className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                Last analyzed {lastRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            <MarkdownBlock text={insights} />
            {analyzing && (
              <View className="mt-4">
                <ActivityIndicator color="#fbbf24" size="small" />
              </View>
            )}
          </View>
        )}

        {/* Empty prompt */}
        {!insights && !analyzing && !error && hasApiKey && hasData && (
          <View className="items-center py-10">
            <Text className="text-zinc-700 font-bold text-xs uppercase tracking-widest text-center">
              Tap the button above to get your first AI coaching analysis
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
