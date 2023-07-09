import { User } from "app/data/model"
import { IAvatarProps, Avatar as NBAvatar } from "native-base"
import React from "react"

export interface AvatarProps extends IAvatarProps {
  /**
   * User for this avatar
   */
  user: User
}

export const Avatar = (props: AvatarProps) => {
  const { size, user } = props
  const source = { uri: user?.avatarUrl }

  let showPlaceholder = false
  if (!source) {
    showPlaceholder = true
  } else if (Array.isArray(source)) {
    for (const i of source) {
      if (!i.uri) {
        showPlaceholder = true
        break
      }
    }
  } else if (typeof source === "object" && !source.uri) {
    showPlaceholder = true
  }

  const placeholderText: string = [user?.firstName?.[0], user?.lastName?.[0]].join("")

  return (
    <NBAvatar source={source} size={size}>
      {showPlaceholder && placeholderText}
    </NBAvatar>
  )
}
