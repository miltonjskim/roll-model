export interface DatasetRequest {
	delimiter: "comma" | "semicolon" | "tab" | "other";
	customDelimeter?: string; // delimeter가 other일 때만
	encoding: "UTF-8" | "CP949" | "EUC-KR" | "ISO-8859-1" | "UTF-16";
	hasHeader: boolean;
	columns: Column[];
}

export interface Column {
	name: string;
	type: string;
}

export const uploadDataset = async (payload: DatasetRequest) => {};
