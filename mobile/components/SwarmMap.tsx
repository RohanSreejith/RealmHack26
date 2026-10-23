import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SwarmStatus, EdgeNode } from '../types';

interface SwarmMapProps {
  swarm: SwarmStatus;
  nodes: EdgeNode[];
}

export const SwarmMap: React.FC<SwarmMapProps> = ({ swarm, nodes }) => {
  return (
    <View style={styles.container}>
      {/* Overview Metric Banner */}
      <View style={styles.metricsBanner}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>SWARM STATUS</Text>
          <View style={styles.metricValueRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.metricValue}>{swarm.onlineNodes} / {swarm.totalNodes} Nodes Online</Text>
          </View>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>ACTIVE HAZARD SIGNALS</Text>
          <Text style={[styles.metricValue, { color: swarm.activeHazardSignals > 0 ? '#EF4444' : '#10B981' }]}>
            {swarm.activeHazardSignals} Signals
          </Text>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>MESH LATENCY</Text>
          <Text style={[styles.metricValue, { color: '#06B6D4' }]}>{swarm.meshLatencyMs} ms</Text>
        </View>
      </View>

      {/* Explanatory Callout */}
      <View style={styles.explanationBox}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#06B6D4" />
        <Text style={styles.explanationText}>
          Each Hack-Eye edge node independently monitors its zone and shares relevant safety events with neighboring nodes to maintain distributed awareness across the facility.
        </Text>
      </View>

      {/* Facility Distributed Topology Diagram */}
      <View style={styles.topologyCanvas}>
        <Text style={styles.topologyTitle}>FACILITY EDGE TOPOLOGY</Text>

        <View style={styles.nodesGrid}>
          {nodes.map((node) => (
            <View key={node.id} style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View style={styles.nodeNumberBadge}>
                  <Text style={styles.nodeNumberText}>{node.nodeNumber}</Text>
                </View>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>ONLINE</Text>
                </View>
              </View>

              <Text style={styles.nodeZone}>{node.zone.toUpperCase()}</Text>

              <View style={styles.nodeMeta}>
                <Text style={styles.nodeMetaItem}>{node.fps} FPS</Text>
                <Text style={styles.nodeMetaDot}>•</Text>
                <Text style={styles.nodeMetaItem}>CPU {node.cpuPercent}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Live Swarm Inter-Node Signal Feed */}
        <View style={styles.signalsSection}>
          <Text style={styles.signalsHeader}>LIVE INTER-NODE SIGNALS</Text>

          {swarm.signals.map((sig) => (
            <View key={sig.id} style={styles.signalCard}>
              <View style={styles.signalRouteRow}>
                <View style={styles.signalEndpoint}>
                  <MaterialCommunityIcons name="radio-tower" size={14} color="#EF4444" />
                  <Text style={styles.sourceText}>{sig.sourceNodeName}</Text>
                </View>

                <View style={styles.arrowContainer}>
                  <Text style={styles.arrowPulse}>➔ ➔ ➔</Text>
                </View>

                <View style={styles.signalEndpoint}>
                  <MaterialCommunityIcons name="shield-sync" size={14} color="#06B6D4" />
                  <Text style={styles.targetText}>{sig.targetNodeName}</Text>
                </View>
              </View>

              <Text style={styles.signalMsg}>{sig.message}</Text>

              <View style={styles.signalFooter}>
                <Text style={styles.sigTime}>{sig.timestamp}</Text>
                <View style={styles.sigStatusBadge}>
                  <Feather name="check-circle" size={11} color="#10B981" />
                  <Text style={styles.sigStatusText}>AWARENESS UPDATED</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  metricsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0C202F',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
  },
  explanationText: {
    color: '#BAE6FD',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  topologyCanvas: {
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topologyTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  nodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  nodeCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeNumberBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeNumberText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  nodeZone: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  nodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeMetaItem: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  nodeMetaDot: {
    color: '#475569',
    fontSize: 10,
  },
  signalsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  signalsHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  signalCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  signalRouteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  signalEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  targetText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingHorizontal: 4,
  },
  arrowPulse: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  signalMsg: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  signalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigTime: {
    color: '#64748B',
    fontSize: 10,
  },
  sigStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sigStatusText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
});
