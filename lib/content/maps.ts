export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function storeDirectionsUrl(input: {
  mapUrl?: string | null;
  name: string;
  address: string;
  city: string;
  postalCode?: string | null;
}) {
  if (input.mapUrl) return input.mapUrl;
  return mapsSearchUrl(
    [input.name, input.address, input.city, input.postalCode]
      .filter(Boolean)
      .join(", "),
  );
}
