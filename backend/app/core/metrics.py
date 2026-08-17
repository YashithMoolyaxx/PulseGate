from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

REQUEST_COUNT = Counter(
    "pulsegate_http_requests_total",
    "Total number of HTTP requests processed by PulseGate",
    ["method", "endpoint", "http_status"]
)

REQUEST_LATENCY = Histogram(
    "pulsegate_http_request_duration_seconds",
    "HTTP request latency in seconds across PulseGate endpoints",
    ["endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]
)

RATE_LIMIT_EXCEEDED = Counter(
    "pulsegate_rate_limit_exceeded_total",
    "Total number of requests rejected by Redis rate limiter",
    ["api_key_name"]
)

def get_latest_metrics() -> tuple[bytes, str]:
    """Generates the raw Prometheus text format output."""
    return generate_latest(), CONTENT_TYPE_LATEST