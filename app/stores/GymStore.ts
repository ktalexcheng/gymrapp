import firestore from "@react-native-firebase/firestore"
import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { GymDetails, GymId, GymLeaderboard, LatLongCoords } from "app/data/model"
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

    return {
      getGymById,
      getGymByIds,
      searchGyms,
      checkGymExists,
      getClosestGym,
      createNewGym,
      getDistanceToGym,
    }
  })
