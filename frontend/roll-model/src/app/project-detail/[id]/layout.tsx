"use client";
import ProjectDetailHeader from "@/widgets/project/project-detail/ProjectDetailHeader";
import ProjectDetailTabs from "@/widgets/project/project-detail/ProjectDetailTabs";
import { ReactNode, Suspense } from "react";

export default function ProjectDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="container mx-auto p-4">
      <ProjectDetailHeader />
      <ProjectDetailTabs />
      <main>{children}</main>
    </div>
  );
}
