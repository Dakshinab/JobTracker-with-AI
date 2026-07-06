import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useJobStore } from '../../stores/jobStore';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

const filters = ['All', 'Applied', 'Interview', 'Offer', 'Rejected'];

const statusColors: Record<string, { color: string; bg: string }> = {
  Interview: { color: '#F97316', bg: '#FFF7ED' },
  Applied:   { color: '#3B82F6', bg: '#EFF6FF' },
  Rejected:  { color: '#EF4444', bg: '#FEF2F2' },
  Offer:     { color: '#10B981', bg: '#ECFDF5' },
};

export default function Jobs() {
  const { theme } = useTheme();
  const { jobs, fetchJobs, loading } = useJobStore();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [active, setActive] = useState(params.filter || 'All');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (params.filter) {
      setActive(params.filter);
    }
  }, [params.filter]);

  const filtered = active === 'All' ? jobs : jobs.filter(j => j.status === active);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* Header */}
      <View style={{
        backgroundColor: theme.surface,
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.border,
      }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>Applications</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
          {jobs.length} total jobs tracked
        </Text>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 16 }}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActive(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active === f ? theme.accent : theme.surfaceSecondary,
                borderWidth: active === f ? 0 : 0.5,
                borderColor: theme.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: active === f ? '#fff' : theme.textSecondary,
              }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: theme.textMuted }}>No jobs found</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            Tap + to add your first application
          </Text>
        </View>
      )}

      {/* Job List */}
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((job) => (
          <TouchableOpacity
            key={job.id}
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <View style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: theme.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.accent }}>
                {job.company[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{job.company}</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{job.role}</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                {job.location}  ·  {job.date}
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
      </ScrollView>

      {/* Add Button */}
      <View style={{ position: 'absolute', bottom: 30, right: 24 }}>
        <TouchableOpacity
          onPress={() => router.push('/add-job')}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <Text style={{ fontSize: 26, color: '#fff', lineHeight: 30 }}>+</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}