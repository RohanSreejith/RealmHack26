import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Incident } from '../types';

interface RiskAnalysisProps {
  incident: Incident;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ incident }) => {
  const trigger = incident.deterministicTrigger;
  const ai = incident.aiRiskAnalysis;

  return (
    <View style={styles.container}>
      {/* 1. DETERMINISTIC SAFETY ENGINE (NOT AN LLM) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.engineBadge}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#06B6D4" />
            <Text style={styles.engineBadgeText}>EDGE DETERMINISTIC PATH</Text>
          </View>
          <Text style={styles.latencyText}>{trigger.evaluationLatencyMs}ms edge execution</Text>
        </View>

        <Text style={styles.sectionTitle}>Immediate Safety Trigger</Text>
        <Text style={styles.sectionSubtitle}>
          Evaluated locally on edge node hardware without cloud or LLM dependency.
        </Text>

        <View style={styles.checklist}>
          <View style={styles.checkItem}>
            <Feather name={trigger.workerDetected ? "check-circle" : "circle"} size={16} color="#10B981" />
            <Text style={styles.checkText}>Worker detected (Ground crew in sector)</Text>
          </View>

          <View style={styles.checkItem}>
            <Feather name={trigger.machineDetected ? "check-circle" : "circle"} size={16} color="#10B981" />
            <Text style={styles.checkText}>
              Machine detected ({incident.machineName})
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Feather name={trigger.machineActive ? "check-circle" : "circle"} size={16} color="#10B981" />
            <Text style={styles.checkText}>Machine active (Hydraulics &amp; rotation engaged)</Text>
          </View>

          <View style={styles.checkItem}>
            <Feather name={trigger.hazardZoneBreached ? "alert-triangle" : "circle"} size={16} color="#EF4444" />
            <Text style={[styles.checkText, { color: '#EF4444' }]}>
              Hazard zone breached (Distance: {trigger.distanceMeters}m &lt; {trigger.thresholdMeters}m threshold)
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Feather name="clock" size={16} color="#EF4444" />
            <Text style={[styles.checkText, { color: '#EF4444' }]}>
              Time-To-Collision: {trigger.ttcSeconds}s (Critical &lt; 2.0s)
            </Text>
          </View>
        </View>

        <View style={styles.triggerBox}>
          <Text style={styles.triggerLabel}>DETERMINISTIC TRIGGER</Text>
          <Text style={styles.triggerBody}>{trigger.triggerHeadline}</Text>
        </View>
      </View>

      {/* 2. AI RISK ANALYSIS (LLM-POWERED ASYNCHRONOUS LAYER) */}
      <View style={[styles.sectionCard, styles.aiCard]}>
        <View style={styles.sectionHeader}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="brain" size={16} color="#A855F7" />
            <Text style={styles.aiBadgeText}>AI SAFETY AGENT (ASYNC REASONING)</Text>
          </View>
          <Text style={styles.latencyText}>{ai.latencySeconds}s async</Text>
        </View>

        <View style={styles.aiMetaRow}>
          <View style={styles.aiMetaItem}>
            <Text style={styles.aiMetaLabel}>ASSESSED RISK</Text>
            <Text style={[styles.aiMetaValue, { color: '#EF4444' }]}>{ai.riskLevel}</Text>
          </View>

          <View style={styles.aiMetaItem}>
            <Text style={styles.aiMetaLabel}>AI CONFIDENCE</Text>
            <Text style={[styles.aiMetaValue, { color: '#A855F7' }]}>
              {Math.round(ai.confidence * 100)}%
            </Text>
          </View>
        </View>

        <Text style={styles.aiSubheader}>Root Cause Analysis</Text>
        <Text style={styles.aiSummary}>{ai.summary}</Text>

        <Text style={styles.aiSubheader}>Contributing Risk Factors</Text>
        <View style={styles.factorsList}>
          {ai.contributingFactors.map((factor, index) => (
            <View key={index} style={styles.factorRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationCard}>
          <View style={styles.recHeaderRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#10B981" />
            <Text style={styles.recTitle}>RECOMMENDED SUPERVISOR ACTION</Text>
          </View>
          <Text style={styles.recText}>{ai.recommendedAction}</Text>
        </View>
      </View>

      {/* 3. SAFETY REFERENCE (FIRECRAWL GROUNDING) */}
      <View style={styles.knowledgeCard}>
        <View style={styles.knowledgeHeader}>
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#06B6D4" />
          <Text style={styles.knowledgeTitle}>REGULATORY GROUNDING (FIRECRAWL)</Text>
        </View>
        <Text style={styles.refTitle}>{ai.safetyReference.title}</Text>
        <Text style={styles.refCode}>Standard: {ai.safetyReference.code}</Text>
        <Text style={styles.refGuidance}>{ai.safetyReference.guidance}</Text>
        <Text style={styles.refSource}>Source: {ai.safetyReference.source}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  aiCard: {
    borderColor: '#2E1065',
    backgroundColor: '#141026',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0C2735',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#06B6D4',
  },
  engineBadgeText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#28133E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#A855F7',
  },
  aiBadgeText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  latencyText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  checklist: {
    gap: 8,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  triggerBox: {
    backgroundColor: '#0B0F17',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
  },
  triggerLabel: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  triggerBody: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  aiMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  aiMetaItem: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  aiMetaLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiMetaValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  aiSubheader: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  aiSummary: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  factorsList: {
    gap: 6,
    marginBottom: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A855F7',
    marginTop: 7,
  },
  factorText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  recommendationCard: {
    backgroundColor: '#0D261E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 6,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recTitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recText: {
    color: '#F0FDF4',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  knowledgeCard: {
    backgroundColor: '#0C1E2E',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  knowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  knowledgeTitle: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  refTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  refCode: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  refGuidance: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  refSource: {
    color: '#64748B',
    fontSize: 10,
    fontStyle: 'italic',
  },
});
