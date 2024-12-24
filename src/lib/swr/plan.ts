export async function createCheckoutSession(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}/billing/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json() as Promise<string>;
}

export async function manageBilling(teamId: string) {
  const response = await fetch(`/api/teams/${teamId}/billing/manage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json() as Promise<{ url: string }>;
}
