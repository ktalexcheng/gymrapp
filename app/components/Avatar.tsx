import { User } from "app/data/model"
import { IAvatarProps, Avatar as NBAvatar, View } from "native-base"
import React from "react"

export interface AvatarProps extends IAvatarProps {
  /**
   * User for this avatar. If source is provided, this will be ignored.
   */
  user?: User
}

export const Avatar = (props: AvatarProps) => {
  const { size, source, user, children, ...rest } = props
  const userAvatarSource = { uri: user?.avatarUrl }
  const userInitialsText: string = [user?.firstName?.[0], user?.lastName?.[0]].join("")

  const renderPlaceholderChildren = () => {
    if (!user) {
      return children
    } else {
      return userInitialsText
    }
  }

  return (
    <View>
      <NBAvatar source={source ?? userAvatarSource} size={size} {...rest}>
        {renderPlaceholderChildren()}
      </NBAvatar>
    </View>
  )
}
