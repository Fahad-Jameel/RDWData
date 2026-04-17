import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { VehicleProfile } from "@/lib/rdw/types";
import type { Locale } from "@/lib/i18n/messages";

type VehicleLookupQuery = {
  plate: string;
  lang: Locale;
  mileage?: number | null;
};

export const vehicleApi = createApi({
  reducerPath: "vehicleApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getVehicleByPlate: builder.query<VehicleProfile, VehicleLookupQuery>({
      query: ({ plate, lang, mileage }) =>
        `/vehicle/${encodeURIComponent(plate)}?lang=${encodeURIComponent(lang)}${
          typeof mileage === "number" && Number.isFinite(mileage) ? `&mileage=${encodeURIComponent(String(Math.round(mileage)))}` : ""
        }`
    })
  })
});

export const { useGetVehicleByPlateQuery } = vehicleApi;

