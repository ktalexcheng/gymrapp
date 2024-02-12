// Source: https://medium.com/@gogulbharathisubbaraj/implementing-ios-style-picker-in-react-native-part-1-4e938e218b92

import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { forwardRef, useImperativeHandle, useRef } from "react"
import {
  Animated,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Text } from "./Text"

type ListItem = { label: string; value: any }

export type WheelPickerRef = {
  scrollToIndex: (index: number) => void
}

type WheelPickerProps = {
  items: ListItem[]
  onIndexChange: (index: number) => void
  itemHeight: number
  initialScrollIndex: number
  disabled?: boolean
}

const ExoticWheelPickerFlat = forwardRef<WheelPickerRef, WheelPickerProps>(
  function ExoticWheelPickerFlat(props, ref) {
    const { items, onIndexChange, itemHeight, initialScrollIndex, disabled } = props
    const modifiedItems = [{ label: "", value: null }, ...items, { label: "", value: null }]
    const scrollViewRef = useRef<ScrollView>(null)
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        if (!scrollViewRef.current) return
        scrollViewRef.current.scrollTo({ y: index * itemHeight })
      },
    }))
    const { themeStore } = useStores()

    const scrollToInitialIndex = () => {
      if (!scrollViewRef.current) return
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

    const $container: ViewStyle = {
      height: itemHeight * 3,
      width: "100%",
      opacity: disabled ? 0.5 : 1,
    }

    const $contentContainer: ViewStyle = {
      flexGrow: 1,
    }

    const $indicator: ViewStyle = {
      backgroundColor: themeStore.colors("separator"),
      height: 1,
      position: "absolute",
      width: "100%",
    }

    console.debug("WheelPickerFlat initialScrollIndex", initialScrollIndex)
    return (
      <View>
        <ScrollView
          scrollEnabled={!disabled}
          style={$container}
          contentContainerStyle={$contentContainer}
          ref={scrollViewRef}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          onMomentumScrollEnd={momentumScrollEnd}
          onLayout={scrollToInitialIndex}
        >
          <TouchableOpacity activeOpacity={1}>
            {modifiedItems.map((item, index) => renderItem(item, index))}
          </TouchableOpacity>
        </ScrollView>
        <View style={[$indicator, { top: itemHeight }]} />
        <View style={[$indicator, { top: itemHeight * 2 }]} />
      </View>
    )
  },
)

export const WheelPickerFlat = observer(ExoticWheelPickerFlat)

export const WheelPickerAnimated: React.FC<WheelPickerProps> = observer((props) => {
  const { items, onIndexChange, itemHeight } = props
  const { themeStore } = useStores()

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

  const blankItems = { label: "", value: null }
  const modifiedItems = [blankItems, ...items, blankItems]

  const momentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const index = Math.round(y / itemHeight)
    onIndexChange(index)
  }

  const $indicator: ViewStyle = {
    backgroundColor: themeStore.colors("separator"),
    height: 1,
    position: "absolute",
    width: "100%",
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
})

const $animatedContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $pickerItemText: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  textAlign: "center",
  textAlignVertical: "center",
}
