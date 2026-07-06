import { View, Text, Animated, Dimensions, StatusBar, Image } from 'react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function Splash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(async () => {
      await AsyncStorage.removeItem('hasOnboarded');
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      const { data: { session } } = await supabase.auth.getSession();
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/onboarding');
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{
      flex: 1,
      backgroundColor: '#F97316',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: screenFade,
    }}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
      }}>
        {/* App icon image */}
        <Image
          source={require('../assets/images/icon.png')}
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            marginBottom: 24,
          }}
        />

        <Text style={{
          fontSize: 30,
          fontWeight: '800',
          color: '#fff',
          letterSpacing: -0.5,
        }}>
          JobTracker AI
        </Text>

        <Text style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.75)',
          marginTop: 8,
          letterSpacing: 0.3,
        }}>
          Your AI career coach
        </Text>
      </Animated.View>

      {/* Bottom progress */}
      <Animated.View style={{
        position: 'absolute',
        bottom: 70,
        width: width * 0.65,
        opacity: fadeAnim,
      }}>
        <Text style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 10,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
          Preparing your experience...
        </Text>
        <View style={{
          width: '100%',
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <Animated.View style={{
            height: 3,
            width: progressWidth,
            backgroundColor: '#fff',
            borderRadius: 2,
          }} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}