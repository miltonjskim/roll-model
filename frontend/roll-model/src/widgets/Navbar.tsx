import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
	const id = 1; // TODO: userId든 뭐든 받아와서 수정

	return (
		<nav className="min-w-[90vw] basis-[90vw] flex justify-between items-center py-8 px-24">
			<div>
				<Link
					href="/"
					className="hover:text-[var(--primary-black)]">
					<Image
						src="/logo.svg"
						alt="logo"
						width={120}
						height={40}
					/>
				</Link>
			</div>
			<div className="space-x-20 text-[var(--color-gray-01)] text-md">
				<Link
					href="/guide"
					className="hover:text-[var(--primary-black)] hover:border-b-[2px] border-b-[var(--color-blue-01)] hover:text-[1.125rem] hover:font-semibold transition-all duration-300 hover:w-full">
					Guide
				</Link>
				<Link
					href="/dashboard/[id]"
					as={`/dashboard/${id}`}
					className="hover:text-[var(--primary-black)] hover:border-b-[2px] border-b-[var(--color-blue-01)] hover:text-[1.125rem] hover:font-semibold transition-all duration-300 hover:w-full">
					Dashboard
				</Link>
				<Link
					href="/open-source"
					className="hover:text-[var(--primary-black)] hover:border-b-[2px] border-b-[var(--color-blue-01)] hover:text-[1.125rem] hover:font-semibold transition-all duration-300 hover:w-full">
					Open Source
				</Link>
				<Link
					href="/workspace"
					className="hover:text-[var(--primary-black)] hover:border-b-[2px] border-b-[var(--color-blue-01)] hover:text-[1.125rem] hover:font-semibold transition-all duration-300 hover:w-full">
					Workspace
				</Link>
			</div>
			<div>user</div>
		</nav>
	);
};

export default Navbar;
