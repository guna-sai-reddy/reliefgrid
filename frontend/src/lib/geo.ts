export interface GeoCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const POPULAR_INDIAN_LOCATIONS: GeoCity[] = [
  // Andhra Pradesh & Rayalaseema
  { name: "Anantapur", state: "Andhra Pradesh", lat: 14.6819, lng: 77.6006 },
  { name: "Gooty", state: "Andhra Pradesh", lat: 15.1171, lng: 77.6341 },
  { name: "Kurnool", state: "Andhra Pradesh", lat: 15.8281, lng: 78.0373 },
  { name: "Kadapa", state: "Andhra Pradesh", lat: 14.4673, lng: 78.8242 },
  { name: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Nellore", state: "Andhra Pradesh", lat: 14.4426, lng: 79.9865 },
  { name: "Rajahmundry", state: "Andhra Pradesh", lat: 17.0005, lng: 81.8040 },
  { name: "Kakinada", state: "Andhra Pradesh", lat: 16.9891, lng: 82.2475 },
  { name: "Srikakulam", state: "Andhra Pradesh", lat: 18.2949, lng: 83.8938 },

  // Telangana
  { name: "Telangana (Central)", state: "Telangana", lat: 17.8496, lng: 79.1152 },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Karimnagar", state: "Telangana", lat: 18.4386, lng: 79.1288 },
  { name: "Nizamabad", state: "Telangana", lat: 18.6725, lng: 78.0941 },
  { name: "Khammam", state: "Telangana", lat: 17.2473, lng: 80.1514 },

  // Kerala & South
  { name: "Wayanad", state: "Kerala", lat: 11.6854, lng: 76.1320 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Idukki", state: "Kerala", lat: 9.8494, lng: 76.9806 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Mangaluru", state: "Karnataka", lat: 12.9141, lng: 74.8560 },

  // Maharashtra & West
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },

  // North & Central
  { name: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Joshimath", state: "Uttarakhand", lat: 30.5564, lng: 79.5663 },

  // East & North East
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Puri", state: "Odisha", lat: 19.8135, lng: 85.8312 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Manipur (Imphal)", state: "Manipur", lat: 24.8170, lng: 93.9368 },
];

export function lookupCoordinates(query: string): { lat: number; lng: number } | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Exact or contains match
  const found = POPULAR_INDIAN_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase() === q ||
      q.includes(loc.name.toLowerCase()) ||
      loc.name.toLowerCase().includes(q)
  );

  if (found) {
    return { lat: found.lat, lng: found.lng };
  }

  return null;
}
