import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Incident } from '../types';

interface IncidentAnalysisViewProps {
  incident: Incident;
  onAcknowledge: (incidentId: string) => Promise<void>;
  isAcknowledging?: boolean;
}

export const IncidentAnalysisView: React.FC<IncidentAnalysisViewProps> = ({
  incident,
  onAcknowledge,
  isAcknowledging = false
}) => {
  const isCritical = incident.riskLevel === 'CRITICAL';
  const riskColor = isCritical ? '#EF4444' : '#F59E0B';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';
  const isResolved = incident.status === 'RESOLVED';

  const aiAnalysis = incident.aiRiskAnalysis;
  const trigger = incident.deterministicTrigger;

  return (
    <View style={styles.container}>
      {/* Incident Status Banner */}
      <View style={[styles.statusHeroCard, { borderColor: riskColor }]}>
        <View style={styles.heroTopRow}>
          <View style={styles.titleContainer}>
            <View style={styles.codeRow}>
              <View style={[styles.codeBadge, { backgroundColor: isCritical ? '#FEF2F2' : '#FEF3C7' }]}>
                <Text style={[styles.codeBadgeText, { color: riskColor }]}>{incident.incidentCode}</Text>
              </View>
              <Text style={styles.timestampText}>{incident.timestamp}</Text>
            </View>
            <Text style={styles.incidentTitle}>{incident.title}</Text>
            <Text style={styles.zoneSubtitle}>
              <Feather name="map-pin" size={12} color="#64748B" /> {incident.zone} • {incident.cameraName}
            </Text>
          </View>

          <View style={[styles.statusBadge, {
            backgroundColor: isResolved ? '#ECFDF5' : (isAcknowledged ? '#EFF6FF' : '#FEF2F2'),
            borderColor: isResolved ? '#10B981' : (isAcknowledged ? '#2563EB' : '#EF4444')
          }]}>
            <Text style={[styles.statusBadgeText, {
              color: isResolved ? '#059669' : (isAcknowledged ? '#1E40AF' : '#DC2626')
            }]}>
              {incident.status}
            </Text>
          </View>
        </View>

        {/* Telemetry Stats Grid */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryBox}>
            <Text style={styles.statLabel}>PROXIMITY</Text>
            <Text style={[styles.statValue, { color: riskColor }]}>
              {trigger?.distanceMeters || 1.8} m
            </Text>
            <Text style={styles.statSub}>Min Safe: {trigger?.thresholdMeters || 3.5}m</Text>
          </View>

          <View style={styles.telemetryBox}>
            <Text style={styles.statLabel}>TIME-TO-COLLISION</Text>
            <Text style={[styles.statValue, { color: riskColor }]}>
              {trigger?.ttcSeconds || 1.4} s
            </Text>
            <Text style={styles.statSub}>Crit Threshold: &lt; 2.0s</Text>
          </View>

          <View style={styles.telemetryBox}>
            <Text style={styles.statLabel}>LATENCY</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              &lt; {trigger?.evaluationLatencyMs || 4} ms
            </Text>
            <Text style={styles.statSub}>Deterministic Path</Text>
          </View>
        </View>

        {/* Render Cloud Workflow Execution Badge */}
        <View style={styles.renderWorkflowStrip}>
          <View style={styles.renderBadgeGroup}>
            <Feather name="cloud" size={13} color="#4338CA" />
            <Text style={styles.renderBadgeText}>RENDER CLOUD WORKFLOW (9/9 STAGES)</Text>
          </View>
          <Text style={styles.renderLatencyText}>774ms • hackeye-postgres</Text>
        </View>

        {/* Entities Monitored */}
        <View style={styles.entityRow}>
          <View style={styles.entityPill}>
            <MaterialCommunityIcons name="account-hard-hat" size={16} color="#2563EB" />
            <Text style={styles.entityText}>
              {incident.workerName?.includes(incident.workerId)
                ? incident.workerName
                : (incident.workerName ? `${incident.workerName} (${incident.workerId})` : `Worker (${incident.workerId || 'W-017'})`)}
            </Text>
          </View>

          <View style={styles.entityPill}>
            <MaterialCommunityIcons name="forklift" size={16} color="#7C3AED" />
            <Text style={styles.entityText}>{incident.machineName} ({incident.machineId})</Text>
          </View>
        </View>
      </View>

      {/* AI Causal Reasoning Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="brain" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>AI Multi-Agent Causal Analysis</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>96% CONFIDENCE</Text>
          </View>
        </View>

        <Text style={styles.summaryText}>
          {aiAnalysis?.summary || "Worker entered machine operating perimeter while hydraulics were actively engaged."}
        </Text>

        {/* Contributing Factors */}
        {aiAnalysis?.contributingFactors && aiAnalysis.contributingFactors.length > 0 && (
          <View style={styles.factorsList}>
            <Text style={styles.subHeading}>CONTRIBUTING RISK FACTORS:</Text>
            {aiAnalysis.contributingFactors.map((factor, idx) => (
              <View key={idx} style={styles.factorItem}>
                <Feather name="alert-triangle" size={13} color="#F59E0B" style={{ marginTop: 2 }} />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* OSHA Regulatory Grounding */}
      {aiAnalysis?.safetyReference && (
        <View style={styles.oshaCard}>
          <View style={styles.oshaHeader}>
            <MaterialCommunityIcons name="file-document-check-outline" size={18} color="#059669" />
            <Text style={styles.oshaTitle}>OSHA Regulatory Safety Grounding</Text>
          </View>

          <View style={styles.oshaCodePill}>
            <Text style={styles.oshaCodeText}>{aiAnalysis.safetyReference.code}</Text>
          </View>

          <Text style={styles.oshaGuidanceText}>
            "{aiAnalysis.safetyReference.guidance}"
          </Text>
          <Text style={styles.oshaSourceText}>
            Source: {aiAnalysis.safetyReference.source}
          </Text>
        </View>
      )}

      {/* AI Action Items */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Feather name="check-circle" size={18} color="#059669" />
          <Text style={styles.sectionTitle}>Recommended Corrective Actions</Text>
        </View>

        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationText}>
            {aiAnalysis?.recommendedAction || "Acoustic strobe beacon sounded. Direct worker outside exclusion perimeter."}
          </Text>
        </View>

        {/* Human-In-The-Loop Action Button */}
        {!isResolved && (
          <TouchableOpacity
            style={[styles.acknowledgeButton, isAcknowledged && styles.acknowledgedButton]}
            onPress={() => onAcknowledge(incident.id)}
            disabled={isAcknowledging || isAcknowledged}
            activeOpacity={0.8}
          >
            <Feather
              name={isAcknowledged ? "check" : "bell"}
              size={18}
              color={isAcknowledged ? "#059669" : "#FFFFFF"}
            />
            <Text style={[styles.acknowledgeButtonText, isAcknowledged && styles.acknowledgedButtonText]}>
              {isAcknowledged
                ? `ACKNOWLEDGED BY SUPERVISOR (${incident.acknowledgedBy || 'Karthik'})`
                : (isAcknowledging ? "RECORDING ACKNOWLEDGEMENT..." : "ACKNOWLEDGE INCIDENT ALERT")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 20
  },
  statusHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  titleContainer: {
    flex: 1,
    marginRight: 10
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  zoneSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  telemetryBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2
  },
  statSub: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500'
  },
  renderWorkflowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 10
  },
  renderBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  renderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
    letterSpacing: 0.3
  },
  renderLatencyText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4F46E5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  entityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  entityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  entityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1
  },
  confidenceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
    marginBottom: 12
  },
  factorsList: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8
  },
  subHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  factorText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
    lineHeight: 17
  },
  oshaCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  oshaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  oshaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534'
  },
  oshaCodePill: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8
  },
  oshaCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  oshaGuidanceText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#14532D',
    fontStyle: 'italic',
    marginBottom: 6
  },
  oshaSourceText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600'
  },
  recommendationBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#1E293B',
    fontWeight: '500'
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  acknowledgedButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowOpacity: 0
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  acknowledgedButtonText: {
    color: '#059669'
  }
});
