import firestore from "@react-native-firebase/firestore"
import { GYM_PROXIMITY_THRESHOLD_METERS } from "app/data/constants"
import { GymDetails, GymId, GymLeaderboard, LatLongCoords } from "app/data/model"
import { PlaceId, api } from "app/services/api"
import { flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"

export const GymStoreModel = types
  .model("GymStoreModel")
  .props({})
  .actions((self) => ({
    getGymById: flow(function* (gymId: GymId) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const gym = yield gymRepository.get(gymId, true)
      return gym as GymDetails
    }),
    getGymByIds: flow(function* (gymIds: GymId[]) {
      const { gymRepository } = getEnv<RootStoreDependencies>(self)
      const gyms = yield gymRepository.getMany(gymIds, true)
      return gyms as GymDetails[]
    }),
    searchGyms: flow(function* (query: string) {
      return api.searchGyms(query)
    }),
  }))
  .actions((self) => ({
    checkGymExists: flow(function* (placeId: PlaceId) {
      const gym = yield self.getGymById(placeId)
      return !!gym
    }),
    getClosestGym: flow(function* (userLocation: LatLongCoords, userFavoriteGymIds: GymId[]) {
      const gyms = yield self.getGymByIds(userFavoriteGymIds)

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
    }),
  }))
  .actions((self) => ({
    createNewGym: flow(function* (placeId: PlaceId) {
      const gymExists = yield self.checkGymExists(placeId)
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
    }),
    getDistanceToGym: flow(function* (gymId: GymId, userLocation: LatLongCoords) {
      const gym = yield self.getGymById(gymId)
      return api.getDistanceBetweenLocations(
        userLocation,
        gym.googleMapsPlaceDetails.geometry.location,
      )
    }),
  }))
