import type {IconType} from "../../types/IconType.ts";

export const EyeClosedIcon = ({color="black", size=40, fillColor="none", width=1.5}: IconType) => {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill={fillColor} xmlns="http://www.w3.org/2000/svg">
            <path d="M5 18.7002C8.23 23.5502 13.74 26.7502 20 26.7502C26.26 26.7502 31.77 23.5502 35 18.7002" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 27.3501V32.1501" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M30.5703 23.6001L33.9603 27.0001" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.44957 23.6001L6.05957 27.0001" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    )
}