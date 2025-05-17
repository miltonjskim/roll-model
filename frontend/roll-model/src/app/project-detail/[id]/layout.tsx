'use client';
import ProjectDetailHeader from '@/widgets/project/project-detail/ProjectDetailHeader';
import ProjectDetailTabs from '@/widgets/project/project-detail/ProjectDetailTabs';
import { ReactNode } from 'react';

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <ProjectDetailHeader />
      <ProjectDetailTabs />
      <main>{children}</main>
    </div>
  );
}
