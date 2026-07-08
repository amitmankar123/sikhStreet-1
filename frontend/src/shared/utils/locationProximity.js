/**
 * Geo-Based Vendor Discovery Utility
 * 
 * Calculates proximity score based on location hierarchy:
 * 5 - Sector / Locality match
 * 4 - City match
 * 3 - State / Province match
 * 2 - Country match
 * 1 - No match (International / Other)
 */

export const calculateProximityScore = (vendorAddress, userLocation) => {
  if (!vendorAddress || !userLocation) return 1;

  // Normalize strings for comparison
  const normalize = (str) => String(str || '').toLowerCase().trim();

  const vSector = normalize(vendorAddress.sector || vendorAddress.area || '');
  const vCity = normalize(vendorAddress.city || '');
  const vState = normalize(vendorAddress.state || '');
  const vCountry = normalize(vendorAddress.country || '');

  const uSector = normalize(userLocation.sector || userLocation.area || '');
  const uCity = normalize(userLocation.city || '');
  const uState = normalize(userLocation.state || '');
  const uCountry = normalize(userLocation.country || '');

  // Exact Sector match
  if (uSector && vSector === uSector && vCity === uCity && vState === uState && vCountry === uCountry) {
    return 5;
  }
  
  // Same City (Nearby Sectors)
  if (uCity && vCity === uCity && vState === uState && vCountry === uCountry) {
    return 4;
  }

  // Same State
  if (uState && vState === uState && vCountry === uCountry) {
    return 3;
  }

  // Same Country
  if (uCountry && vCountry === uCountry) {
    return 2;
  }

  // International / Other
  return 1;
};

export const sortVendorsByProximity = (vendors, userLocation) => {
  if (!Array.isArray(vendors)) return [];

  // Assign proximity scores
  const scoredVendors = vendors.map(vendor => ({
    ...vendor,
    proximityScore: calculateProximityScore(vendor.address, userLocation)
  }));

  // Sort by proximity score (descending)
  // If scores are tied, we can optionally sort by rating as a secondary metric
  return scoredVendors.sort((a, b) => {
    if (b.proximityScore !== a.proximityScore) {
      return b.proximityScore - a.proximityScore;
    }
    // Secondary sort: Rating (descending)
    return (b.rating || 0) - (a.rating || 0);
  });
};
