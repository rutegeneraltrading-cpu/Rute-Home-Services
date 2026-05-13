/**
 * Supported service area postal code ranges for South Africa.
 * To add or remove an area, update this list and redeploy.
 */
export const ALLOWED_POSTAL_CODE_RANGES: { from: number; to: number; label: string }[] = [
  { from: 1,    to: 299,  label: 'Pretoria / Tshwane' },
  { from: 1400, to: 1699, label: 'East Rand, Alberton & Southern Suburbs' },
  { from: 1700, to: 1799, label: 'West Rand' },
  { from: 1800, to: 1899, label: 'Southern Gauteng (Eye of Africa & nearby)' },
  { from: 2000, to: 2199, label: 'Johannesburg, Sandton, Randburg, Midrand, Bedfordview' },
];

export const isSupportedServiceArea = (
  place: google.maps.places.PlaceResult,
): boolean => {
  const postalCodeComponent = (place.address_components || []).find((c) =>
    c.types.includes('postal_code'),
  );

  if (postalCodeComponent) {
    const code = parseInt(postalCodeComponent.long_name, 10);
    if (!isNaN(code)) {
      return ALLOWED_POSTAL_CODE_RANGES.some(
        (range) => code >= range.from && code <= range.to,
      );
    }
  }

  // Deny if Google doesn't return a postal code
  return false;
};
