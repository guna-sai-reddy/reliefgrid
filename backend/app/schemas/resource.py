from pydantic import BaseModel


class ResourceCreate(BaseModel):
    depot_id: str
    type: str
    quantity: float
    unit: str = "units"


class ResourceUpdate(BaseModel):
    quantity: float | None = None
    unit: str | None = None
    type: str | None = None
    depot_id: str | None = None


class ResourceOut(BaseModel):
    id: str
    depot_id: str
    type: str
    quantity: float
    unit: str

    class Config:
        from_attributes = True