import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./baseConfig";
import { TAG_TYPES } from "./tags";

export { changed, movedToOrFromTrash, prefixed } from "./tags";

// Every slice injects its endpoints into this one API so a change to one kind
// of record can refresh every screen that shows it, e.g. editing a service's
// prices refreshes the open quote and invoice without a page reload.
export const api = createApi({
  reducerPath: "api",
  baseQuery: createBaseQuery(""),
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
