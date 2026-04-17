import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ModalScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center p-8">
      <View className="items-center">
        <Text className="text-amber-400 font-black text-3xl uppercase tracking-tighter mb-4">Tojizenin</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-zinc-900 border border-zinc-800 py-4 px-8 rounded-2xl"
        >
          <Text className="text-white font-bold uppercase tracking-wider">Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
