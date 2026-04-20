import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/theme';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.pinkMid} />
      </View>
    );
  }

  return token
    ? <Redirect href="/(tabs)/menu" />
    : <Redirect href="/(auth)/welcome" />;
}