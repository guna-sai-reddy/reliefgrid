"""
Routing service: computes distance and ETA between two geo points.
Uses haversine for now — swap for OSRM in production.
"""
from math import radians, sin, cos, sqrt, atan2


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (sin(dlat / 2) ** 2
         + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2)
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def estimate_route(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
    avg_speed_kmph: float = 40.0,
) -> dict:
    dist = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
    return {
        "distance_km": round(dist, 2),
        "eta_hours": round(dist / avg_speed_kmph, 2),
        "geometry": [
            [origin_lat, origin_lon],
            [dest_lat, dest_lon],
        ],
        "provider": "haversine",
    }