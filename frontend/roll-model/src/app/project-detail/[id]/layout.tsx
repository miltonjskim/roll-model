'use client';
import ProjectDetailHeader from '@/widgets/project/project-detail/ProjectDetailHeader';
import ProjectDetailTabs from '@/widgets/project/project-detail/ProjectDetailTabs';
import { ReactNode } from 'react';

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto w-[80vw] py-8">
        <ProjectDetailHeader />
        <ProjectDetailTabs />
        <main>{children}</main>
      </div>
    </div>
  );
}
