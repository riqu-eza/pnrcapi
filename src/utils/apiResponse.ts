import type { Response } from 'express';

// /utils/apiResponse.ts
export interface SuccessResponse<T> {
    status: 'success';
    message: string;
    data: T;
}

export interface ErrorResponse {
    status: 'error';
    message: string;
}

export const sendSuccess = <T>(res: Response, data: T, message = 'Success'): void => {
    res.status(200).json({ status: 'success', message, data } as SuccessResponse<T>);
};

export const sendError = (res, message = 'Error', code = 500) => {
  res.status(code).json({ status: 'error', message });
};
