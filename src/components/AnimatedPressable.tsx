import { useRef, type ReactNode } from 'react'
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

type AnimatedPressableProps = Omit<PressableProps, 'children'> & {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  // Scale applied while pressed. 0.96 = subtle "press down" feel.
  pressedScale?: number
}

// Drop-in Pressable replacement that springs its content to `pressedScale`
// on press-in and back to 1 on press-out/cancel.
//
// `style` (background, border, padding, flex sizing, etc.) stays on the
// outer Pressable -- exactly like a plain Pressable, zero layout risk. Only
// the content (children) is wrapped in an Animated.View with the scale
// transform, so existing button layouts don't need any changes.
//
// Uses the RN core Animated API (already available, no reanimated babel
// plugin required) so it works the same on native and the web export.
export default function AnimatedPressable({
  style,
  pressedScale = 0.96,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current

  return (
    <Pressable
      style={style}
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: pressedScale, useNativeDriver: true, speed: 50 }).start()
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
        onPressOut?.(e)
      }}
      {...rest}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  )
}
