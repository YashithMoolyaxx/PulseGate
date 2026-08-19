import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.metrics import REQUEST_COUNT, REQUEST_LATENCY

class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        endpoint = request.url.path

        if endpoint in ("/metrics", "/v1/health", "/", "/docs", "/openapi.json"):
            return await call_next(request)

        start_time = time.time()

        try:
            response = await call_next(request)
            status_code = str(response.status_code)
        except Exception as exc:
            status_code = "500"
            raise exc from None
        finally:
            duration = time.time() - start_time
            # Record Latency Histogram & Request Counter
            REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=endpoint,
                http_status=status_code
            ).inc()

        return response