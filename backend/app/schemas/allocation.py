from pydantic import BaseModel


class AllocationRequest(BaseModel):
    max_trip_km: float = 500.0
    priority_override: dict[str, int] | None = None


class AllocationLine(BaseModel):
    depot_id: str
    incident_id: str
    resource_type: str
    quantity: float
    distance_km: float


class AllocationResponse(BaseModel):
    allocation: list[AllocationLine]
    total_allocated: float
    coverage_pct: float
    unmet_demand: dict[str, float]
    solve_time_ms: int
    status: str