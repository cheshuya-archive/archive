import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[transform,background-color,color,opacity,box-shadow,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-[.96] disabled:pointer-events-none disabled:opacity-35", {
  variants: { variant: { ghost: "hover:bg-black/[.05] hover:opacity-100", outline: "border border-black/20 bg-white hover:border-black/35 hover:bg-neutral-100" }, size: { default: "h-10 px-4", icon: "h-10 w-10" } },
  defaultVariants: { variant: "ghost", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
