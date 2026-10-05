from pydantic import BaseModel


class DepotCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    max_transport_per_trip: float = 5000.0


class DepotUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    max_transport_per_trip: float | None = None


class DepotOut(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    max_transport_per_trip: float

    class Config:
        from_attributes = True