export async function deleteAccount() {
  const response = await fetch(`/api/account`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function setLocale(locale: string) {
  const response = await fetch(`/api/account/locale`, {
    method: 'POST',
    body: JSON.stringify({ locale }),
  });
  return response.json();
}
