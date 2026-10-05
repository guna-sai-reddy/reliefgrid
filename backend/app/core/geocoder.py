"""
Geocoding helper for ReliefGrid.
Provides fast offline matching for Indian districts, cities, and regions,
with fallback coordinates lookup so pins are never stuck at default center.
"""

# Lookup table of major Indian cities, districts, and disaster-prone zones
INDIAN_CITIES = {
    # Andhra Pradesh & Rayalaseema
    "anantapur": (14.6819, 77.6006),
    "anantapuramu": (14.6819, 77.6006),
    "gooty": (15.1171, 77.6341),
    "kurnool": (15.8281, 78.0373),
    "kadapa": (14.4673, 78.8242),
    "cuddapah": (14.4673, 78.8242),
    "tirupati": (13.6288, 79.4192),
    "chittoor": (13.2172, 79.1003),
    "nellore": (14.4426, 79.9865),
    "ongole": (15.5057, 80.0499),
    "guntur": (16.3067, 80.4365),
    "vijayawada": (16.5062, 80.6480),
    "amaravati": (16.5131, 80.5165),
    "machilipatnam": (16.1875, 81.1389),
    "eluru": (16.7107, 81.0952),
    "bhimavaram": (16.5449, 81.5212),
    "rajahmundry": (17.0005, 81.8040),
    "kakinada": (16.9891, 82.2475),
    "visakhapatnam": (17.6868, 83.2185),
    "vizag": (17.6868, 83.2185),
    "vizianagaram": (18.1133, 83.3977),
    "srikakulam": (18.2949, 83.8938),
    "nandyal": (15.4886, 78.4836),
    "proddatur": (14.7526, 78.5523),
    "hindupur": (13.8284, 77.4919),
    "dharmavaram": (14.4137, 77.7126),
    "tadipatri": (14.9082, 78.0105),

    # Telangana
    "telangana": (17.3850, 78.4867),
    "hyderabad": (17.3850, 78.4867),
    "secunderabad": (17.4399, 78.4983),
    "warangal": (17.9689, 79.5941),
    "hanamkonda": (18.0125, 79.5540),
    "karimnagar": (18.4386, 79.1288),
    "nizamabad": (18.6725, 78.0941),
    "khammam": (17.2473, 80.1514),
    "ramagundam": (18.7551, 79.4740),
    "mahbubnagar": (16.7488, 77.9856),
    "nalgonda": (17.0577, 79.2684),
    "adilabad": (19.6641, 78.5320),
    "suryapet": (17.1439, 79.6239),
    "siddipet": (18.1018, 78.8520),
    "miryalaguda": (16.8741, 79.5637),

    # Kerala & South
    "wayanad": (11.6854, 76.1320),
    "kochi": (9.9312, 76.2673),
    "cochin": (9.9312, 76.2673),
    "thiruvananthapuram": (8.5241, 76.9366),
    "trivandrum": (8.5241, 76.9366),
    "kozhikode": (11.2588, 75.7804),
    "calicut": (11.2588, 75.7804),
    "idukki": (9.8494, 76.9806),
    "munnar": (10.0889, 77.0595),
    "kannur": (11.8745, 75.3704),
    "alappuzha": (9.4981, 76.3388),
    "alleppey": (9.4981, 76.3388),
    "kollam": (8.8932, 76.6141),
    "palakkad": (10.7867, 76.6548),
    "thrissur": (10.5276, 76.2144),
    "kottayam": (9.5916, 76.5222),

    # Tamil Nadu
    "chennai": (13.0827, 80.2707),
    "madurai": (9.9252, 78.1198),
    "coimbatore": (11.0168, 76.9558),
    "salem": (11.6643, 78.1460),
    "tiruchirappalli": (10.7905, 78.7047),
    "trichy": (10.7905, 78.7047),
    "cuddalore": (11.7480, 79.7714),
    "nagapattinam": (10.7656, 79.8424),
    "tirunelveli": (8.7139, 77.7567),

    # Karnataka
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "mysuru": (12.2958, 76.6394),
    "mysore": (12.2958, 76.6394),
    "mangalore": (12.9141, 74.8560),
    "mangaluru": (12.9141, 74.8560),
    "hubballi": (15.3647, 75.1240),
    "belagavi": (15.8497, 74.4977),
    "kodagu": (12.3375, 75.8069),
    "coorg": (12.3375, 75.8069),
    "shivamogga": (13.9299, 75.5681),
    "udupi": (13.3409, 74.7421),

    # Maharashtra & West
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "nagpur": (21.1458, 79.0882),
    "nashik": (19.9975, 73.7898),
    "aurangabad": (19.8762, 75.3433),
    "chhatrapati sambhajinagar": (19.8762, 75.3433),
    "kolhapur": (16.7050, 74.2433),
    "amravati": (20.9374, 77.7796),
    "vidarbha": (20.9374, 77.7796),
    "solapur": (17.6599, 75.9064),
    "thane": (19.2183, 72.9781),
    "navi mumbai": (19.0330, 73.0297),

    # Gujarat
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "vadodara": (22.3072, 73.1812),
    "rajkot": (22.3039, 70.8022),
    "bhuj": (23.2420, 69.6669),
    "kutch": (23.7337, 69.8597),

    # North & Central
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "noida": (28.5355, 77.3910),
    "gurugram": (28.4595, 77.0266),
    "gurgaon": (28.4595, 77.0266),
    "chandigarh": (30.7333, 76.7794),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "varanasi": (25.3176, 82.9739),
    "ayodhya": (26.7922, 82.1998),
    "agra": (27.1767, 78.0081),
    "prayagraj": (25.4358, 81.8463),
    "allahabad": (25.4358, 81.8463),
    "jaipur": (26.9124, 75.7873),
    "jodhpur": (26.2389, 73.0243),
    "udaipur": (24.5854, 73.7125),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "jabalpur": (23.1815, 79.9864),
    "gwalior": (26.2183, 78.1828),
    "dehradun": (30.3165, 78.0322),
    "joshimath": (30.5564, 79.5663),
    "chamoli": (30.2937, 79.5603),
    "kedarnath": (30.7346, 79.0669),
    "haridwar": (29.9457, 78.1642),
    "rishikesh": (30.0869, 78.2676),
    "shimla": (31.1048, 77.1734),
    "kullu": (31.9579, 77.1095),
    "manali": (32.2432, 77.1892),
    "srinagar": (34.0837, 74.7973),
    "jammu": (32.7266, 74.8570),

    # East & North East
    "kolkata": (22.5726, 88.3639),
    "calcutta": (22.5726, 88.3639),
    "howrah": (22.5958, 88.2636),
    "siliguri": (26.7271, 88.3953),
    "darjeeling": (27.0410, 88.2663),
    "sundarbans": (21.9497, 88.9004),
    "puri": (19.8135, 85.8312),
    "bhubaneswar": (20.2961, 85.8245),
    "cuttack": (20.4625, 85.8828),
    "rourkela": (22.2604, 84.8536),
    "balasore": (21.4934, 86.9135),
    "patna": (25.5941, 85.1376),
    "gaya": (24.7914, 85.0002),
    "muzaffarpur": (26.1209, 85.3647),
    "ranchi": (23.3441, 85.3096),
    "jamshedpur": (22.8046, 86.2029),
    "dhanbad": (23.7957, 86.4304),
    "guwahati": (26.1445, 91.7362),
    "assam": (26.2006, 92.9376),
    "dibrugarh": (27.4728, 94.9120),
    "silchar": (24.8333, 92.7789),
    "jorhat": (26.7509, 94.2037),
    "manipur": (24.6637, 93.9063),
    "imphal": (24.8170, 93.9368),
    "shillong": (25.5788, 91.8933),
    "agartala": (23.8315, 91.2868),
    "aizawl": (23.7271, 92.7176),
    "kohima": (25.6751, 94.1086),
    "gangtok": (27.3389, 88.6065),
    "itanagar": (27.0844, 93.6053),
}


def geocode_location(text: str) -> tuple[float, float] | None:
    """
    Attempts to match a user-entered location string against known locations.
    Returns (lat, lng) or None if not recognized.
    """
    if not text:
        return None

    cleaned = text.lower().strip()

    # Direct match
    if cleaned in INDIAN_CITIES:
        return INDIAN_CITIES[cleaned]

    # Partial / word boundary match
    import re
    words = re.findall(r"[a-z]+", cleaned)
    for word in words:
        if word in INDIAN_CITIES:
            return INDIAN_CITIES[word]

    # Substring search
    for city, coords in INDIAN_CITIES.items():
        if city in cleaned:
            return coords

    return None
