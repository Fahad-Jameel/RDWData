"use client";

import { useMemo } from "react";
import { normalizePlate, validateDutchPlate } from "@/lib/rdw/normalize";
import { useGetVehicleByPlateQuery } from "@/lib/store/services/vehicleApi";
import { useI18n } from "@/lib/i18n/context";

export function useVehicleLookup(rawPlate: string) {
  const { locale } = useI18n();
  const normalized = useMemo(() => normalizePlate(rawPlate), [rawPlate]);
  const isValid = useMemo(() => validateDutchPlate(normalized), [normalized]);

  const query = useGetVehicleByPlateQuery({ plate: normalized, lang: locale }, {
    skip: !isValid
  });

  return {
    normalized,
    isValid,
    ...query
  };
}

