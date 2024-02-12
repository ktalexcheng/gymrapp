import { types } from "mobx-state-tree"

export const MetadataModel = types.model("MetadataModel", {
  _createdAt: types.maybeNull(types.Date),
  _modifiedAt: types.maybeNull(types.Date),
})
