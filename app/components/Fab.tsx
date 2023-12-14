import React from "react"
import { TouchableOpacity, ViewStyle } from "react-native"

interface FabProps {
  size: keyof typeof $fabSize
  icon: React.ReactNode
  position: keyof typeof $fabPosition
  backgroundColor: string
  onPress: () => void
}

export const Fab = (props: FabProps) => {
  const { size, icon, position, backgroundColor, onPress } = props

  const $fabContainer: ViewStyle = {
    position: "absolute",
    width: $fabSize[size],
    height: $fabSize[size],
    borderRadius: $fabSize[size] / 2,
    justifyContent: "center",
    alignItems: "center",
    ...$fabPosition[position],
    backgroundColor,
  }

  return (
    <TouchableOpacity style={$fabContainer} onPress={onPress}>
      {icon}
    </TouchableOpacity>
  )
}

const $fabSize = {
  sm: 40,
  md: 50,
  lg: 60,
}

const $fabPosition = {
  topLeft: {
    top: 20,
    left: 20,
  },
  topRight: {
    top: 20,
    right: 20,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
  },
}
