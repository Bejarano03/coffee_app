import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantPanel } from './assistant-panel';

interface AssistantOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const AssistantOverlay = ({ visible, onClose }: AssistantOverlayProps) => {
  const insets = useSafeAreaInsets();
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

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} accessibilityRole="button" />
        <View style={wrapperStyle} pointerEvents="box-none">
          <View style={styles.sheet}>
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
    backgroundColor: 'rgba(5, 10, 24, 0.65)',
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
