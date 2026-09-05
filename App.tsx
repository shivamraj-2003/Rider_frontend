import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppConfigProvider } from './src/context/AppConfigContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  // Font family keys match src/theme/fonts.ts so styles resolve synchronously.
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppConfigProvider>
          <RootNavigator fontsReady={fontsLoaded} />
          <StatusBar style="auto" />
        </AppConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
