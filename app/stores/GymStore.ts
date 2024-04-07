import firestore from "@react-native-firebase/firestore"
import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { GymDetails, GymId, GymLeaderboard, GymMember, LatLongCoords } from "app/data/types"
import { PlaceId, api } from "app/services/api"
import { logError } from "app/utils/logger"
import { flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"
import { IUserModel } from "./models"

export const GymStoreModel = types
  .model("GymStoreModel")
  .props({})
  .actions((self) => {
    const getGymById = flow(function* (gymId: GymId) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const gym = yield gymRepository.get(gymId, true)
      return gym as GymDetails
    })

    const getGymByIds = flow(function* (gymIds: GymId[]) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const gyms = yield gymRepository.getMany(gymIds, true)
      return gyms as GymDetails[]
    })

    const searchGyms = flow(function* (query: string) {
      return api.searchGyms(query)
    })

    const checkGymExists = flow(function* (placeId: PlaceId) {
      const gym = yield getGymById(placeId)
      return !!gym
    })

    const getClosestGym = flow(function* (
      userLocation: LatLongCoords,
      userFavoriteGymIds: GymId[],
    ) {
      const gyms = yield getGymByIds(userFavoriteGymIds)

      let closestGym: {
        gym?: GymDetails
        distance: number
      } = {
        gym: undefined,
        distance: Number.MAX_SAFE_INTEGER,
      }
      for (const gym of gyms) {
        const distance = api.getDistanceBetweenLocations(
          userLocation,
          gym.googleMapsPlaceDetails.geometry.location,
        )

        if (distance < GYM_PROXIMITY_THRESHOLD_METERS && distance < closestGym.distance) {
          closestGym = { gym, distance }
        }
      }

      return closestGym
    })

    const createNewGym = flow(function* (placeId: PlaceId) {
      const gymExists = yield checkGymExists(placeId)
      if (gymExists) {
        console.debug("GymStore.createNewGym aborting: Gym already exists")
        return
      }

      const { gymRepository } = getEnv<RootStoreDependencies>(self)

      const placeDetails = yield api.getPlaceDetails(placeId)
      const newGym = {
        gymId: placeId,
        googleMapsPlaceDetails: placeDetails,
        gymLocation: new firestore.GeoPoint(
          placeDetails.geometry.location.lat,
          placeDetails.geometry.location.lng,
        ),
        gymName: placeDetails.name,
        gymLeaderboard: {} as GymLeaderboard,
      } as GymDetails

      try {
        yield gymRepository.create(newGym)
      } catch (e) {
        logError(e, "GymStore.createNewGym error")
      }
    })

    const getDistanceToGym = flow(function* (gymId: GymId, userLocation: LatLongCoords) {
      const gym = yield getGymById(gymId)
      return api.getDistanceBetweenLocations(
        userLocation,
        gym.googleMapsPlaceDetails.geometry.location,
      )
    })

    const getWorkoutsLeaderboard = flow<
      {
        lastMemberId: string
        noMoreItems: boolean
        gymMemberProfiles: Array<GymMember & IUserModel>
      },
      [gymId: GymId, lastMemberId?: string, limit?: number]
    >(function* (gymId: GymId, lastMemberId?: string, limit?: number) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const {
        lastMemberId: newLastMemberId,
        noMoreItems,
        gymMembers,
      } = yield gymRepository
        .getGymMembersByWorkoutsCount(gymId, lastMemberId, limit)
        .catch((e) => {
          logError(e, "GymStore.getWorkoutsLeaderboard error")
        })
      if (gymMembers.length === 0) {
        return {
          lastMemberId: null,
          noMoreItems: true,
          gymMemberProfiles: [],
        }
      }

      const users = yield getEnv<RootStoreDependencies>(self)
        .userRepository.getMany(gymMembers.map((member) => member.userId))
        .catch((e) => {
          logError(e, "GymStore.getWorkoutsLeaderboard userRepository.getMany error")
        })
      // Make sure to only return user profile that still exists (might have been deleted)
      const gymMemberProfiles = users.map((user) => ({
        ...user,
        ...gymMembers.find((gymMember) => gymMember.userId === user.userId),
      }))

      return {
        lastMemberId: newLastMemberId,
        noMoreItems,
        gymMemberProfiles,
      }
    })

    const getGymMember = flow(function* (gymId: GymId, userId: string) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)

      return yield gymRepository.getGymMember(gymId, userId).catch((e) => {
        logError(e, "GymStore.getGymMember error")
      })
    })

    return {
      getGymById,
      getGymByIds,
      searchGyms,
      checkGymExists,
      getClosestGym,
      createNewGym,
      getDistanceToGym,
      getWorkoutsLeaderboard,
      getGymMember,
    }
  })
