const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function fetchMlService<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${ML_SERVICE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`ML Service Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
