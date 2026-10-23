import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EdgeNode } from '../types';
import { EdgeNodeCard } from '../components/EdgeNodeCard';

interface EdgeNodesScreenProps {
  nodes: EdgeNode[];
}

export const EdgeNodesScreen: React.FC<EdgeNodesScreenProps> = ({ nodes }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>EDGE NODE INFRASTRUCTURE</Text>
        <Text style={styles.subtitle}>
          Hardware health, inference FPS, and RTSP stream status across physical edge units.
        </Text>
      </View>

      <View style={styles.nodesList}>
        {nodes.map((node) => (
          <EdgeNodeCard key={node.id} node={node} />
        ))}
      </View>

      <View style={styles.infoCallout}>
        <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#06B6D4" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Zero Single Point of Failure</Text>
          <Text style={styles.infoText}>
            If the cloud link disconnects, each edge node continues processing local camera feeds and executing deterministic safety sirens with zero interruptions.
          </Text>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  content: {
    padding: 16,
  },
  headerBlock: {
    marginBottom: 14,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  nodesList: {
    marginBottom: 12,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#0C202F',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  infoText: {
    color: '#BAE6FD',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
