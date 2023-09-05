import { User } from "app/data/model"
import { IAvatarProps, Avatar as NBAvatar, View } from "native-base"
import React from "react"

export interface AvatarProps extends IAvatarProps {
  /**
   * User for this avatar
   */
  user?: User
}

export const Avatar = (props: AvatarProps) => {
  const { size, source, user } = props
  const userAvatarSource = { uri: user?.avatarUrl }
  const placeholderText: string = [user?.firstName?.[0], user?.lastName?.[0]].join("")

  return (
    <View>
      <NBAvatar source={source ?? userAvatarSource} size={size}>
        {placeholderText}
      </NBAvatar>
    </View>
  )
}
