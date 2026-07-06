import {
  View, Text, TouchableOpacity, Dimensions,
  Animated, StatusBar, SafeAreaView
} from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const ORANGE = '#F97316';

// Slide visuals — float naturally over gradient
function TrackVisual() {
  return (
    <View style={{ width: '100%', gap: 12, marginBottom: 8 }}>
      {[
        { company: 'Shopify', role: 'DevOps Engineer', status: 'Interview', color: ORANGE },
        { company: 'Stripe', role: 'Full Stack Engineer', status: 'Applied', color: '#3B82F6' },
        { company: 'Vercel', role: 'Cloud Engineer', status: 'Offer', color: '#10B981' },
      ].map((item, i) => (
        <View key={i} style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center', marginRight: 14,
          }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>
              {item.company[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{item.company}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{item.role}</Text>
          </View>
          <View style={{
            backgroundColor: `${item.color}33`,
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
            borderWidth: 1, borderColor: `${item.color}55`,
          }}>
            <Text style={{ fontSize: 11, color: item.color, fontWeight: '700' }}>{item.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function AnalyzeVisual() {
  return (
    <View style={{ width: '100%', gap: 12, marginBottom: 8 }}>
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
        flexDirection: 'row', alignItems: 'center',
      }}>
        <View style={{
          width: 90, height: 90, borderRadius: 45,
          borderWidth: 8, borderColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center', justifyContent: 'center', marginRight: 18,
        }}>
          <View style={{
            position: 'absolute', width: 90, height: 90, borderRadius: 45,
            borderWidth: 8, borderColor: ORANGE,
            borderTopColor: 'transparent', borderLeftColor: 'transparent',
            transform: [{ rotate: '110deg' }],
          }} />
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>78</Text>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.5 }}>MATCH</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            DevOps Engineer @ Shopify
          </Text>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 }}>
            <View style={{ height: 6, width: '78%', backgroundColor: ORANGE, borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 12, color: ORANGE, fontWeight: '700' }}>Strong Match</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'AWS', ok: true },
          { label: 'Docker', ok: true },
          { label: 'Kubernetes', ok: false },
          { label: 'CI/CD', ok: true },
        ].map((s, i) => (
          <View key={i} style={{
            flex: 1, alignItems: 'center', paddingVertical: 10,
            backgroundColor: s.ok ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: s.ok ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.12)',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: s.ok ? ORANGE : 'rgba(255,255,255,0.35)' }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CoachVisual() {
  return (
    <View style={{ width: '100%', gap: 10, marginBottom: 8 }}>
      {[
        { from: 'ai', text: 'What are your strongest DevOps skills?' },
        { from: 'user', text: 'Terraform, Docker, GitHub Actions, AWS' },
        { from: 'ai', text: 'Great! Your interview chance is 78%. Focus on Kubernetes to reach 90%+.' },
      ].map((msg, i) => (
        <View key={i} style={{ alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
          <View style={{
            backgroundColor: msg.from === 'user'
              ? ORANGE
              : 'rgba(255,255,255,0.14)',
            borderRadius: 18,
            borderBottomRightRadius: msg.from === 'user' ? 4 : 18,
            borderBottomLeftRadius: msg.from === 'ai' ? 4 : 18,
            paddingHorizontal: 16, paddingVertical: 11,
            maxWidth: width * 0.72,
            borderWidth: msg.from === 'ai' ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.18)',
          }}>
            <Text style={{ fontSize: 14, color: '#fff', lineHeight: 21 }}>{msg.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const slides = [
  {
    gradient: ['#0F172A', '#1a2744', '#2d3a6e', '#3d4f8a'] as const,
    tag: 'TRACK',
    headline: 'Every application,\nin one place.',
    body: 'Stop losing track. See your entire job search at a glance with live status updates.',
    visual: <TrackVisual />,
  },
  {
    gradient: ['#0F172A', '#1a2435', '#1e3a4a', '#1a4a3a'] as const,
    tag: 'ANALYZE',
    headline: 'Know your chances\nbefore you apply.',
    body: 'Get an instant AI match score based on your real skills — not generic advice.',
    visual: <AnalyzeVisual />,
  },
  {
    gradient: ['#0F172A', '#1a1a2e', '#2d1b3d', '#3d1f35'] as const,
    tag: 'COACH',
    headline: 'A career coach\nin your pocket.',
    body: 'Interview prep, offer negotiation, rejection feedback — AI guidance at every stage.',
    visual: <CoachVisual />,
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  async function skip() {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(auth)');
  }

  function next() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setTimeout(async () => {
      if (index < slides.length - 1) {
        setIndex(index + 1);
      } else {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        router.replace('/(auth)');
      }
    }, 200);
  }

  function pressIn() { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start(); }
  function pressOut() { Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start(); }

  const slide = slides[index];

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Full screen gradient — unique per slide */}
      <LinearGradient
        colors={slide.gradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Subtle bottom fade to near-white */}
      <LinearGradient
        colors={['transparent', 'rgba(248,249,250,0.15)', 'rgba(248,249,250,0.35)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.35 }}
      />

      {/* Skip */}
      <TouchableOpacity
        onPress={skip}
        style={{
          position: 'absolute', top: 56, right: 24, zIndex: 20,
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Skip</Text>
      </TouchableOpacity>

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={{
          flex: 1, opacity: fadeAnim,
          paddingHorizontal: 28,
          paddingTop: 100,
          paddingBottom: 8,
          justifyContent: 'space-between',
        }}>

          {/* Top — visual content */}
          <View style={{ flex: 1 }}>
            {/* Tag */}
            <View style={{
              backgroundColor: 'rgba(249,115,22,0.2)',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: 'rgba(249,115,22,0.35)',
              alignSelf: 'flex-start', marginBottom: 22,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: ORANGE, letterSpacing: 2 }}>
                {slide.tag}
              </Text>
            </View>

            {/* Visual */}
            {slide.visual}
          </View>

          {/* Bottom — text + controls */}
          <View>
            {/* Headline */}
            <Text style={{
              fontSize: 32, fontWeight: '900',
              color: '#fff', lineHeight: 38,
              marginBottom: 10, letterSpacing: -0.8,
            }}>
              {slide.headline}
            </Text>

            {/* Body */}
            <Text style={{
              fontSize: 15, color: 'rgba(255,255,255,0.6)',
              lineHeight: 22, marginBottom: 28,
            }}>
              {slide.body}
            </Text>

            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
              {slides.map((_, i) => (
                <Animated.View key={i} style={{
                  height: 4,
                  width: i === index ? 28 : 8,
                  borderRadius: 2,
                  backgroundColor: i === index ? ORANGE : 'rgba(255,255,255,0.25)',
                }} />
              ))}
            </View>

            {/* Primary CTA */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={next}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
                style={{
                  backgroundColor: ORANGE,
                  borderRadius: 16, paddingVertical: 17,
                  alignItems: 'center', marginBottom: 14,
                  shadowColor: ORANGE,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4, shadowRadius: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 }}>
                  {index < slides.length - 1 ? 'Continue' : 'Get Started'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary CTA */}
            <TouchableOpacity onPress={skip} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}