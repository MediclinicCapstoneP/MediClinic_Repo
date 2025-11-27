import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatbotModal } from './ChatbotModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface FloatingChatButtonProps {
  bottomOffset?: number;
  rightOffset?: number;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  bottomOffset = 20,
  rightOffset = 20,
}) => {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [position, setPosition] = useState({ x: screenWidth - 76, y: screenHeight - 200 });
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const insets = useSafeAreaInsets();

  const handleDrag = (gestureState: any) => {
    if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
      let newX = position.x + gestureState.dx;
      let newY = position.y + gestureState.dy;

      // Constrain to screen bounds
      const buttonSize = 56;
      const padding = 10;
      const minX = padding;
      const maxX = screenWidth - buttonSize - padding;
      const minY = padding + 50;
      const maxY = screenHeight - buttonSize - padding - insets.bottom;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      // Snap to edges
      if (newX < screenWidth / 2) {
        newX = minX;
      } else {
        newX = maxX;
      }

      setPosition({ x: newX, y: newY });
      pan.setValue({ x: 0, y: 0 });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        handleDrag(gestureState);
      },
    })
  ).current;

  const handlePress = () => {
    // Add a subtle animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsChatbotVisible(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { translateX: Animated.add(pan.x, new Animated.Value(position.x)) },
              { translateY: Animated.add(pan.y, new Animated.Value(position.y)) }
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.buttonContent, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="chatbubble" size={24} color="white" />
            {/* Optional: Add notification dot */}
            <View style={styles.notificationDot} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chatbot Modal */}
      <ChatbotModal
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonContent: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
});
