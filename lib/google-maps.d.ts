declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google.maps {
    interface PlacesLibrary {
      PlaceAutocompleteElement: {
        new (): places.PlaceAutocompleteElement;
      };
    }

    function importLibrary(name: "places"): Promise<PlacesLibrary>;

    namespace places {
      class Place {
        displayName?: string;
        formattedAddress?: string;
        id?: string;
        location?: {
          lat: () => number;
          lng: () => number;
        };

        fetchFields(request: { fields: string[] }): Promise<void>;
      }

      class PlacePrediction {
        toPlace(): Place;
      }

      interface PlaceAutocompleteSelectEvent extends Event {
        placePrediction?: PlacePrediction;
      }

      class PlaceAutocompleteElement extends HTMLElement {
        addEventListener(
          type: "gmp-select",
          listener: (event: PlaceAutocompleteSelectEvent) => void
        ): void;
      }
    }
  }
}

export {};
