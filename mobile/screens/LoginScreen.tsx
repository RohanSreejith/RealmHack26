import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface LoginScreenProps {
  onLoginSuccess: (userRole: string) => void;
  onEnterDemoMode: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onEnterDemoMode
}) => {
  const [email, setEmail] = useState('supervisor.dave@hackeye.ai');
  const [password, setPassword] = useState('••••••••••••');

  const handleSignIn = () => {
    onLoginSuccess('Site Supervisor');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner */}
        <View style={styles.brandHero}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-alert-outline" size={48} color="#06B6D4" />
          </View>
          <Text style={styles.brandName}>HACK-EYE</Text>
          <Text style={styles.brandTagline}>Detect. Understand. Protect.</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Industrial Safety Intelligence</Text>
          </View>
        </View>

        {/* Login Form Box */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>SUPERVISOR PORTAL</Text>
          <Text style={styles.formSubtitle}>Authenticate to access live edge swarm telemetry</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OFFICIAL EMAIL</Text>
            <View style={styles.inputRow}>
              <Feather name="mail" size={16} color="#64748B" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="supervisor@site.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SECURITY KEY</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={16} color="#64748B" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#475569"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
            <Feather name="arrow-right" size={16} color="#0B0F17" />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR QUICK EVALUATION</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* DEMO MODE BUTTON FOR JUDGES */}
          <TouchableOpacity
            style={styles.demoModeButton}
            onPress={onEnterDemoMode}
            activeOpacity={0.8}
          >
            <View style={styles.demoIconBadge}>
              <MaterialCommunityIcons name="play-circle-outline" size={20} color="#06B6D4" />
            </View>
            <View style={styles.demoTextGroup}>
              <Text style={styles.demoButtonTitle}>ENTER DEMO MODE</Text>
              <Text style={styles.demoButtonSubtitle}>Explore pre-configured 12-step safety scenario</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#06B6D4" />
          </TouchableOpacity>
        </View>

        {/* Industrial Architecture Note */}
        <View style={styles.architectureNote}>
          <MaterialCommunityIcons name="chip" size={16} color="#64748B" />
          <Text style={styles.architectureText}>
            Edge Vision (<Text style={styles.highlight}>YOLO + Depth</Text>) runs on local nodes.
            Render orchestrates swarm alerts and AI risk analysis.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#131B2A',
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandTagline: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 8,
  },
  badgePillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#131B2A',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  formTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  signInButtonText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  demoModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C2735',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
  },
  demoIconBadge: {
    marginRight: 10,
  },
  demoTextGroup: {
    flex: 1,
  },
  demoButtonTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoButtonSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  architectureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  architectureText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  highlight: {
    color: '#06B6D4',
    fontWeight: '600',
  },
});
