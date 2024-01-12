import firestore from "@react-native-firebase/firestore"
import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { GymDetails, GymId, GymLeaderboard, GymMember, LatLongCoords, User } from "app/data/model"
import { PlaceId, api } from "app/services/api"
import { flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"

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

      let closestGym = {
        gym: undefined as GymDetails,
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
        console.error("GymStore.createNewGym error:", e)
      }
    })

    const getDistanceToGym = flow(function* (gymId: GymId, userLocation: LatLongCoords) {
      const gym = yield getGymById(gymId)
      return api.getDistanceBetweenLocations(
        userLocation,
        gym.googleMapsPlaceDetails.geometry.location,
      )
    })

    const getGymMemberProfiles = flow<
      {
        lastMemberId: string
        noMoreItems: boolean
        gymMemberProfiles: Array<GymMember & User>
      },
      [gymId: GymId, lastMemberId?: string, limit?: number]
    >(function* (gymId: GymId, lastMemberId?: string, limit?: number) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const {
        lastMemberId: newLastMemberId,
        noMoreItems,
        gymMembers,
      } = yield gymRepository.getGymMembers(gymId, lastMemberId, limit).catch((e) => {
        console.error("GymStore.getGymMemberProfiles getGymMembers error:", e)
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
          console.error("GymStore.getGymMemberProfiles userRepository.getMany error:", e)
        })
      const gymMemberProfiles = gymMembers.map((gymMember) => ({
        ...gymMember,
        ...users.find((user) => user.userId === gymMember.userId),
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
        console.error("GymStore.getGymMember error:", e)
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
      getGymMemberProfiles,
      getGymMember,
    }
  })
