import { useState, useEffect, useCallback, useRef } from 'react';
import { getNearbyListings, getListings } from '../services/api';

/**
 * useMapSearch — hook for map-based gear discovery
 *
 * Manages two modes:
 *  1. "Nearby" — uses the browser's Geolocation API + /api/listings/nearby
 *  2. "Map click" — when user clicks a spot on the map, searches that area
 *
 * Returns: { listings, center, loading, error, search, setCenter }
 */
const useMapSearch = () => {
    const [listings, setListings] = useState([]);
    const [center, setCenter] = useState([20.5937, 78.9629]); // Default: India center
    const [radius, setRadius] = useState(100); // km
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLocated, setHasLocated] = useState(false);

    // ── Locate user on first load ────────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation || hasLocated) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCenter([pos.coords.latitude, pos.coords.longitude]);
                setHasLocated(true);
            },
            () => {
                // Silently fall back to default center
                setHasLocated(true);
            },
            { timeout: 5000 }
        );
    }, [hasLocated]);

    // ── Search nearby listings ───────────────────────────────────────
    const search = useCallback(async (lat, lng, searchRadius = radius) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await getNearbyListings({ lng, lat, radius: searchRadius });
            setListings(data.data || []);
        } catch (err) {
            // If no coords indexed or backend error, fall back to regular listing fetch
            try {
                const fallback = await getListings({ limit: 20 });
                setListings(fallback.data.data || []);
            } catch {
                setError('Could not load area listings');
            }
        } finally {
            setLoading(false);
        }
    }, [radius]);

    // Re-search whenever center changes
    useEffect(() => {
        search(center[0], center[1]);
    }, [center, search]);

    return { listings, center, setCenter, radius, setRadius, loading, error, search };
};

export default useMapSearch;
