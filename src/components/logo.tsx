
import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-6 w-6", className)}
        >
            <path
                d="M12 2L4 5v6c0 5.55 3.58 10.42 8 11.92 4.42-1.5 8-6.37 8-11.92V5l-8-3z"
                stroke="#2962FF"
                strokeWidth="1.5"
            />
            <path
                d="M15.5 9.5l-5.5 5.5-2.5-2.5"
                stroke="#4CAF50"
                strokeWidth="2"
            />
        </svg>
    );
};
