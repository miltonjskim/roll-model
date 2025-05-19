'use client';

import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';

interface EmptyDataAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmptyDataAlertDialog = ({ open, onOpenChange }: EmptyDataAlertDialogProps) => {
  const router = useRouter();

  const handleConfirm = () => {
    onOpenChange(false);
    router.push('/workspace'); // 메인 화면 경로
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>데이터가 없습니다</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-gray-600">데이터가 존재하지 않아 프로젝트 생성 페이지로 이동합니다.</p>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmptyDataAlertDialog;
