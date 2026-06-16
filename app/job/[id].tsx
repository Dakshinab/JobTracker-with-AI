import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useLocalSearchParams, router } from 'expo-router';
import { useJobStore, JobStatus } from '../../stores/jobStore';
import { useState, useEffect } from 'react';

const statusColors: Record<string, { color: string; bg: string }> = {
  Interview: { color: '#F97316', bg: '#FFF7ED' },
  Applied:   { color: '#3B82F6', bg: '#EFF6FF' },
  Rejected:  { color: '#EF4444', bg: '#FEF2F2' },
  Offer:     { color: '#10B981', bg: '#ECFDF5' },
};

const statuses: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

export default function JobDetail() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobs = useJobStore((state) => state.jobs);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const updateJob = useJobStore((state) => state.updateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [date, setDate] = useState('');

  useEffect(() => {
    async function load() {
      if (jobs.length === 0) {
        setLoading(true);
        await fetchJobs();
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      setCompany(job.company);
      setRole(job.role);
      setLocation(job.location || '');
      setSalary(job.salary || '');
      setNotes(job.notes || '');
      setStatus(job.status);
      setDate(job.date || '');
    }
  }, [jobs, id]);

  const job = jobs.find(j => j.id === id);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text }}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.accent }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSave() {
    await updateJob(job!.id, { company, role, location, salary, notes, status });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteJob(job!.id);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{
        backgroundColor: theme.surface,
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 15, color: theme.accent, fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Job Detail</Text>
        {editing ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ fontSize: 15, color: theme.accent, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={{ fontSize: 15, color: theme.accent, fontWeight: '500' }}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 12, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Company Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          borderWidth: 0.5,
          borderColor: theme.border,
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: theme.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: theme.accent }}>
              {company[0]?.toUpperCase()}
            </Text>
          </View>

          {editing ? (
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="Company"
              placeholderTextColor={theme.textMuted}
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: theme.text,
                borderBottomWidth: 1,
                borderBottomColor: theme.accent,
                paddingBottom: 4,
                marginBottom: 8,
                width: '100%',
                textAlign: 'center',
              }}
            />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>{company}</Text>
          )}

          {editing ? (
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder="Role"
              placeholderTextColor={theme.textMuted}
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
                paddingBottom: 4,
                marginBottom: 12,
                width: '100%',
                textAlign: 'center',
              }}
            />
          ) : (
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>{role}</Text>
          )}

          {/* Status pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            {editing ? statuses.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: status === s ? statusColors[s].bg : theme.surfaceSecondary,
                  borderWidth: 0.5,
                  borderColor: status === s ? statusColors[s].color : theme.border,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: status === s ? statusColors[s].color : theme.textSecondary,
                }}>{s}</Text>
              </TouchableOpacity>
            )) : (
              <View style={{
                backgroundColor: statusColors[status]?.bg,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: statusColors[status]?.color }}>
                  {status}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        {[
          { label: 'Location', value: location, onChange: setLocation, placeholder: 'e.g. Remote' },
          { label: 'Salary', value: salary, onChange: setSalary, placeholder: 'e.g. $100,000' },
        ].map((item, i) => (
          <View key={i} style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 0.5,
            borderColor: theme.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>{item.label}</Text>
            {editing ? (
              <TextInput
                value={item.value}
                onChangeText={item.onChange}
                placeholder={item.placeholder}
                placeholderTextColor={theme.textMuted}
                style={{
                  fontSize: 13,
                  color: theme.text,
                  fontWeight: '500',
                  textAlign: 'right',
                  minWidth: 120,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.accent,
                }}
              />
            ) : (
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                {item.value || 'Not specified'}
              </Text>
            )}
          </View>
        ))}

        {/* Date */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 0.5,
          borderColor: theme.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Date Applied</Text>
          <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>{date}</Text>
        </View>

        {/* Notes */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 0.5,
          borderColor: theme.border,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 10 }}>
            NOTES
          </Text>
          {editing ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this application..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 14,
                color: theme.text,
                lineHeight: 22,
                minHeight: 80,
                textAlignVertical: 'top',
                borderWidth: 0.5,
                borderColor: theme.accent,
                borderRadius: 10,
                padding: 10,
              }}
            />
          ) : (
            <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>
              {notes || 'No notes added.'}
            </Text>
          )}
        </View>

        {/* Delete Button */}
        {!editing && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: '#EF4444',
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Delete Job</Text>
          </TouchableOpacity>
        )}

        {/* Cancel editing */}
        {editing && (
          <TouchableOpacity
            onPress={() => setEditing(false)}
            style={{
              backgroundColor: theme.surfaceSecondary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}