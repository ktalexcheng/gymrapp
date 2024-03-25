import { types } from "mobx-state-tree"

export const MetadataModel = types.model("MetadataModel", {
  __isLocalOnly: types.optional(types.boolean, false),
  _createdAt: types.maybeNull(types.Date),
  _modifiedAt: types.maybeNull(types.Date),
})
