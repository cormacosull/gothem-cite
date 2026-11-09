import { useFonts, Bangers_400Regular } from '@expo-google-fonts/bangers';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../src/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fonts.titles]: Bangers_400Regular,
    [fonts.body]: Nunito_400Regular,
    [fonts.bodyBold]: Nunito_700Bold,
    [fonts.bodyExtraBold]: Nunito_800ExtraBold,
  });


  if (!fontsLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}