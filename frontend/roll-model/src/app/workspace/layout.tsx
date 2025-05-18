const WorkspaceLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return <div>{children}</div>;
};

export default WorkspaceLayout;

// 'use client';

// import { useEffect, useState } from 'react';

// const WorkspaceLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
//   const [showGuideButton, setShowGuideButton] = useState(false);

//   useEffect(() => {
//     const dismissed = localStorage.getItem('guide.dismissed');
//     if (dismissed === 'true') {
//       setShowGuideButton(true);
//     }
//   }, []);

//   const handleResetGuide = () => {
//     localStorage.removeItem('guide.dismissed');
//     window.location.reload();
//   };

//   return (
//     <div>
//       {children}

//       {/* <button onClick={handleResetGuide} className="mb-4 rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200" title="가이드를 다시 시작합니다">
//         🔁 다시 가이드 보기
//       </button> */}
//     </div>
//   );
// };

// export default WorkspaceLayout;
