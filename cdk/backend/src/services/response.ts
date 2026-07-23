const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

export function ok<T>(body: T) {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function created<T>(body: T) {
  return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function badRequest(message: string) {
  return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function unauthorized(message = 'Unauthorized') {
  return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function forbidden(message = 'Forbidden') {
  return { statusCode: 403, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function notFound(message = 'Not found') {
  return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function gone(message = 'Resource expired') {
  return { statusCode: 410, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function serverError(message = 'Internal server error') {
  return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}
