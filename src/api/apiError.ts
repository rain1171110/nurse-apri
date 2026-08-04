type ApiErrorData = {
  error?: string;
};

export const throwApiError = async (response: Response): Promise<never> => {
  const errorData: ApiErrorData = await response.json();
  throw new Error(errorData.error ?? `API error: ${response.status}`);
};
