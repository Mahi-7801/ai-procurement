from main import app
from fastapi.routing import APIRoute

# Collect routes including those in sub-routers
def get_routes(app_or_router, prefix=""):
    for route in app_or_router.routes:
        if isinstance(route, APIRoute):
            print(f"Path: {prefix}{route.path}, Methods: {route.methods}")
        elif hasattr(route, 'app') and hasattr(route.app, 'routes'):
             # This handles sub-apps or mounts if needed, but not standard include_router
             pass
        elif hasattr(route, 'path') and hasattr(route, 'routes'):
             # Standard APIRoute with children (prefix)
             get_routes(route, prefix=prefix + route.path)

get_routes(app)
