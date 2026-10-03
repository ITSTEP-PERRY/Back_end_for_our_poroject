import type {ButtonType} from "../../types/ButtonType.ts";
import {Button as AntdButton, type ButtonProps as AntdButtonProps} from "antd"
import  {type CSSProperties, type ReactNode} from "react";
import "./css/buttonStyles.css";
import * as React from "react";
import type {IconType} from "../../types/IconType.ts";
import {colors} from "../../theme/colors.ts";

export interface ButtonProps extends Omit<AntdButtonProps, 'type' | 'icon'> {
    type: ButtonType;
    style?: CSSProperties;
    children?: ReactNode;
    icon?: ReactNode;
}
export const Button = ({type, style, children, className = '', icon, ...props}: ButtonProps) => {

    const getIconType = () => {
        switch (type) {
            case "primary": return colors.darkText;
            case "secondary": return colors.secondary;
            case "tertiary": return colors.secondary;
            case "destructive": return colors.destructive;
            default: return colors.darkText;
        }
    }
    const processedIcon = React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<IconType>, {
            color: (icon.props as IconType).color ? (icon.props as IconType).color : getIconType(),
            size: (icon.props as IconType).size ? (icon.props as IconType).size : "20px",
            width: (icon.props as IconType).width ? (icon.props as IconType).width : "2.5px",
        })
        : icon;

    return (
        type == "primary" ? <AntdButton className={`my-primary ${className}`} icon={processedIcon} {...props} type={type} style={style}>{children}</AntdButton>
        : type == "secondary" ? <AntdButton className={`secondary ${className}`} icon={processedIcon} type={"default"} style={style}>{children}</AntdButton>
        : type == "tertiary" ? <AntdButton type={"text"} className={`tertiary ${className}`} icon={processedIcon} {...props} style={style}>{children}</AntdButton>
        : type == "destructive" ? <AntdButton type={"default"} className={`destructive ${className}`} icon={processedIcon} {...props} style={style}>{children}</AntdButton> : null
    )
}