
import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className={cn("h-6 w-6", className)}
        >
            <path
                d="M12 2L4 5v6c0 5.55 3.58 10.42 8 11.92 4.42-1.5 8-6.37 8-11.92V5l-8-3z"
                stroke="#38B6FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 22C16.42 20.5 20 15.63 20 11V5l-8-3-8 3v6c0 5.55 3.58 10.42 8 11.92z"
                fill="#38B6FF"
                fillOpacity="0.1"
            />
            <path
                d="M15.5 9.5l-5.5 5.5-2.5-2.5"
                stroke="#4CAF50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
             <text
                x="12"
                y="18.5"
                textAnchor="middle"
                fontSize="4"
                fontWeight="bold"
                fill="#4CAF50"
            >
                RS
            </text>
        </svg>
    );
};
