import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  useWindowDimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, type, font, radius, space } from '../../theme';
import Dots from '../../components/Dots';
import Button from '../../components/Button';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { ONBOARDING_SEEN_KEY } from '../../constants/storage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Page {
  key: string;
  title: string;
  body: string;
  // Drop art in assets/ and swap the placeholder for e.g.
  //   art: require('../../../assets/onboard-1.png')
  art?: number;
}

const PAGES: Page[] = [
  {
    key: 'traffic',
    title: 'Beat the traffic on two wheels',
    body: 'Verified riders reach you in minutes and weave through the jam so you arrive on time.',
  },
  {
    key: 'fare',
    title: 'Know your fare before you book',
    body: 'One upfront price for the whole trip. No meters, no surprises at the drop-off.',
  },
  {
    key: 'safety',
    title: 'Every ride is tracked end to end',
    body: 'Share your live trip, call the rider in-app, and reach support in one tap.',
  },
];

function Art({ art }: { art?: number }) {
  if (art) return <Image source={art} style={styles.art} resizeMode="cover" />;
  // Branded placeholder until illustrations land.
  return (
    <View style={styles.art}>
      <View style={styles.artBlob} />
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.artLogo}
        resizeMode="contain"
      />
    </View>
  );
}

// 02–03 · Onboarding carousel. Marks itself seen and replaces to PhoneLogin
// on Skip or "Get started".
export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Page>>(null);
  const last = index === PAGES.length - 1;

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // Non-fatal — worst case the carousel shows again next launch.
    }
    navigation.replace('PhoneLogin');
  };

  const next = () => {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => p.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <Art art={item.art} />
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={type.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Dots count={PAGES.length} index={index} />
        <Button
          title={last ? 'Get started' : 'Next'}
          variant="navy"
          onPress={next}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface50 },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 },
  skip: { fontFamily: font.semibold, fontSize: 14, color: colors.ink400 },
  page: { paddingHorizontal: 24 },
  art: {
    width: '100%',
    height: 330,
    borderRadius: 26,
    backgroundColor: colors.surface100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artBlob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accentTint,
  },
  artLogo: { width: '62%', height: '62%' },
  copy: { paddingHorizontal: 4, paddingTop: 32, gap: space.md },
  title: { ...type.screenTitle, fontSize: 28, lineHeight: 34 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 20,
  },
  cta: { paddingHorizontal: 30 },
});
