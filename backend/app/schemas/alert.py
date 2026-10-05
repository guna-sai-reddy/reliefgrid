from pydantic import BaseModel


class AlertCreate(BaseModel):
    title: str
    message: str
    severity: str = "info"
    region: str | None = None


class AlertOut(AlertCreate):
    id: str
    is_active: bool

    class Config:
        from_attributes = True