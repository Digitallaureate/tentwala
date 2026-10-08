"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import type { EventLocationSelection } from "@/lib/quotation";

type GoogleMapsLocationPickerProps = {
  error?: string;
  label: string;
  onChange: (value: EventLocationSelection) => void;
  required?: boolean;
  value: EventLocationSelection;
};

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function GoogleMapsLocationPicker({
  error,
  label,
  onChange,
  required = false,
  value,
}: GoogleMapsLocationPickerProps) {
  const inputId = useId();
  const pickerHostRef = useRef<HTMLDivElement | null>(null);
  const pickerElementRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const hasMapsKey = googleMapsApiKey.trim().length > 0;

  useEffect(() => {
    if (!isScriptReady || !pickerHostRef.current || pickerElementRef.current) {
      return;
    }

    let isMounted = true;

    async function mountPlaceAutocomplete() {
      try {
        const placesLibrary = (await window.google?.maps?.importLibrary?.(
          "places"
        )) as google.maps.PlacesLibrary | undefined;

        if (
          !isMounted ||
          !placesLibrary?.PlaceAutocompleteElement ||
          !pickerHostRef.current
        ) {
          return;
        }

        const placePicker = new placesLibrary.PlaceAutocompleteElement();
        placePicker.id = inputId;
        placePicker.className = "block";
        // The site is light only; stop the picker following a dark OS theme.
        placePicker.style.colorScheme = "light";

        placePicker.addEventListener(
          "gmp-select",
          async (event: Event) => {
            const customEvent =
              event as google.maps.places.PlaceAutocompleteSelectEvent;
            const prediction = customEvent.placePrediction;

            if (!prediction) {
              return;
            }

            const place = prediction.toPlace();
            await place.fetchFields({
              fields: ["displayName", "formattedAddress", "id", "location"],
            });

            const latitude = place.location?.lat();
            const longitude = place.location?.lng();
            const address =
              place.formattedAddress?.trim() ||
              place.displayName?.trim() ||
              value.address;

            onChange({
              address,
              latitude: typeof latitude === "number" ? latitude : undefined,
              longitude: typeof longitude === "number" ? longitude : undefined,
              placeId: place.id?.trim() || undefined,
              source: place.id ? "google_places" : "manual",
            });
          }
        );

        pickerHostRef.current.appendChild(placePicker);
        pickerElementRef.current = placePicker;

        const shadowInput = placePicker.shadowRoot?.querySelector("input");
        if (shadowInput instanceof HTMLInputElement) {
          shadowInput.required = required;
          shadowInput.placeholder = "Search venue, locality, or exact event address";
          shadowInput.className =
            "h-12 w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-500";
        }
      } catch (mountError) {
        console.error(mountError);
        if (isMounted) {
          setScriptError(
            "Google Maps could not start. You can still type the location manually."
          );
        }
      }
    }

    void mountPlaceAutocomplete();

    return () => {
      isMounted = false;
      if (pickerElementRef.current) {
        pickerElementRef.current.remove();
        pickerElementRef.current = null;
      }
    };
  }, [inputId, isScriptReady, onChange, required, value.address]);

  const mapQuery = value.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        value.address
      )}&query_place_id=${encodeURIComponent(value.placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        value.address
      )}`;

  return (
    <div className="space-y-3">
      {hasMapsKey ? (
        <Script
          id="google-maps-places"
          onError={() =>
            setScriptError(
              "Google Maps failed to load. You can still type the location manually."
            )
          }
          onReady={() => {
            setScriptError("");
            setIsScriptReady(true);
          }}
          src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
          strategy="afterInteractive"
        />
      ) : null}

      <label className="text-sm font-semibold text-zinc-900" htmlFor={inputId}>
        {label}
      </label>

      <div className="space-y-3 rounded-[1.5rem] border-2 border-zinc-300 bg-zinc-50 p-3">
        {hasMapsKey ? (
          <div
            className="rounded-2xl border-2 border-zinc-300 bg-white p-0"
            ref={pickerHostRef}
          />
        ) : (
          <input
            className="h-12 w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-500"
            id={inputId}
            onChange={(event) =>
              onChange({
                address: event.target.value,
                latitude: undefined,
                longitude: undefined,
                placeId: undefined,
                source: "manual",
              })
            }
            placeholder="City or venue location"
            required={required}
            value={value.address}
          />
        )}

        <div className="rounded-[1.25rem] border border-white/90 bg-white/80 px-4 py-3 text-sm text-zinc-600">
          {hasMapsKey ? (
            <>
              Search and select the venue from Google Maps for a more exact
              quotation location.
            </>
          ) : (
            <>
              Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable Google Maps
              location search here.
            </>
          )}
        </div>

        {value.address ? (
          <div className="rounded-[1.25rem] border border-[#173f73]/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(244,248,252,0.95))] p-4 shadow-[0_14px_34px_rgba(29,45,68,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#56b7c4]">
                  {value.source === "google_places"
                    ? "Selected From Google Maps"
                    : "Manual Location Entry"}
                </p>
                <p className="text-sm font-medium leading-6 text-zinc-800">
                  {value.address}
                </p>
                {typeof value.latitude === "number" &&
                typeof value.longitude === "number" ? (
                  <p className="text-xs text-zinc-500">
                    {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                  </p>
                ) : null}
              </div>

              <a
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#173f73]/15 bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#173f73] transition hover:border-[#173f73]/25 hover:bg-[#f7fbff]"
                href={mapQuery}
                rel="noreferrer"
                target="_blank"
              >
                Open Map
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {scriptError ? (
        <p className="rounded-[1.25rem] bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {scriptError}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
