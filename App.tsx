import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppConfigProvider } from './src/context/AppConfigContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppConfigProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AppConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
