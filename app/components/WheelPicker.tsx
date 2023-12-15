// Source: https://medium.com/@gogulbharathisubbaraj/implementing-ios-style-picker-in-react-native-part-1-4e938e218b92

import { colors } from "app/theme"
import React, { FC, useRef } from "react"
import {
  Animated,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

type ListItem = { label: string; value: any }

type WheelPickerProps = {
  items: ListItem[]
  onIndexChange: (index: number) => void
  itemHeight: number
  initialScrollIndex: number
  disabled?: boolean
}

export const WheelPickerFlat: FC<WheelPickerProps> = (props) => {
  const { items, onIndexChange, itemHeight, initialScrollIndex, disabled } = props
  const modifiedItems = [{ label: "", value: null }, ...items, { label: "", value: null }]
  const scrollViewRef = useRef<ScrollView>(null)

  const scrollToInitialIndex = () => {
    scrollViewRef.current.scrollTo({ y: initialScrollIndex * itemHeight, animated: false })
  }

  const $itemContainer: ViewStyle = {
    height: itemHeight,
    alignItems: "center",
    justifyContent: "center",
  }

  const renderItem = (item: ListItem, index: number) => {
    return (
      <View key={index} style={$itemContainer}>
        <Text style={$pickerItemText}>{item.label}</Text>
      </View>
    )
  }

  const momentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const index = Math.round(y / itemHeight)
    onIndexChange(index)
  }

  const $container: ViewStyle = { height: itemHeight * 3, opacity: disabled ? 0.5 : 1 }

  console.debug("WheelPickerFlat initialScrollIndex", initialScrollIndex)
  return (
    <View style={$container} pointerEvents={disabled ? "none" : "auto"}>
      <ScrollView
        ref={scrollViewRef}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        onMomentumScrollEnd={momentumScrollEnd}
        onLayout={scrollToInitialIndex}
      >
        {modifiedItems.map((item, index) => renderItem(item, index))}
      </ScrollView>
      <View style={[$indicator, { top: itemHeight }]} />
      <View style={[$indicator, { top: itemHeight * 2 }]} />
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
      <Animated.View style={[{ height: itemHeight, transform: [{ scale }] }, $animatedContainer]}>
        <Text style={$pickerItemText}>{item.label}</Text>
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
      <View style={[$indicator, { top: itemHeight }]} />
      <View style={[$indicator, { top: itemHeight * 2 }]} />
    </View>
  )
}

const $animatedContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $indicator: ViewStyle = {
  backgroundColor: colors.separator,
  height: 1,
  position: "absolute",
  width: "100%",
}

const $pickerItemText: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  textAlign: "center",
  textAlignVertical: "center",
}
