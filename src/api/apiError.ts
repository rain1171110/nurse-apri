type ApiErrorData = {
  error?: string;
};

export const throwApiError = async (response: Response): Promise<never> => {
  const errorData: ApiErrorData = await response.json();
  throw new Error(errorData.error ?? `API error: ${response.status}`);
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "サーバーへ接続できません";
    }
    return error.message;
  } else {
    return fallbackMessage;
  }
};
