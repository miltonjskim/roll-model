const WorkspaceLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return <div className="container bg-[theme(primary-white)] rounded-md max-w-[80vw] mx-auto p-4 text-center">{children}</div>;
};

export default WorkspaceLayout;
