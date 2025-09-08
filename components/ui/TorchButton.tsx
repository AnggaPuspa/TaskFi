// ================================================================
// TORCH BUTTON COMPONENT
// ================================================================
// Camera flash toggle control
// ================================================================

import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TorchButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function TorchButton({ isEnabled, onToggle, disabled = false }: TorchButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, disabled && styles.disabled]} 
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isEnabled ? ['#F59E0B', '#D97706'] : ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          {/* Flash icon using Unicode characters */}
          <FlashIcon isEnabled={isEnabled} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function FlashIcon({ isEnabled }: { isEnabled: boolean }) {
  return (
    <View style={styles.flashIcon}>
      {/* Lightning bolt path using text */}
      <View style={styles.lightningBolt}>
        <View style={[
          styles.boltTop,
          { backgroundColor: isEnabled ? '#FFF' : '#FFF' }
        ]} />
        <View style={[
          styles.boltBottom,
          { backgroundColor: isEnabled ? '#FFF' : '#FFF' }
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightningBolt: {
    width: 16,
    height: 20,
    position: 'relative',
  },
  boltTop: {
    position: 'absolute',
    top: 0,
    left: 6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 4,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
  },
  boltBottom: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
  },
});
