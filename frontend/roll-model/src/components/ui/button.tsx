import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				black: "bg-[#181d2b] text-white hover:bg-[#181d2b]/90 disabled:bg-gray-200 disabled:text-gray-400",
				outline: "border border-[#d1d5db] text-[#181d2b] bg-white hover:bg-white disabled:bg-gray-200 disabled:text-gray-400 disabled:border-[#d1d5db]",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 px-3",
				lg: "h-11 px-8 text-base",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "black",
			size: "default",
		},
	}
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
