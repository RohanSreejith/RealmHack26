import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { EdgeNode } from '../types';

interface EdgeNodeCardProps {
  node: EdgeNode;
}

export const EdgeNodeCard: React.FC<EdgeNodeCardProps> = ({ node }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.nodeNumber}>{node.nodeNumber}</Text>
          <Text style={styles.nodeName}>{node.name}</Text>
        </View>

        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      <View style={styles.zoneRow}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#64748B" />
        <Text style={styles.zoneLabel}>Zone:</Text>
        <Text style={styles.zoneValue}>{node.zone}</Text>
      </View>

      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryItem}>
          <Text style={styles.itemLabel}>Camera</Text>
          <View style={styles.itemValRow}>
            <Feather name="video" size={12} color="#10B981" />
            <Text style={[styles.itemVal, { color: '#10B981' }]}>{node.cameraStatus}</Text>
          </View>
        </View>

        <View style={styles.telemetryItem}>
          <Text style={styles.itemLabel}>Detection</Text>
          <View style={styles.itemValRow}>
            <MaterialCommunityIcons name="target" size={12} color="#06B6D4" />
            <Text style={[styles.itemVal, { color: '#06B6D4' }]}>{node.detectionState}</Text>
          </View>
        </View>

        <View style={styles.telemetryItem}>
          <Text style={styles.itemLabel}>Throughput</Text>
          <Text style={styles.itemVal}>{node.fps} FPS</Text>
        </View>

        <View style={styles.telemetryItem}>
          <Text style={styles.itemLabel}>Hardware</Text>
          <Text style={styles.itemVal}>CPU {node.cpuPercent}% | MEM {node.memoryPercent}%</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.ipBadge}>
          <Text style={styles.ipText}>{node.ipAddress}</Text>
        </View>
        <Text style={styles.syncText}>Last sync: {node.lastSyncSecondsAgo} sec ago</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131B2A',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodeNumber: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '900',
    backgroundColor: '#0C2735',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D261E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  zoneLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  zoneValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  telemetryItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0B0F17',
    borderRadius: 6,
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  itemLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemVal: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  ipBadge: {
    backgroundColor: '#0B0F17',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ipText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  syncText: {
    color: '#94A3B8',
    fontSize: 10,
  },
});
