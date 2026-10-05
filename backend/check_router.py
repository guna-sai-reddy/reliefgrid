"""Walk sub-routers to find all API routes."""
from fastapi.routing import APIRoute, APIRouter
from app.api.v1.router import api_router


def walk(router, prefix=""):
    count = 0
    for r in router.routes:
        if isinstance(r, APIRoute):
            methods = ",".join(sorted(r.methods))
            print(f"  {methods:10s}  {prefix}{r.path}")
            count += 1
        elif isinstance(r, APIRouter) or hasattr(r, "routes"):
            sub_prefix = getattr(r, "prefix", "") or ""
            count += walk(r, prefix + sub_prefix)
    return count


print("Routes in api_router:\n")
total = walk(api_router)
print(f"\n✅ Total routes: {total}")
