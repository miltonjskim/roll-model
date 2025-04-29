import { toast } from "sonner";

export const showErrorToast = (message: string = "오류가 발생했습니다.") => {
	toast.error(message);
};

export const showSuccessToast = (message: string) => {
	toast.success(message);
};
