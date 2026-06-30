import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../lib/useTheme';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useJobStore, JobStatus } from '../stores/jobStore';
import { supabase } from '../lib/supabase';

const statuses: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

export default function AddJob() {
  const { theme } = useTheme();
  const addJob = useJobStore((state) => state.addJob);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    interviewChance: number;
    quickTips: string[];
    verdict: string;
    strengthAreas?: string[];
    focusAreas?: string[];
  }>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userExperiences, setUserExperiences] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('skills, name')
      .eq('id', user.id)
      .single();
    if (data?.skills) setUserSkills(data.skills);
    if (data?.name) setUserName(data.name.split(' ')[0]);
    const { data: expData } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id);
    if (expData) setUserExperiences(expData);
  }

  async function generateAIAnalysis() {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) return null;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `You are a strict and helpful career coach. Analyze this job application.

Candidate: ${userName}
Skills: ${userSkills.join(', ')}
Experience: ${userExperiences.map(e => `${e.role} at ${e.company} (${e.months} months)`).join('; ') || 'None'}
Total experience: ${userExperiences.reduce((sum, e) => sum + e.months, 0)} months

Job Role: ${role}
Company: ${company}
Job Description: ${jobDescription}

RULES:
- Be realistic and data-driven
- If candidate lists a skill treat it as valid
- Consider experience level when giving advice
- Be encouraging but honest

Respond ONLY with this exact JSON no extra text:
{
  "interviewChance": <number 0-100>,
  "verdict": "2-3 sentences about their chances speaking directly to them using you/your",
  "quickTips": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "strengthAreas": ["strength 1", "strength 2"],
  "focusAreas": ["area to focus 1", "area to focus 2", "area to focus 3"]
}`,
          }],
          max_tokens: 600,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const text = data.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function analyzeWithAI() {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) return;
    setAiLoading(true);
    setAiResult(null);
    const result = await generateAIAnalysis();
    if (result) setAiResult(result);
    setAiLoading(false);
  }

  async function handleSave() {
    if (!company.trim() || !role.trim()) return;
    setSaving(true);

    let ai_analysis = aiResult;
    if (!ai_analysis && jobDescription.trim().length >= 20) {
      ai_analysis = await generateAIAnalysis();
    }

    await addJob({
      company,
      role,
      location,
      salary,
      notes,
      status,
      job_description: jobDescription,
      interview_date: '',
      interview_type: '',
      ai_analysis,
    });

    setSaving(false);
    router.back();
  }

  const statusColors: Record<JobStatus, { color: string; bg: string }> = {
    Interview: { color: '#F97316', bg: '#FFF7ED' },
    Applied:   { color: '#3B82F6', bg: '#EFF6FF' },
    Rejected:  { color: '#EF4444', bg: '#FEF2F2' },
    Offer:     { color: '#10B981', bg: '#ECFDF5' },
  };

  const chanceColor = aiResult
    ? aiResult.interviewChance >= 70 ? '#10B981'
    : aiResult.interviewChance >= 40 ? '#F97316'
    : '#EF4444'
    : theme.accent;

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
          <Text style={{ fontSize: 15, color: theme.accent, fontWeight: '500' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Add Job</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={theme.accent} size="small" />
            : <Text style={{
                fontSize: 15,
                color: company.trim() && role.trim() ? theme.accent : theme.textMuted,
                fontWeight: '700',
              }}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Company */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            COMPANY
          </Text>
          <TextInput
            placeholder="e.g. Google"
            placeholderTextColor={theme.textMuted}
            value={company}
            onChangeText={setCompany}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 15,
              color: theme.text,
            }}
          />
        </View>

        {/* Role */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            ROLE
          </Text>
          <TextInput
            placeholder="e.g. Senior DevOps Engineer"
            placeholderTextColor={theme.textMuted}
            value={role}
            onChangeText={setRole}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 15,
              color: theme.text,
            }}
          />
        </View>

        {/* Location */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            LOCATION
          </Text>
          <TextInput
            placeholder="e.g. Remote"
            placeholderTextColor={theme.textMuted}
            value={location}
            onChangeText={setLocation}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 15,
              color: theme.text,
            }}
          />
        </View>

        {/* Salary */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            SALARY
          </Text>
          <TextInput
            placeholder="e.g. $100,000"
            placeholderTextColor={theme.textMuted}
            value={salary}
            onChangeText={setSalary}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 15,
              color: theme.text,
            }}
          />
        </View>

        {/* Status */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            STATUS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {statuses.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: status === s ? statusColors[s].bg : theme.surface,
                  borderWidth: 0.5,
                  borderColor: status === s ? statusColors[s].color : theme.border,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: status === s ? statusColors[s].color : theme.textSecondary,
                }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Job Description */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            JOB DESCRIPTION
          </Text>
          <TextInput
            placeholder="Paste job description for AI analysis (optional but recommended)..."
            placeholderTextColor={theme.textMuted}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 14,
              color: theme.text,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
          {jobDescription.trim().length >= 20 && (
            <TouchableOpacity
              onPress={analyzeWithAI}
              disabled={aiLoading}
              style={{
                backgroundColor: theme.surfaceSecondary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 10,
                borderWidth: 0.5,
                borderColor: theme.accent,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {aiLoading
                ? <ActivityIndicator color={theme.accent} size="small" />
                : <Text style={{ fontSize: 14, fontWeight: '600', color: theme.accent }}>
                    Analyze my chances with AI
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* AI Result */}
        {aiResult && (
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 0.5,
            borderColor: theme.border,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 12 }}>
              AI ANALYSIS
            </Text>

            {/* Interview chance bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6 }}>
                  Interview Chance
                </Text>
                <View style={{ height: 6, backgroundColor: theme.surfaceSecondary, borderRadius: 3 }}>
                  <View style={{
                    height: 6,
                    width: `${aiResult.interviewChance}%`,
                    backgroundColor: chanceColor,
                    borderRadius: 3,
                  }} />
                </View>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: chanceColor, marginLeft: 12 }}>
                {aiResult.interviewChance}%
              </Text>
            </View>

            {/* Verdict */}
            <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22, marginBottom: 12 }}>
              {aiResult.verdict}
            </Text>

            {/* Strength Areas */}
            {aiResult.strengthAreas && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginBottom: 8 }}>
                  YOUR STRENGTHS
                </Text>
                {aiResult.strengthAreas.map((s: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 10, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: theme.text, flex: 1, lineHeight: 20 }}>{s}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Focus Areas */}
            {aiResult.focusAreas && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 8, marginTop: 12 }}>
                  FOCUS BEFORE APPLYING
                </Text>
                {aiResult.focusAreas.map((f: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 10, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: theme.text, flex: 1, lineHeight: 20 }}>{f}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Quick tips */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8, marginTop: 12 }}>
              QUICK TIPS
            </Text>
            {aiResult.quickTips.map((tip: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, marginRight: 10, marginTop: 6 }} />
                <Text style={{ fontSize: 13, color: theme.text, flex: 1, lineHeight: 20 }}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
            NOTES
          </Text>
          <TextInput
            placeholder="Any notes about this application..."
            placeholderTextColor={theme.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.border,
              padding: 14,
              fontSize: 15,
              color: theme.text,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: company.trim() && role.trim() ? 1 : 0.4,
          }}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                {jobDescription.trim().length >= 20 && !aiResult ? 'Save + AI Analyze' : 'Save Job'}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}