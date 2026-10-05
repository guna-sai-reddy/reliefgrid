from pydantic import BaseModel


class IncidentCreate(BaseModel):
    code: str
    type: str
    location: str
    latitude: float
    longitude: float
    affected_population: int = 0
    description: str | None = None
    priority: str = "medium"
    demand_food: float = 0.0
    demand_water: float = 0.0
    demand_medical: float = 0.0
    demand_shelter: float = 0.0


class IncidentOut(BaseModel):
    id: str
    code: str
    type: str
    location: str
    latitude: float
    longitude: float
    affected_population: int
    priority: str
    priority_override: bool
    status: str
    demand_food: float
    demand_water: float
    demand_medical: float
    demand_shelter: float

    class Config:
        from_attributes = True


class PriorityOverride(BaseModel):
    priority: str
    reason: str | None = None