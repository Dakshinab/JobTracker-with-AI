import { useTheme } from '../../lib/useTheme';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleAuth() {
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) setError(error.message);
      else router.replace('/(tabs)');

    } else if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace('/(tabs)');

    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setError(error.message);
      else setSuccess('Password reset email sent! Check your inbox.');
    }

    setLoading(false);
  }

  const titles: Record<Mode, string> = {
    signin: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset your password',
  };

  const buttonLabels: Record<Mode, string> = {
    signin: 'Sign In',
    signup: 'Create Account',
    forgot: 'Send Reset Email',
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              marginBottom: 16,
            }}
          />
          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text }}>JobTracker</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 6 }}>
            {titles[mode]}
          </Text>
        </View>

        {/* Form */}
        <View>
          {mode === 'signup' && (
            <TextInput
              placeholder="Full name"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: theme.border,
                padding: 16,
                fontSize: 15,
                color: theme.text,
                marginBottom: 14,
              }}
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 16,
              fontSize: 15,
              color: theme.text,
              marginBottom: 14,
            }}
          />

          {mode !== 'forgot' && (
            <TextInput
              placeholder="Password"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: theme.border,
                padding: 16,
                fontSize: 15,
                color: theme.text,
                marginBottom: 14,
              }}
            />
          )}

          {/* Forgot password link */}
          {mode === 'signin' && (
            <TouchableOpacity
              onPress={() => { setMode('forgot'); setError(''); setSuccess(''); }}
              style={{ alignItems: 'flex-end', marginBottom: 14 }}
            >
              <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '500' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {error !== '' && (
            <Text style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 12 }}>
              {error}
            </Text>
          )}

          {success !== '' && (
            <Text style={{ fontSize: 13, color: '#10B981', textAlign: 'center', marginBottom: 12 }}>
              {success}
            </Text>
          )}

          {/* Main button */}
          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                  {buttonLabels[mode]}
                </Text>
            }
          </TouchableOpacity>

          {/* Bottom links */}
          {mode === 'forgot' ? (
            <TouchableOpacity
              onPress={() => { setMode('signin'); setError(''); setSuccess(''); }}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Back to{' '}
                <Text style={{ color: theme.accent, fontWeight: '600' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: theme.accent, fontWeight: '600' }}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}