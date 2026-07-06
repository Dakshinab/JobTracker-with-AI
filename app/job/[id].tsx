import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useLocalSearchParams, router } from 'expo-router';
import { useJobStore, JobStatus } from '../../stores/jobStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const statusColors: Record<string, { color: string; bg: string }> = {
  Interview: { color: '#F97316', bg: '#FFF7ED' },
  Applied:   { color: '#3B82F6', bg: '#EFF6FF' },
  Rejected:  { color: '#EF4444', bg: '#FEF2F2' },
  Offer:     { color: '#10B981', bg: '#ECFDF5' },
};

const statuses: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];
const interviewTypes = ['Online', 'Physical'];

export default function JobDetail() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobs = useJobStore((state) => state.jobs);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const updateJob = useJobStore((state) => state.updateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [date, setDate] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [statusAI, setStatusAI] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userExperiences, setUserExperiences] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (jobs.length === 0) {
        setLoading(true);
        await fetchJobs();
        setLoading(false);
      }
      loadProfile();
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
      setJobDescription(job.job_description || '');
      setInterviewDate(job.interview_date || '');
      setInterviewType(job.interview_type || '');
      setAiAnalysis(job.ai_analysis || null);
    }
  }, [jobs, id]);

  useEffect(() => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    if (job.ai_analysis && job.ai_analysis.type === statusToType(job.status)) {
      setStatusAI(job.ai_analysis);
      return;
    }

    if (userSkills.length > 0) {
      generateStatusAI(job.status, job);
    }
  }, [userSkills, jobs]);

  function statusToType(status: JobStatus) {
    if (status === 'Applied') return 'applied';
    if (status === 'Interview') return 'interview';
    if (status === 'Offer') return 'offer';
    if (status === 'Rejected') return 'rejected';
    return '';
  }

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

  async function generateStatusAI(currentStatus: JobStatus, job: any) {
    if (!job.job_description && !job.role) return;
    setAiLoading(true);

    let prompt = '';
    const baseInfo = `
Candidate: ${userName}
Skills: ${userSkills.join(', ')}
Experience: ${userExperiences.map(e => `${e.role} at ${e.company} (${e.months} months)`).join('; ') || 'None'}
Job Role: ${job.role}
Company: ${job.company}
Job Description: ${job.job_description || 'Not provided'}
`;

    if (currentStatus === 'Applied') {
      prompt = `${baseInfo}
The candidate just applied for this job. Give them personalized coaching.
Respond ONLY with this JSON:
{
  "type": "applied",
  "interviewChance": <number 0-100>,
  "message": "2-3 encouraging sentences about their chances using you/your",
  "strengthAreas": ["strength 1", "strength 2"],
  "focusAreas": ["what to work on 1", "what to work on 2", "what to work on 3"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}`;
    } else if (currentStatus === 'Interview') {
      const daysLeft = interviewDate
        ? Math.ceil((new Date(interviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
      prompt = `${baseInfo}
Interview Type: ${interviewType || 'Not specified'}
Interview Date: ${interviewDate || 'Not specified'}
Days until interview: ${daysLeft !== null ? daysLeft : 'Unknown'}

Generate interview preparation guidance.
Respond ONLY with this JSON:
{
  "type": "interview",
  "message": "encouraging 2-3 sentences about the interview using you/your",
  "topicsToRevise": ["topic 1", "topic 2", "topic 3", "topic 4"],
  "likelyQuestions": ["question 1", "question 2", "question 3"],
  "weakAreas": ["area to work on 1", "area to work on 2"],
  "practicalTips": ["practical tip 1", "practical tip 2", "practical tip 3"],
  "onlineTips": ${interviewType === 'Online' ? '["Check internet connection", "Test microphone and camera", "Join 5 minutes early", "Ensure good lighting", "Keep resume ready on screen"]' : 'null'},
  "physicalTips": ${interviewType === 'Physical' ? '["Plan travel route in advance", "Arrive 15-20 minutes early", "Dress professionally", "Carry printed resume copies", "Research company beforehand"]' : 'null'}
}`;
    } else if (currentStatus === 'Offer') {
      prompt = `${baseInfo}
The candidate received a job offer! Give offer evaluation guidance.
Respond ONLY with this JSON:
{
  "type": "offer",
  "message": "2-3 congratulatory sentences using you/your",
  "negotiationTips": ["negotiation tip 1", "negotiation tip 2", "negotiation tip 3"],
  "questionsToAsk": ["question to ask employer 1", "question 2", "question 3"],
  "thingsToReview": ["contract detail 1", "benefit to check 2", "thing to review 3"],
  "careerConsiderations": ["career growth point 1", "point 2"]
}`;
    } else if (currentStatus === 'Rejected') {
      prompt = `${baseInfo}
The candidate was rejected. Give supportive and constructive feedback.
Respond ONLY with this JSON:
{
  "type": "rejected",
  "message": "2-3 encouraging sentences, do not mention the word rejected, use you/your",
  "possibleReasons": ["possible reason 1", "possible reason 2", "possible reason 3"],
  "improvements": ["specific improvement 1", "improvement 2", "improvement 3"],
  "nextSteps": ["next step 1", "next step 2", "next step 3"],
  "motivationalNote": "one powerful motivational sentence"
}`;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      const text = data.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setStatusAI(parsed);
      await updateJob(job.id, { ai_analysis: parsed });
    } catch (e) {
      console.error('Status AI error:', e);
    } finally {
      setAiLoading(false);
    }
  }

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
    const updates: any = { company, role, location, salary, notes, status, interview_date: interviewDate, interview_type: interviewType };
    await updateJob(job!.id, updates);
    setEditing(false);
    generateStatusAI(status, { ...job, ...updates });
  }

  function handleDelete() {
    Alert.alert(
      'Delete this application?',
      `This will permanently remove your ${company} application. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteJob(job!.id);
            router.back();
          },
        },
      ]
    );
  }

  const chanceColor = statusAI?.interviewChance >= 70 ? '#10B981'
    : statusAI?.interviewChance >= 40 ? '#F97316'
    : '#EF4444';

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
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
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
          marginBottom: 12,
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
                fontSize: 20, fontWeight: '700', color: theme.text,
                borderBottomWidth: 1, borderBottomColor: theme.accent,
                paddingBottom: 4, marginBottom: 8, width: '100%', textAlign: 'center',
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
                fontSize: 14, color: theme.textSecondary,
                borderBottomWidth: 1, borderBottomColor: theme.border,
                paddingBottom: 4, marginBottom: 12, width: '100%', textAlign: 'center',
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
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: status === s ? statusColors[s].bg : theme.surfaceSecondary,
                  borderWidth: 0.5,
                  borderColor: status === s ? statusColors[s].color : theme.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: status === s ? statusColors[s].color : theme.textSecondary,
                }}>{s}</Text>
              </TouchableOpacity>
            )) : (
              <View style={{
                backgroundColor: statusColors[status]?.bg,
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: statusColors[status]?.color }}>
                  {status}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Interview fields when status is Interview */}
       {status === 'Interview' && (
          <View style={{
            backgroundColor: '#FFF7ED',
            borderRadius: 14,
            padding: 16,
            borderWidth: 0.5,
            borderColor: '#FED7AA',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', marginBottom: 12 }}>
              INTERVIEW DETAILS
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Interview Date</Text>
            <TextInput
              value={interviewDate}
              onChangeText={setInterviewDate}
              placeholder="e.g. 2026-06-20"
              placeholderTextColor={theme.textMuted}
              editable={editing}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: theme.text,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            />
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Interview Type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {interviewTypes.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => editing && setInterviewType(t)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: interviewType === t ? '#FED7AA' : theme.surface,
                    borderWidth: 0.5,
                    borderColor: interviewType === t ? '#F97316' : theme.border,
                  }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: interviewType === t ? '#F97316' : theme.textSecondary,
                  }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {interviewDate && (
              <Text style={{ fontSize: 12, color: '#F97316', marginTop: 10, fontWeight: '500' }}>
                {Math.ceil((new Date(interviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </Text>
            )}
          </View>
        )}

        {/* Details */}
        {[
          { label: 'Location', value: location, onChange: setLocation, placeholder: 'e.g. Remote' },
          { label: 'Salary', value: salary, onChange: setSalary, placeholder: 'e.g. $100,000' },
        ].map((item, i) => (
          <View key={i} style={{
            backgroundColor: theme.surface,
            borderRadius: 14, padding: 16,
            borderWidth: 0.5, borderColor: theme.border,
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>{item.label}</Text>
            {editing ? (
              <TextInput
                value={item.value}
                onChangeText={item.onChange}
                placeholder={item.placeholder}
                placeholderTextColor={theme.textMuted}
                style={{
                  fontSize: 13, color: theme.text, fontWeight: '500',
                  textAlign: 'right', minWidth: 120,
                  borderBottomWidth: 1, borderBottomColor: theme.accent,
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
          backgroundColor: theme.surface, borderRadius: 14, padding: 16,
          borderWidth: 0.5, borderColor: theme.border,
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 10,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Date Applied</Text>
          <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>{date}</Text>
        </View>

        {/* Notes */}
        <View style={{
          backgroundColor: theme.surface, borderRadius: 14, padding: 16,
          borderWidth: 0.5, borderColor: theme.border, marginBottom: 10,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 10 }}>
            NOTES
          </Text>
          {editing ? (
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 14, color: theme.text, lineHeight: 22,
                minHeight: 80, textAlignVertical: 'top',
                borderWidth: 0.5, borderColor: theme.accent,
                borderRadius: 10, padding: 10,
              }}
            />
          ) : (
            <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>
              {notes || 'No notes added.'}
            </Text>
          )}
        </View>

        {/* Job Description Expand/Collapse */}
        {jobDescription.trim().length > 0 && (
          <TouchableOpacity
            onPress={() => setShowDescription(!showDescription)}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14, padding: 16,
              borderWidth: 0.5, borderColor: theme.border,
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Job Description</Text>
            <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '500' }}>
              {showDescription ? 'Collapse' : 'Expand'}
            </Text>
          </TouchableOpacity>
        )}
        {showDescription && jobDescription.trim().length > 0 && (
          <View style={{
            backgroundColor: theme.surface, borderRadius: 14, padding: 16,
            borderWidth: 0.5, borderColor: theme.border, marginBottom: 10,
          }}>
            <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>{jobDescription}</Text>
          </View>
        )}

        {/* AI Status Analysis */}
        {aiLoading && (
          <View style={{
            backgroundColor: theme.surface, borderRadius: 16, padding: 24,
            alignItems: 'center', borderWidth: 0.5, borderColor: theme.border, marginBottom: 12,
          }}>
            <ActivityIndicator color={theme.accent} />
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 10 }}>
              AI is analyzing your application...
            </Text>
          </View>
        )}

        {/* Applied AI */}
        {!aiLoading && statusAI?.type === 'applied' && (
          <View style={{ marginBottom: 12 }}>
            <View style={{
              backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16,
              borderWidth: 0.5, borderColor: '#3B82F6', marginBottom: 10,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6', marginBottom: 8 }}>
                AI CAREER COACH
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#3B82F6', marginBottom: 4 }}>Interview Chance</Text>
                  <View style={{ height: 6, backgroundColor: '#BFDBFE', borderRadius: 3 }}>
                    <View style={{
                      height: 6, width: `${statusAI.interviewChance}%`,
                      backgroundColor: chanceColor, borderRadius: 3,
                    }} />
                  </View>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: chanceColor, marginLeft: 12 }}>
                  {statusAI.interviewChance}%
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 22, marginBottom: 12 }}>
                {statusAI.message}
              </Text>
              {statusAI.strengthAreas && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginBottom: 6 }}>YOUR STRENGTHS</Text>
                  {statusAI.strengthAreas.map((s: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8, marginTop: 6 }} />
                      <Text style={{ fontSize: 13, color: '#1E40AF', flex: 1 }}>{s}</Text>
                    </View>
                  ))}
                </>
              )}
              {statusAI.focusAreas && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', marginBottom: 6, marginTop: 10 }}>FOCUS AREAS</Text>
                  {statusAI.focusAreas.map((f: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginRight: 8, marginTop: 6 }} />
                      <Text style={{ fontSize: 13, color: '#1E40AF', flex: 1 }}>{f}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* Interview AI */}
        {!aiLoading && statusAI?.type === 'interview' && (
          <View style={{ marginBottom: 12 }}>
            <View style={{
              backgroundColor: '#FFF7ED', borderRadius: 16, padding: 16,
              borderWidth: 0.5, borderColor: '#FED7AA', marginBottom: 10,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316', marginBottom: 8 }}>
                INTERVIEW PREPARATION
              </Text>
              <Text style={{ fontSize: 14, color: '#92400E', lineHeight: 22, marginBottom: 12 }}>
                {statusAI.message}
              </Text>

              {statusAI.topicsToRevise && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', marginBottom: 6 }}>TOPICS TO REVISE</Text>
                  {statusAI.topicsToRevise.map((t: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginRight: 8, marginTop: 6 }} />
                      <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>{t}</Text>
                    </View>
                  ))}
                </>
              )}

              {statusAI.likelyQuestions && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', marginBottom: 6, marginTop: 12 }}>LIKELY QUESTIONS</Text>
                  {statusAI.likelyQuestions.map((q: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 13, color: '#92400E' }}>Q{i + 1}: {q}</Text>
                    </View>
                  ))}
                </>
              )}

              {statusAI.onlineTips && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 6, marginTop: 12 }}>ONLINE INTERVIEW TIPS</Text>
                  {statusAI.onlineTips.map((t: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 8, marginTop: 6 }} />
                      <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>{t}</Text>
                    </View>
                  ))}
                </>
              )}

              {statusAI.physicalTips && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 6, marginTop: 12 }}>IN-PERSON INTERVIEW TIPS</Text>
                  {statusAI.physicalTips.map((t: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 8, marginTop: 6 }} />
                      <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>{t}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* Offer AI */}
        {!aiLoading && statusAI?.type === 'offer' && (
          <View style={{
            backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16,
            borderWidth: 0.5, borderColor: '#6EE7B7', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981', marginBottom: 8 }}>
              OFFER RECEIVED
            </Text>
            <Text style={{ fontSize: 14, color: '#064E3B', lineHeight: 22, marginBottom: 12 }}>
              {statusAI.message}
            </Text>
            {statusAI.negotiationTips && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginBottom: 6 }}>SALARY NEGOTIATION</Text>
                {statusAI.negotiationTips.map((t: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#064E3B', flex: 1 }}>{t}</Text>
                  </View>
                ))}
              </>
            )}
            {statusAI.questionsToAsk && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginBottom: 6, marginTop: 12 }}>QUESTIONS TO ASK</Text>
                {statusAI.questionsToAsk.map((q: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#064E3B', flex: 1 }}>{q}</Text>
                  </View>
                ))}
              </>
            )}
            {statusAI.thingsToReview && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981', marginBottom: 6, marginTop: 12 }}>REVIEW BEFORE SIGNING</Text>
                {statusAI.thingsToReview.map((t: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#064E3B', flex: 1 }}>{t}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Rejected AI */}
        {!aiLoading && statusAI?.type === 'rejected' && (
          <View style={{
            backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16,
            borderWidth: 0.5, borderColor: '#FECACA', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444', marginBottom: 8 }}>
              KEEP GOING
            </Text>
            <Text style={{ fontSize: 14, color: '#7F1D1D', lineHeight: 22, marginBottom: 12 }}>
              {statusAI.message}
            </Text>
            {statusAI.improvements && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444', marginBottom: 6 }}>AREAS TO IMPROVE</Text>
                {statusAI.improvements.map((imp: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#7F1D1D', flex: 1 }}>{imp}</Text>
                  </View>
                ))}
              </>
            )}
            {statusAI.nextSteps && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444', marginBottom: 6, marginTop: 12 }}>NEXT STEPS</Text>
                {statusAI.nextSteps.map((s: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#7F1D1D', flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </>
            )}
            {statusAI.motivationalNote && (
              <View style={{
                backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginTop: 12,
              }}>
                <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '600', textAlign: 'center', lineHeight: 22 }}>
                  {statusAI.motivationalNote}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delete Button */}
        {!editing && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14,
              alignItems: 'center', borderWidth: 0.5, borderColor: '#EF4444', marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Delete Job</Text>
          </TouchableOpacity>
        )}

        {editing && (
          <TouchableOpacity
            onPress={() => setEditing(false)}
            style={{
              backgroundColor: theme.surfaceSecondary, borderRadius: 14,
              paddingVertical: 14, alignItems: 'center', marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}