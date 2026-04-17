"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDisplayPlate, normalizePlate, validateDutchPlate } from "@/lib/rdw/normalize";
import { useI18n } from "@/lib/i18n/context";

export function usePlateSearch() {
  const router = useRouter();
  const { locale } = useI18n();
  const [plateInput, setPlateInput] = useState("");
  const [mileageInput, setMileageInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizePlate(plateInput).slice(0, 7), [plateInput]);
  const preview = useMemo(() => formatDisplayPlate(normalized), [normalized]);
  const isValid = useMemo(() => validateDutchPlate(normalized), [normalized]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plate = normalizePlate(plateInput);

    if (!plate) {
      setError(locale === "nl" ? "Voer een Nederlands kenteken in." : "Enter a Dutch plate.");
      return;
    }

    if (!validateDutchPlate(plate)) {
      setError(
        locale === "nl"
          ? "Ongeldig Nederlands kentekenformaat. Voorbeeld: 16-RSL-9"
          : "Invalid Dutch plate format. Example: 16-RSL-9"
      );
      return;
    }

    setError(null);
    const mileage = Number(mileageInput);
    if (mileageInput.trim().length > 0 && (!Number.isFinite(mileage) || mileage < 0 || mileage > 1_500_000)) {
      setError(locale === "nl" ? "Kilometerstand is ongeldig." : "Mileage is invalid.");
      return;
    }
    const query = mileageInput.trim().length > 0 ? `?mileage=${encodeURIComponent(String(Math.round(mileage)))}` : "";
    router.push(`/search/${encodeURIComponent(plate)}${query}`);
  };

  return {
    plateInput,
    setPlateInput,
    mileageInput,
    setMileageInput,
    error,
    setError,
    normalized,
    preview,
    isValid,
    onSubmit
  };
}

