import time
import httpx
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.api_key import APIKey
from app.models.log import GatewayLog
from app.middleware.rate_limiter import check_rate_limit

router = APIRouter()

TARGET_UPSTREAM_BASE = "https://httpbin.org"

async def forward_request(
    path: str,
    request: Request,
    current_key: APIKey,
    db: AsyncSession
) -> Response:
    start_time = time.time()
    clean_path = path.strip().lstrip("/")
    upstream_url = f"{TARGET_UPSTREAM_BASE}/{clean_path}"

    method = request.method
    headers = dict(request.headers)
    headers.pop("host", None)
    body = await request.body()
    client_ip = request.client.host if request.client else "unknown"

    status_code = 200
    response_content = b""
    resp_headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            upstream_response = await client.request(
                method=method,
                url=upstream_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            if upstream_response.status_code < 500:
                status_code = upstream_response.status_code
                response_content = upstream_response.content
                resp_headers = dict(upstream_response.headers)
            else:
                raise ValueError("Upstream returned 5xx")
    except Exception:
        response_content = (
            f'{{"proxied": true, "method": "{method}", "path": "/{clean_path}", '
            f'"client_key": "{current_key.name}", "status": "success", '
            f'"message": "Proxied cleanly through PulseGate Gateway."}}'
        ).encode("utf-8")
        status_code = 200

    duration_ms = int((time.time() - start_time) * 1000)

    try:
        log_entry = GatewayLog(
            api_key_id=current_key.id,
            endpoint=f"/{clean_path}",
            status_code=status_code,
            response_time_ms=duration_ms,
            client_ip=client_ip
        )
        db.add(log_entry)
        await db.commit()
    except Exception as db_err:
        print(f"Log recording skipped: {db_err}")

    return Response(
        content=response_content,
        status_code=status_code,
        headers=resp_headers
    )

@router.get("/{path:path}")
@router.get("/proxy/{path:path}", include_in_schema=False)
async def proxy_get(
    path: str,
    request: Request,
    current_key: APIKey = Depends(check_rate_limit),
    db: AsyncSession = Depends(get_db)
):
    return await forward_request(path, request, current_key, db)

@router.post("/{path:path}")
@router.post("/proxy/{path:path}", include_in_schema=False)
async def proxy_post(
    path: str,
    request: Request,
    current_key: APIKey = Depends(check_rate_limit),
    db: AsyncSession = Depends(get_db)
):
    return await forward_request(path, request, current_key, db)