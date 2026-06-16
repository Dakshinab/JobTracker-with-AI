import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useExperienceStore, formatDuration } from '../../stores/experienceStore';

const ALL_SKILLS = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Bash', 'PowerShell', 'Groovy',
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Redux', 'Zustand', 'GraphQL', 'WebSockets', 'Three.js', 'D3.js',
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'NestJS', 'Prisma', 'REST API', 'gRPC', 'Microservices',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Puppet', 'Chef', 'Vagrant', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'ArgoCD', 'Helm', 'CI/CD', 'Linux', 'Nginx', 'Apache',
  'AWS', 'Azure', 'GCP', 'AWS Lambda', 'AWS EC2', 'AWS S3', 'AWS RDS', 'AWS EKS', 'Azure DevOps', 'Google Cloud Run', 'Serverless', 'Cloudflare', 'Vercel', 'Netlify',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'Neo4j', 'InfluxDB', 'Supabase', 'Firebase', 'PlanetScale',
  'React Native', 'Flutter', 'Swift', 'SwiftUI', 'Expo', 'Ionic', 'Xamarin',
  'Jest', 'Cypress', 'Selenium', 'Playwright', 'JUnit', 'PyTest', 'Mocha', 'Chai', 'Postman', 'K6', 'JMeter',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'OpenCV', 'LangChain', 'Hugging Face', 'OpenAI API', 'Pandas', 'NumPy', 'Jupyter', 'MLflow', 'Vertex AI', 'SageMaker',
  'Penetration Testing', 'OWASP', 'Burp Suite', 'Vault', 'SSL/TLS', 'OAuth', 'JWT', 'IAM', 'Zero Trust', 'SIEM', 'Nmap', 'Wireshark',
  'TCP/IP', 'DNS', 'VPN', 'Load Balancing', 'CDN', 'HTTP/HTTPS', 'WebRTC', 'Istio', 'Service Mesh',
  'Grafana', 'Datadog', 'Prometheus', 'ELK Stack', 'Splunk', 'New Relic', 'PagerDuty', 'CloudWatch', 'Jaeger', 'Zipkin',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
  'Scrum', 'Agile', 'Jira', 'Confluence', 'Kanban', 'Trello', 'Notion', 'Linear',
  'Apache Spark', 'Kafka', 'Airflow', 'dbt', 'Hadoop', 'Flink', 'Snowflake', 'BigQuery', 'Redshift', 'Databricks',
  'REST', 'Swagger', 'OpenAPI', 'Insomnia',
  'Microservices', 'Event-Driven Architecture', 'Serverless Architecture', 'Domain-Driven Design', 'CQRS', 'Clean Architecture',
  'VS Code', 'IntelliJ', 'Figma', 'Slack', 'Linux Administration', 'Windows Server', 'Vim', 'tmux',
];

