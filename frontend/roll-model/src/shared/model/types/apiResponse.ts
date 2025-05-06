export interface ApiResponse<T> {
	status: number;
	message: string;
	data: T;
	error: ApiError | null;
}

export interface ApiError {
	code: string;
	message: string;
}
