"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn("grid h-12 grid-cols-2 bg-[#f1f1f1] p-0.5", className)} {...props} />);
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn("text-sm font-semibold text-neutral-400 transition-[transform,color,background-color,box-shadow] duration-200 ease-out hover:text-neutral-700 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-[.98] disabled:pointer-events-none disabled:opacity-35 data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm", className)} {...props} />);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = TabsPrimitive.Content;
export { Tabs, TabsList, TabsTrigger, TabsContent };
