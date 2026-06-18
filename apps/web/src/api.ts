export type CurrentUserResponse = {
  user: {
    cognitoSub: string;
    email: string | null;
    id: string;
  };
};

export async function fetchCurrentUser(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as CurrentUserResponse;
}
