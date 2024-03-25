import NetInfo from "@react-native-community/netinfo"
import { useEffect, useState } from "react"

export const useInternetStatus = () => {
  const [isInternetConnected, setIsInternetConnected] = useState(true) // should default to true

  useEffect(() => {
    // Listen to network state change
    const unsubscribeNetworkChange = NetInfo.addEventListener((state) => {
      setIsInternetConnected(state.isInternetReachable ?? true)
    })

    return () => {
      unsubscribeNetworkChange()
    }
  }, [])

  return [isInternetConnected]
}
