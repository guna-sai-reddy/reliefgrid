from pydantic import BaseModel, Field


class ZoneFeatures(BaseModel):
    magnitude: float = Field(ge=0, le=10, default=6.8)
    depth: float = Field(ge=0, le=700, default=12)
    weather_score: float = Field(ge=0, le=1, default=0.5)
    population_density: float = Field(ge=0, default=9500)
    accessibility_score: float = Field(ge=0, le=1, default=0.7)
    vulnerability_score: float = Field(ge=0, le=1, default=0.72)
    seismic_risk_score: float = Field(ge=0, le=1, default=0.8)
    exposure_score: float = Field(ge=0, le=1, default=0.75)
    resilience_score: float = Field(ge=0, le=1, default=0.4)
    children_pct: float = Field(default=28)
    elder_pct: float = Field(default=14)
    disability_pct: float = Field(default=3.5)


class PredictionRequest(BaseModel):
    zone_name: str | None = "Wayanad Sector 4 (New Disaster Alert)"
    features: ZoneFeatures


class ResourcePrediction(BaseModel):
    point: float
    ci_lower: float
    ci_upper: float
    vuln_factor: float


class PredictionResponse(BaseModel):
    id: str | None = None
    zone_name: str | None
    food: ResourcePrediction
    water: ResourcePrediction
    medical: ResourcePrediction
    shelter: ResourcePrediction
    priority: str
    recommended_warehouse: str | None = "Chennai South Depot (Hub Alpha)"
    route_distance_km: float | None = 210.0
    dispatch_eta_hours: float | None = 2.8
    report_id: str | None = None
    created_at: str | None = None