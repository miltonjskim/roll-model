import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface FailedAllPreprocessingRequestAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMsg: string | null;
  setShowModal: (boolean: boolean) => void;
}

const FailedAllPreprocessingRequestAlertDialog = ({ open, onOpenChange, errorMsg, setShowModal }: FailedAllPreprocessingRequestAlertDialogProps) => {
  const handleConfirm = () => {
    onOpenChange(false);
    setShowModal(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>전처리 일괄 작업 실패</AlertDialogTitle>
          <AlertDialogDescription>
            {errorMsg ? (
              (() => {
                const [_, step, type, message] = errorMsg.split(':', 4); // 단계:6:ONEHOT_ENCODING:내용

                return (
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-800">🚫 실패 단계:</span> {step}단계
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">⚙️ 처리 방식:</span> {type}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">📝 사유:</span> {message}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-gray-600">전처리 도중 오류가 발생했습니다. 다시 시도해 주세요.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FailedAllPreprocessingRequestAlertDialog;
