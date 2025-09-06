import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  FadeIn,
  FadeOut,
  Layout,
  RotateInUpLeft,
  RotateOutUpRight,
} from 'react-native-reanimated';

// Animation configurations
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const TIMING_CONFIG = {
  duration: 300,
};

// Common animated styles
export const useScaleAnimation = (initialScale = 1) => {
  const scale = useSharedValue(initialScale);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const scaleIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  };

  const scaleOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, scaleIn, scaleOut };
};

export const useFadeAnimation = (initialOpacity = 1) => {
  const opacity = useSharedValue(initialOpacity);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const fadeIn = (duration = 300) => {
    opacity.value = withTiming(1, { duration });
  };

  const fadeOut = (duration = 300) => {
    opacity.value = withTiming(0, { duration });
  };

  return { animatedStyle, fadeIn, fadeOut };
};

export const useSlideAnimation = (initialTranslateY = 0) => {
  const translateY = useSharedValue(initialTranslateY);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const slideUp = (distance = -10, duration = 300) => {
    translateY.value = withTiming(distance, { duration });
  };

  const slideDown = (distance = 10, duration = 300) => {
    translateY.value = withTiming(distance, { duration });
  };

  const slideReset = (duration = 300) => {
    translateY.value = withTiming(0, { duration });
  };

  return { animatedStyle, slideUp, slideDown, slideReset };
};

// Predefined entrance animations
export const enteringAnimations = {
  slideInUp: SlideInUp.springify().damping(15).stiffness(150),
  slideInDown: SlideInDown.springify().damping(15).stiffness(150),
  slideInLeft: SlideInLeft.springify().damping(15).stiffness(150),
  slideInRight: SlideInRight.springify().damping(15).stiffness(150),
  fadeIn: FadeIn.duration(300),
  rotateIn: RotateInUpLeft.springify().damping(15).stiffness(150),
};

// Predefined exit animations
export const exitingAnimations = {
  fadeOut: FadeOut.duration(200),
  rotateOut: RotateOutUpRight.springify().damping(15).stiffness(150),
};

// Layout transition
export const layoutTransition = Layout.springify().damping(15).stiffness(150);

// Press animation hook
export const usePressAnimation = () => {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            pressed.value ? 1 : 0,
            [0, 1],
            [1, 0.96]
          ),
        },
      ],
    };
  });

  const onPressIn = () => {
    pressed.value = true;
  };

  const onPressOut = () => {
    pressed.value = false;
  };

  return { animatedStyle, onPressIn, onPressOut };
};

// Stagger animation helper
export const useStaggerAnimation = (items: any[], delay = 100) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const startStagger = () => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, SPRING_CONFIG)
    );
  };

  return { animatedStyle, startStagger };
};

// Haptic feedback helper
export const hapticFeedback = {
  light: () => {
    try {
      // Haptics will be available when expo-haptics is installed
      // For now, we'll use a console log as placeholder
      console.log('Haptic feedback: light');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  medium: () => {
    try {
      console.log('Haptic feedback: medium');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  heavy: () => {
    try {
      console.log('Haptic feedback: heavy');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  success: () => {
    try {
      console.log('Haptic feedback: success');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  warning: () => {
    try {
      console.log('Haptic feedback: warning');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  error: () => {
    try {
      console.log('Haptic feedback: error');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
  selection: () => {
    try {
      console.log('Haptic feedback: selection');
    } catch (error) {
      // Silently fail if haptics not available
    }
  },
};

// Swipe gesture helper
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const onSwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'left' ? -300 : 300;
    
    translateX.value = withTiming(targetX, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    
    // Run callback after animation
    setTimeout(() => {
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
      
      // Reset position
      translateX.value = 0;
      opacity.value = 1;
    }, 200);
  };

  return { animatedStyle, onSwipe };
};

// Loading shimmer animation
export const useShimmerAnimation = () => {
  const shimmer = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        shimmer.value,
        [0, 1],
        [0.3, 1]
      ),
    };
  });

  const startShimmer = () => {
    shimmer.value = withDelay(
      0,
      withTiming(1, { duration: 1000 }, () => {
        shimmer.value = withTiming(0, { duration: 1000 });
      })
    );
  };

  return { animatedStyle, startShimmer };
};