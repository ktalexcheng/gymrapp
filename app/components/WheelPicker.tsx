// Source: https://medium.com/@gogulbharathisubbaraj/implementing-ios-style-picker-in-react-native-part-1-4e938e218b92

import { colors } from "app/theme"
import React, { FC, useRef } from "react"
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native"

type ListItem = { label: string; value: any }

type WheelPickerProps = {
  items: ListItem[]
  onIndexChange: (index: number) => void
  itemHeight: number
  initialScrollIndex: number
  enabled: boolean
}

export const WheelPickerFlat: FC<WheelPickerProps> = (props) => {
  const { items, onIndexChange, itemHeight, initialScrollIndex, enabled } = props
  const modifiedItems = ["", ...items, ""]

  const renderItem = ({ item }: ListRenderItemInfo<ListItem>) => {
    return (
      <Text
        style={[
          styles.pickerItem,
          { height: itemHeight, color: enabled ? colors.text : colors.disabled },
        ]}
      >
        {item.label}
      </Text>
    )
  }

  const momentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const index = Math.round(y / itemHeight)
    onIndexChange(index)
  }

  const $container: ViewStyle = {}

  return (
    <View
      style={[$container, { height: itemHeight * 3 }]}
      pointerEvents={enabled ? "auto" : "none"}
    >
      <FlatList
        data={modifiedItems}
        renderItem={renderItem}
        snapToOffsets={modifiedItems.map((_, i) => itemHeight * i)}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={momentumScrollEnd}
        initialScrollIndex={initialScrollIndex ?? 0}
      />
      <View style={[styles.indicator, { top: itemHeight }]} />
      <View style={[styles.indicator, { top: itemHeight * 2 }]} />
    </View>
  )
}

export const WheelPickerAnimated: React.FC<WheelPickerProps> = (props) => {
  const { items, onIndexChange, itemHeight } = props

  const scrollY = useRef(new Animated.Value(0)).current

  const renderItem = ({ item, index }: ListRenderItemInfo<{ label: string; value: any }>) => {
    const inputRange = [(index - 2) * itemHeight, (index - 1) * itemHeight, index * itemHeight]
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
    })

    return (
      <Animated.View
        style={[{ height: itemHeight, transform: [{ scale }] }, styles.animatedContainer]}
      >
        <Text style={styles.pickerItem}>{item.label}</Text>
      </Animated.View>
    )
  }

  const modifiedItems = ["", ...items, ""]

  const momentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const index = Math.round(y / itemHeight)
    onIndexChange(index)
  }

  return (
    <View style={{ height: itemHeight * 3 }}>
      <Animated.FlatList
        data={modifiedItems}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        onMomentumScrollEnd={momentumScrollEnd}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
      <View style={[styles.indicator, { top: itemHeight }]} />
      <View style={[styles.indicator, { top: itemHeight * 2 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    backgroundColor: colors.separator,
    height: 1,
    position: "absolute",
    width: "100%",
  },
  pickerItem: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    textAlignVertical: "center",
  },
})
