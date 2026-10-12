import type {IconType} from "../../types/IconType.ts";

export const UserIcon = ({color="black", size=40, fillColor="none", width=1.5}: IconType) => {
    return (
        <svg width={size} height={size}  viewBox="0 0 27 31" fill={fillColor} xmlns="http://www.w3.org/2000/svg">
            <path d="M25.89 29.9897C25.89 25.1197 23.97 19.4097 19.44 16.8897C18.52 16.3797 17.49 15.9997 16.35 15.7797C16.35 15.7797 14.03 15.1197 10.29 15.7797C9.15 15.9797 8.12 16.3797 7.2 16.8897C2.67 19.4097 0.75 25.1197 0.75 29.9897" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="13.52" cy="6.77" r="6.02" stroke={color} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

    )
}