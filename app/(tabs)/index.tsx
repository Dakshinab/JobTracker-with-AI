import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useJobStore } from '../../stores/jobStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const { theme } = useTheme();
  const { jobs, fetchJobs } = useJobStore();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchJobs();
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    if (data?.name) setUserName(data.name);
  }

  const stats = [
    { label: 'Applied', value: jobs.filter(j => j.status === 'Applied').length, color: '#3B82F6' },
    { label: 'Interviews', value: jobs.filter(j => j.status === 'Interview').length, color: '#F97316' },
    { label: 'Offers', value: jobs.filter(j => j.status === 'Offer').length, color: '#10B981' },
    { label: 'Rejected', value: jobs.filter(j => j.status === 'Rejected').length, color: '#EF4444' },
  ];

  const recentJobs = jobs.slice(0, 3);

  const statusColors: Record<string, { color: string; bg: string }> = {
    Interview: { color: '#F97316', bg: '#FFF7ED' },
    Applied:   { color: '#3B82F6', bg: '#EFF6FF' },
    Rejected:  { color: '#EF4444', bg: '#FEF2F2' },
    Offer:     { color: '#10B981', bg: '#ECFDF5' },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: theme.surface,
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.border,
      }}>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6 }}>
          {greeting}
        </Text>
        <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '700' }}>
          {userName || 'there'}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
          {jobs.length} applications tracked
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12, fontWeight: '500' }}>
          OVERVIEW
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {stats.map((stat) => (
            <View key={stat.label} style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: stat.color }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Applications */}
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>
            RECENT APPLICATIONS
          </Text>
          <TouchableOpacity onPress={() => router.push('/jobs')}>
            <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '500' }}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentJobs.length === 0 && (
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: theme.border,
          }}>
            <Text style={{ fontSize: 14, color: theme.textMuted }}>No applications yet</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
              Tap + on Jobs to add your first one
            </Text>
          </View>
        )}

        {recentJobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              borderWidth: 0.5,
              borderColor: theme.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.accent }}>
                {job.company[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                {job.company}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                {job.role}
              </Text>
            </View>
            <View style={{
              backgroundColor: statusColors[job.status]?.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: statusColors[job.status]?.color }}>
                {job.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}