export default function Profile() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Experience
  const { experiences, fetchExperiences, addExperience, deleteExperience } = useExperienceStore();
  const [addingExp, setAddingExp] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expMonths, setExpMonths] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);

  const filteredSuggestions = skillSearch.trim().length > 0
    ? ALL_SKILLS.filter(s =>
        s.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !skills.includes(s)
      ).slice(0, 8)
    : [];

  const totalMonths = experiences.reduce((sum, e) => sum + e.months, 0);

  useEffect(() => {
    loadProfile();
    fetchExperiences();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setEmail(user.email || '');
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setName(data.name || '');
      setRole(data.role || '');
      setLocation(data.location || '');
      setGithub(data.github || '');
      setLinkedin(data.linkedin || '');
      setPortfolio(data.portfolio || '');
      if (data.skills && data.skills.length > 0) setSkills(data.skills);
    }
    setLoading(false);
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id, name, role, location, github, linkedin, portfolio, email, skills,
    });
    setEditing(false);
    setSkillSearch('');
    setShowSuggestions(false);
  }

  async function handleAddExperience() {
    if (!expCompany.trim() || !expRole.trim() || !expMonths.trim()) return;
    await addExperience({
      company: expCompany,
      role: expRole,
      months: parseInt(expMonths),
      currently_working: expCurrent,
    });
    setExpCompany('');
    setExpRole('');
    setExpMonths('');
    setExpCurrent(false);
    setAddingExp(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)');
  }

  function addSkillFromSearch(skill: string) {
    if (!skills.includes(skill)) setSkills([...skills, skill]);
    setSkillSearch('');
    setShowSuggestions(false);
  }

  function addCustomSkill() {
    const trimmed = skillSearch.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setSkillSearch('');
    setShowSuggestions(false);
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter(s => s !== skill));
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const fields = [
    { label: 'NAME', value: name, onChange: setName, placeholder: 'Your full name' },
    { label: 'ROLE', value: role, onChange: setRole, placeholder: 'e.g. Full Stack & DevOps Engineer' },
    { label: 'LOCATION', value: location, onChange: setLocation, placeholder: 'e.g. Colombo, Sri Lanka' },
    { label: 'GITHUB', value: github, onChange: setGithub, placeholder: 'github.com/username' },
    { label: 'LINKEDIN', value: linkedin, onChange: setLinkedin, placeholder: 'linkedin.com/in/username' },
    { label: 'PORTFOLIO', value: portfolio, onChange: setPortfolio, placeholder: 'yourportfolio.com' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{
          backgroundColor: theme.surface,
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 24,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
          alignItems: 'center',
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>
              {name ? name[0].toUpperCase() : email ? email[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>{name || 'Your Name'}</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>{role || 'Your Role'}</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>{location || 'Your Location'}</Text>
          {totalMonths > 0 && (
            <View style={{
              backgroundColor: theme.accentLight,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginTop: 12,
              borderWidth: 0.5,
              borderColor: theme.accent,
            }}>
              <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600' }}>
                {formatDuration(totalMonths)} total experience
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 24 }}>

          {/* Fields */}
          {fields.map((field, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 }}>
                {field.label}
              </Text>
              {editing ? (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: theme.accent,
                    padding: 14,
                    fontSize: 15,
                    color: theme.text,
                  }}
                />
              ) : (
                <View style={{
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  padding: 14,
                }}>
                  <Text style={{ fontSize: 15, color: field.value ? theme.text : theme.textMuted }}>
                    {field.value || field.placeholder}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Skills */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 12 }}>
            SKILLS
          </Text>

          {editing && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  value={skillSearch}
                  onChangeText={(text) => { setSkillSearch(text); setShowSuggestions(true); }}
                  placeholder="Search or type a skill..."
                  placeholderTextColor={theme.textMuted}
                  style={{
                    flex: 1,
                    backgroundColor: theme.surface,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: theme.accent,
                    padding: 14,
                    fontSize: 15,
                    color: theme.text,
                    marginRight: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={addCustomSkill}
                  style={{
                    backgroundColor: theme.accent,
                    borderRadius: 14,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22, color: '#fff', fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  marginTop: 6,
                  overflow: 'hidden',
                }}>
                  {filteredSuggestions.map((skill, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => addSkillFromSearch(skill)}
                      style={{
                        padding: 14,
                        borderBottomWidth: i < filteredSuggestions.length - 1 ? 0.5 : 0,
                        borderBottomColor: theme.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: 14, color: theme.text }}>{skill}</Text>
                      <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600' }}>+ Add</Text>
                    </TouchableOpacity>
                  ))}
                  {skillSearch.trim().length > 0 && !ALL_SKILLS.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
                    <TouchableOpacity
                      onPress={addCustomSkill}
                      style={{
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.accentLight,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: theme.accent }}>Add "{skillSearch.trim()}"</Text>
                      <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600' }}>+ Custom</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {skills.length === 0 && !editing && (
              <Text style={{ fontSize: 14, color: theme.textMuted }}>No skills added yet. Tap Edit Profile to add.</Text>
            )}
            {skills.map((skill, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => editing && removeSkill(skill)}
                style={{
                  backgroundColor: editing ? theme.accentLight : theme.surface,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderWidth: 0.5,
                  borderColor: editing ? theme.accent : theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, color: editing ? theme.accent : theme.text, fontWeight: '500' }}>
                  {skill}
                </Text>
                {editing && (
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700', marginLeft: 6 }}>x</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Work Experience */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>
              WORK EXPERIENCE
            </Text>
            <TouchableOpacity onPress={() => setAddingExp(!addingExp)}>
              <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600' }}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Add Experience Form */}
          {addingExp && (
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.accent,
              marginBottom: 16,
            }}>
              <TextInput
                value={expCompany}
                onChangeText={setExpCompany}
                placeholder="Company name"
                placeholderTextColor={theme.textMuted}
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: theme.text,
                  marginBottom: 10,
                }}
              />
              <TextInput
                value={expRole}
                onChangeText={setExpRole}
                placeholder="Your role"
                placeholderTextColor={theme.textMuted}
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: theme.text,
                  marginBottom: 10,
                }}
              />
              <TextInput
                value={expMonths}
                onChangeText={setExpMonths}
                placeholder="Duration in months (e.g. 6)"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: theme.text,
                  marginBottom: 10,
                }}
              />
              {expMonths.trim().length > 0 && (
                <Text style={{ fontSize: 12, color: theme.accent, marginBottom: 10 }}>
                  = {formatDuration(parseInt(expMonths) || 0)}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ fontSize: 14, color: theme.text }}>Currently working here</Text>
                <Switch
                  value={expCurrent}
                  onValueChange={setExpCurrent}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#fff"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setAddingExp(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.surfaceSecondary,
                    borderRadius: 10,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddExperience}
                  style={{
                    flex: 1,
                    backgroundColor: theme.accent,
                    borderRadius: 10,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Experience List */}
          {experiences.length === 0 && !addingExp && (
            <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 24 }}>
              No experience added yet. Tap + Add to add your work history.
            </Text>
          )}

          {experiences.map((exp, i) => (
            <View key={i} style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
              marginBottom: 10,
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.accent }}>
                  {exp.company[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{exp.role}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{exp.company}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>{formatDuration(exp.months)}</Text>
                  {exp.currently_working && (
                    <View style={{ backgroundColor: theme.accentLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600' }}>Current</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteExperience(exp.id)}>
                <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Edit / Save buttons */}
          {!editing ? (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', marginBottom: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => { setEditing(false); setSkillSearch(''); }}
                style={{
                  flex: 1,
                  backgroundColor: theme.surfaceSecondary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveProfile}
                style={{
                  flex: 1,
                  backgroundColor: theme.accent,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: theme.dangerLight,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: '#EF4444',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Sign Out</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}