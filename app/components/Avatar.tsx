import { UserSearchResult } from "app/data/types"
import { IUserModel, useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import {
  Image,
  ImageErrorEventData,
  ImageStyle,
  NativeSyntheticEvent,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
import { Icon } from "./Icon"
import { Text } from "./Text"

export interface AvatarProps extends ViewProps {
  /**
   * URL to the image. This takes precedence over user.
   */
  imageUrl?: string
  /**
   * User for this avatar, from which the property avatarUrl will be as source of image. If imageUrl is provided, this will be ignored.
   */
  user?: IUserModel | UserSearchResult
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

export const Avatar = observer((props: AvatarProps) => {
  const { themeStore } = useStores()
  const {
    imageUrl,
    user,
    size = "md",
    backgroundColor = themeStore.colors("contentBackground"),
    containerStyle: $containerStyleOverride,
    imageStyle: $imageStyleOverride,
  } = props
  const [loadError, setLoadError] = useState<NativeSyntheticEvent<ImageErrorEventData>>()

  const placeholderImage = <Icon name="barbell" size={avatarSize[size] * 0.7} />
  const imageUrlToUse = imageUrl || user?.avatarUrl // imageUrl takes precedence over user.avatarUrl

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

  const $text: TextStyle = {
    fontSize: avatarSize[size] / 3,
    lineHeight: avatarSize[size] / 2.5,
  }

  const renderUserInitialsText = () => {
    let userInitialsText: string
    if (/^[\u4E00-\u9FA5]+$/.test(user.lastName + user.firstName)) {
      userInitialsText = `${user.lastName}${user.firstName}`.slice(-2)
    } else {
      userInitialsText = [user.firstName?.[0], user.lastName?.[0]].join("")
    }

    return <Text text={userInitialsText} style={$text} />
  }

  const renderAvatarImage = () => {
    if (loadError || !imageUrlToUse) {
      // console.debug("Avatar image load error or image URL undefined", { loadError, imageUrlToUse })
      if (user) return renderUserInitialsText()
      else return placeholderImage
    }

    return (
      <Image
        source={{ uri: imageUrlToUse }}
        style={[$image, $imageStyleOverride]}
        onError={(e) => setLoadError(e)}
      />
    )
  }

  return <View style={[$avatarContainer, $containerStyleOverride]}>{renderAvatarImage()}</View>
})

export const avatarSize = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 72,
  xxl: 120,
}
