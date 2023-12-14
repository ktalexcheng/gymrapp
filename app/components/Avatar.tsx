import { User } from "app/data/model"
import { colors } from "app/theme"
import React from "react"
import { Image, ImageStyle, TextStyle, View, ViewProps, ViewStyle } from "react-native"
import { Text } from "./Text"

export interface AvatarProps extends ViewProps {
  /**
   * URL to the image. This takes precedence over user.
   */
  imageUrl?: string
  /**
   * User for this avatar, from which the property avatarUrl will be as source of image. If source is provided, this will be ignored.
   */
  user?: User
  /**
   * Size of the avatar. Defaults to 32.
   */
  size?: keyof typeof avatarSize
  /**
   * Background color of the avatar container.
   */
  backgroundColor?: string
  /**
   * Style for the avatar container.
   */
  containerStyle?: ViewStyle
  /**
   * Style for the avatar image.
   */
  imageStyle?: ImageStyle
}

export const Avatar = (props: AvatarProps) => {
  const {
    imageUrl: source,
    user,
    size = "md",
    backgroundColor = colors.palette.neutral300,
    containerStyle: $containerStyleOverride,
    imageStyle: $imageStyleOverride,
  } = props

  const $avatarContainer: ViewStyle = {
    width: avatarSize[size],
    height: avatarSize[size],
    borderRadius: avatarSize[size] / 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor,
  }

  const $image: ImageStyle = {
    width: avatarSize[size],
    height: avatarSize[size],
    resizeMode: "cover",
  }

  const renderAvatarImage = () => {
    if (!source && user && !user?.avatarUrl) {
      const userInitialsText: string = [user?.firstName?.[0], user?.lastName?.[0]].join("")
      const $text: TextStyle = {
        fontSize: avatarSize[size] / 3,
        lineHeight: avatarSize[size] / 2.5,
      }
      return <Text text={userInitialsText} style={$text} />
    }

    const imageSource = { uri: source || user?.avatarUrl }

    return <Image source={imageSource} style={[$image, $imageStyleOverride]} />
  }

  return <View style={[$avatarContainer, $containerStyleOverride]}>{renderAvatarImage()}</View>
}

export const avatarSize = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 72,
  xxl: 120,
}
