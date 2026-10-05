from pydantic import BaseModel


class ZoneCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    population_density: float = 0.0
    accessibility_score: float = 0.5
    vulnerability_score: float = 0.5
    children_pct: float = 25.0
    elder_pct: float = 10.0
    disability_pct: float = 2.0


class ZoneOut(ZoneCreate):
    id: str

    class Config:
        from_attributes = True