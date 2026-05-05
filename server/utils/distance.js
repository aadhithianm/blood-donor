/**
 * Calculate the distance between two points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Find donors within a given radius
 * @param {Object} center - { latitude, longitude }
 * @param {Array} donors - Array of donor objects with location.coordinates
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Sorted donors within radius (closest first)
 */
export const findDonorsWithinRadius = (center, donors, radiusKm = 50) => {
    return donors
        .map((donor) => {
            const [lng, lat] = donor.location?.coordinates || [0, 0];
            const distance = haversineDistance(center.latitude, center.longitude, lat, lng);
            return { ...donor, distance };
        })
        .filter((d) => d.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
};
