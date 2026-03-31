import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { VehicleProfile } from "@/lib/rdw/types";
import type { Locale } from "@/lib/i18n/messages";

type VehicleLookupQuery = {
  plate: string;
  lang: Locale;
};

export const vehicleApi = createApi({
  reducerPath: "vehicleApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getVehicleByPlate: builder.query<VehicleProfile, VehicleLookupQuery>({
      query: ({ plate, lang }) =>
        `/vehicle/${encodeURIComponent(plate)}?lang=${encodeURIComponent(lang)}`
    })
  })
});

export const { useGetVehicleByPlateQuery } = vehicleApi;

