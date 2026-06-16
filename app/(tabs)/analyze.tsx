import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Analyze() {
  const { theme } = useTheme();
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userExperiences, setUserExperiences] = useState<any[]>([]);
  const [result, setResult] = useState<null | {
    matchScore: number;
    strengths: string[];
    gaps: string[];
    suggestion: string;
    improvementAreas: string[];
    interviewTips: string[];
    closingMessage: string;
  }>(null);

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
    if (data?.skills && data.skills.length > 0) setUserSkills(data.skills);
    if (data?.name) setUserName(data.name.split(' ')[0]);

    const { data: expData } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id);
    if (expData && expData.length > 0) setUserExperiences(expData);
  }

  async function analyzeJob() {
    if (!jobDescription.trim()) return;
    if (jobDescription.trim().length < 20) {
      setResult({
        matchScore: 0,
        strengths: ['Input too short'],
        gaps: ['Please paste a full job description'],
        suggestion: 'Paste a real job description with at least a few sentences for accurate analysis.',
        improvementAreas: [],
        interviewTips: [],
        closingMessage: '',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const greetings = [
      `${timeGreeting} ${userName}!`,
      `Hey ${userName}!`,
      `Hi ${userName}!`,
      `Hello ${userName}!`,
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    const closings = [
      `Keep pushing ${userName}, your dream job is closer than you think!`,
      `Stay consistent ${userName}, every application brings you closer!`,
      `You've got this ${userName}, keep applying and improving!`,
      `Great effort ${userName}, the right opportunity is just around the corner!`,
      `Don't give up ${userName}, your hard work will pay off soon!`,
    ];
    const randomClosing = closings[Math.floor(Math.random() * closings.length)];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: `You are a strict and helpful career coach having a direct conversation with ${userName}.

IMPORTANT RULES FOR TONE:
- Always speak DIRECTLY to ${userName} using "you" and "your"
- NEVER refer to them in third person
- NEVER say "${userName} needs to improve" — say "you need to improve"
- NEVER say "the candidate" — say "you"

Candidate name: ${userName}
Candidate skills: ${userSkills.length > 0 ? userSkills.join(', ') : 'React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Terraform, GitHub Actions, Docker, Prisma, CI/CD, Linux'}.
Work experience: ${userExperiences.length > 0
  ? userExperiences.map(e => `${e.role} at ${e.company} (${e.months} months${e.currently_working ? ', currently working' : ''})`).join('; ')
  : 'No work experience added yet'}.
Total experience: ${userExperiences.reduce((sum: number, e: any) => sum + e.months, 0)} months.

Job Description:
${jobDescription}

RULES FOR ANALYSIS:
- If candidate lists a skill, treat it as valid — never say they lack experience with it
- Give 70+ if candidate has most required technical skills listed in their profile
- Junior candidates (under 12 months experience) should be scored on SKILLS match, not experience level
- Score is based on SKILLS match primarily, experience is secondary
- QA, Testing, Data Science, ML jobs score very low (10-30) unless candidate has those skills
- If a skill the candidate has is NOT required by the job but is still valuable, mention it as a bonus strength
- If the job requires a skill completely missing from candidate's list, mention it clearly
- Never say "you don't have experience with X" if X is listed in their skills
- Be encouraging and focus on potential for junior candidates
- Be honest but constructive — never discouraging

Respond ONLY with this exact JSON, no extra text, no markdown:
{ 
  "matchScore": <number 0-100>,
  "strengths": ["detailed strength 1 with explanation why it matters for this job", "detailed strength 2", "detailed strength 3"],
  "gaps": ["specific missing skill 1 with why it matters for this job", "specific missing skill 2", "specific missing skill 3"],
  "suggestion": "Write 3-4 sentences of very specific, honest, and helpful career advice for this exact job. Be direct, talk directly to ${userName} using you/your.",
  "improvementAreas": ["specific area with exactly how to learn it and why", "specific area 2", "specific area 3"],
  "interviewTips": ["likely interview question 1 for this specific job with detailed advice on how to answer it", "question 2 with advice", "question 3 with advice"]
}`,
            },
          ],
          max_tokens: 1200,
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      const text = data.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult({
        ...parsed,
        closingMessage: randomClosing,
        suggestion: `${randomGreeting} ${parsed.suggestion}`,
      });
    } catch (e) {
      console.error('Groq error:', e);
      setResult({
        matchScore: 0,
        strengths: ['Could not analyze — please paste a real job description'],
        gaps: ['No valid job description provided'],
        suggestion: 'Please paste a full job description to get an accurate match score.',
        improvementAreas: [],
        interviewTips: [],
        closingMessage: '',
      });
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = result
    ? result.matchScore >= 70
      ? '#10B981'
      : result.matchScore >= 40
      ? '#F97316'
      : '#EF4444'
    : theme.accent;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
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
        <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>AI Analyze</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
          Paste a job description to get your match score
        </Text>
      </View>

      <View style={{ padding: 24 }}>

        {/* Input */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 10 }}>
          JOB DESCRIPTION
        </Text>
        <TextInput
          multiline
          numberOfLines={8}
          placeholder="Paste the job description here..."
          placeholderTextColor={theme.textMuted}
          value={jobDescription}
          onChangeText={setJobDescription}
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: theme.border,
            padding: 16,
            fontSize: 14,
            color: theme.text,
            minHeight: 160,
            textAlignVertical: 'top',
          }}
        />

        {/* Analyze Button */}
        <TouchableOpacity
          onPress={analyzeJob}
          disabled={loading}
          style={{
            backgroundColor: theme.accent,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 16,
            opacity: jobDescription.trim() ? 1 : 0.4,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                Analyze with AI
              </Text>
          }
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={{ marginTop: 28 }}>

            {/* Score */}
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: theme.border,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500', marginBottom: 12 }}>
                MATCH SCORE
              </Text>
              <Text style={{ fontSize: 64, fontWeight: '700', color: scoreColor }}>
                {result.matchScore}
              </Text>
              <Text style={{ fontSize: 14, color: scoreColor, fontWeight: '600' }}>
                {result.matchScore >= 70 ? 'Strong Match' : result.matchScore >= 40 ? 'Partial Match' : 'Weak Match'}
              </Text>
            </View>

            {/* Suggestion */}
            <View style={{
              backgroundColor: '#FFF7ED',
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: '#FED7AA',
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316', marginBottom: 8 }}>
                AI SUGGESTION
              </Text>
              <Text style={{ fontSize: 14, color: '#92400E', lineHeight: 22 }}>
                {result.suggestion}
              </Text>
            </View>

            {/* Strengths */}
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981', marginBottom: 12 }}>
                STRENGTHS
              </Text>
              {result.strengths.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 10, marginTop: 6 }} />
                  <Text style={{ fontSize: 14, color: theme.text, flex: 1, lineHeight: 22 }}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Gaps */}
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444', marginBottom: 12 }}>
                SKILL GAPS
              </Text>
              {result.gaps.map((g, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 10, marginTop: 6 }} />
                  <Text style={{ fontSize: 14, color: theme.text, flex: 1, lineHeight: 22 }}>{g}</Text>
                </View>
              ))}
            </View>

            {/* Improvement Areas */}
            {result.improvementAreas && result.improvementAreas.length > 0 && (
              <View style={{
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B82F6', marginBottom: 12 }}>
                  AREAS TO IMPROVE
                </Text>
                {result.improvementAreas.map((area, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 10, marginTop: 6 }} />
                    <Text style={{ fontSize: 14, color: theme.text, flex: 1, lineHeight: 22 }}>{area}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Interview Tips */}
            {result.interviewTips && result.interviewTips.length > 0 && (
              <View style={{
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#A855F7', marginBottom: 12 }}>
                  INTERVIEW TIPS
                </Text>
                {result.interviewTips.map((tip, i) => (
                  <View key={i} style={{
                    backgroundColor: theme.surfaceSecondary,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#A855F7', marginBottom: 4 }}>
                      Q{i + 1}
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Closing Message */}
            {result.closingMessage !== '' && (
              <View style={{
                backgroundColor: theme.surfaceSecondary,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, color: theme.accent, fontWeight: '600', textAlign: 'center', lineHeight: 22 }}>
                  {result.closingMessage}
                </Text>
              </View>
            )}

          </View>
        )}
      </View>
    </ScrollView>
  );
}