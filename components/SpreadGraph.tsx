import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryScatter, VictoryAxis } from 'victory-native';

interface SpreadGraphProps {
  data: { x: number; y: number }[];
  type: '1RM' | 'Volume';
  unit: string;
}

export function SpreadGraph({ data, type, unit }: SpreadGraphProps) {
  if (data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-zinc-900 rounded-2xl mx-4 my-2">
        <Text className="text-md text-zinc-400">No data available yet.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4 bg-zinc-900 rounded-2xl mx-4 my-2 border border-zinc-800">
      <Text className="text-lg font-bold text-zinc-100 self-start ml-2 mb-2">
        {type === '1RM' ? 'Estimated 1RM' : 'Total Volume'} <Text className="text-amber-400">({unit})</Text>
      </Text>
      <VictoryChart theme={VictoryTheme.material} height={250} padding={{ top: 20, bottom: 40, left: 50, right: 30 }}>
        <VictoryAxis 
          tickFormat={(x) => {
            const date = new Date(x);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }} 
          style={{ tickLabels: { fill: '#a1a1aa' }, axis: { stroke: '#3f3f46' }, grid: { stroke: 'none' } }}
        />
        <VictoryAxis 
          dependentAxis 
          style={{ tickLabels: { fill: '#a1a1aa' }, axis: { stroke: '#3f3f46' }, grid: { stroke: '#27272a', strokeDasharray: '4' } }} 
        />
        <VictoryLine
          style={{
            data: { stroke: "#fbbf24", strokeWidth: 3 }, // amber-400
          }}
          data={data}
          interpolation="monotoneX"
        />
        <VictoryScatter 
          data={data} 
          size={5} 
          style={{ data: { fill: "#f59e0b" } }} // amber-500
        />
      </VictoryChart>
    </View>
  );
}
