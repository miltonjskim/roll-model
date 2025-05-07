const WorkspaceLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return <div className="container mx-auto max-w-[80vw] rounded-md p-4 text-center">{children}</div>;
};

export default WorkspaceLayout;
