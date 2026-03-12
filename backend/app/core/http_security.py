from fastapi.responses import Response

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
}

FINGERPRINTING_HEADERS = (
    "Server",
    "X-Powered-By",
)


def apply_security_headers(response: Response) -> Response:
    for name, value in SECURITY_HEADERS.items():
        response.headers[name] = value
    for name in FINGERPRINTING_HEADERS:
        if name in response.headers:
            del response.headers[name]
    return response
