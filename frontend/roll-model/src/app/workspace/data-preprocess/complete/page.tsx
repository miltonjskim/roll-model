import { completedDatasetAtom } from '@/entities/workspace/data-config/workspaceAtoms';
import { useAtomValue } from 'jotai';

const CompletePreprocessDataPage = () => {
  const completedUploadset = useAtomValue(completedDatasetAtom);

  console.log('completedUploadset:', completedUploadset);

  return (
    <div>
      <h1>데이터 전처리 끝</h1>

      <div></div>
    </div>
  );
};

export default CompletePreprocessDataPage;
