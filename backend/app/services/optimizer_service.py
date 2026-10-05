"""
OR-Tools linear programming allocation model.
Maximises priority-weighted coverage subject to:
  - depot supply limits
  - transport capacity per trip
  - max distance constraint
  - incident demand caps
  - manual priority overrides (from commanders)
"""
import time
from typing import Sequence
from math import radians, sin, cos, sqrt, atan2
from ortools.linear_solver import pywraplp


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (sin(dlat / 2) ** 2
         + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2)
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def optimize_allocation(
    depots: Sequence[dict],
    incidents: Sequence[dict],
    resources: list[str],
    max_trip_km: float = 500.0,
    priority_override: dict[str, int] | None = None,
) -> dict:
    t0 = time.time()
    solver = pywraplp.Solver.CreateSolver("SCIP")
    solver.SetTimeLimit(30_000)

    # Precompute all depot → incident distances
    distances_km = {}
    for d in depots:
        for i in incidents:
            distances_km[(d["id"], i["id"])] = haversine_km(
                d["latitude"], d["longitude"], i["latitude"], i["longitude"]
            )

    # Decision variables: x[d, i, r] = units of resource r sent from depot d to incident i
    x = {}
    for d in depots:
        for i in incidents:
            if distances_km[(d["id"], i["id"])] > max_trip_km:
                continue
            for r in resources:
                x[(d["id"], i["id"], r)] = solver.NumVar(
                    0, solver.infinity(), f"x_{d['id']}_{i['id']}_{r}"
                )

    if not x:
        return {"allocation": [], "total_allocated": 0, "coverage_pct": 0,
                "unmet_demand": {}, "solve_time_ms": 0, "status": "INFEASIBLE"}

    # Objective: maximise priority-weighted coverage
    objective = solver.Objective()
    for (d_id, i_id, r), var in x.items():
        inc = next(i for i in incidents if i["id"] == i_id)
        weight = inc.get("priority_weight", 5)
        if priority_override and i_id in priority_override:
            weight = priority_override[i_id]
        objective.SetCoefficient(var, float(weight))
    objective.SetMaximization()

    # Supply constraints: cannot send more than depot has
    for d in depots:
        for r in resources:
            vs = [x[(d["id"], i["id"], r)] for i in incidents
                  if (d["id"], i["id"], r) in x]
            if vs:
                solver.Add(sum(vs) <= d.get("supply", {}).get(r, 0))

    # Transport capacity: per-trip cap
    for d in depots:
        for i in incidents:
            vs = [x[(d["id"], i["id"], r)] for r in resources
                  if (d["id"], i["id"], r) in x]
            if vs:
                solver.Add(sum(vs) <= d.get("max_transport_per_trip", 5000))

    # Demand cap: do not over-supply
    for i in incidents:
        for r in resources:
            demand = i.get("demand", {}).get(r, 0)
            vs = [x[(d["id"], i["id"], r)] for d in depots
                  if (d["id"], i["id"], r) in x]
            if vs:
                solver.Add(sum(vs) <= demand)

    status = solver.Solve()
    solve_ms = int((time.time() - t0) * 1000)

    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return {"allocation": [], "total_allocated": 0, "coverage_pct": 0,
                "unmet_demand": {}, "solve_time_ms": solve_ms, "status": "INFEASIBLE"}

    allocation = []
    total_alloc = 0.0
    for (d_id, i_id, r), var in x.items():
        q = var.solution_value()
        if q > 1e-6:
            allocation.append({
                "depot_id": d_id,
                "incident_id": i_id,
                "resource_type": r,
                "quantity": round(q, 2),
                "distance_km": round(distances_km[(d_id, i_id)], 2),
            })
            total_alloc += q

    total_demand = sum(sum(i.get("demand", {}).values()) for i in incidents)
    coverage = (total_alloc / total_demand * 100) if total_demand else 0

    unmet = {}
    for r in resources:
        req = sum(i.get("demand", {}).get(r, 0) for i in incidents)
        got = sum(a["quantity"] for a in allocation if a["resource_type"] == r)
        unmet[r] = round(max(req - got, 0), 2)

    return {
        "allocation": allocation,
        "total_allocated": round(total_alloc, 2),
        "coverage_pct": round(coverage, 2),
        "unmet_demand": unmet,
        "solve_time_ms": solve_ms,
        "status": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE",
    }