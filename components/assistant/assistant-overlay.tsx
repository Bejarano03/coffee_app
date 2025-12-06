import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantPanel } from './assistant-panel';
import { useBrandColors } from '@/hooks/use-brand-colors';

interface AssistantOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const AssistantOverlay = ({ visible, onClose }: AssistantOverlayProps) => {
  const insets = useSafeAreaInsets();
  const brand = useBrandColors();
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const wrapperStyle = useMemo(
    () => [
      styles.panelWrapper,
      {
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
      },
    ],
    [insets.bottom, insets.top],
  );

  const sheetStyle = useMemo(
    () => [
      styles.sheet,
      {
        backgroundColor: brand.sheet,
        shadowColor: brand.scheme === 'dark' ? '#000' : '#0B1427',
      },
    ],
    [brand],
  );

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: brand.overlay }]}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} accessibilityRole="button" />
        <View style={wrapperStyle} pointerEvents="box-none">
          <View style={sheetStyle}>
            <AssistantPanel onClose={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panelWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
