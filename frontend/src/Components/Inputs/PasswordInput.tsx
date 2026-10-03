import {inputStyles} from "./css/inputStyles.ts";
import type {PasswordProps} from "antd/es/input";
import {Input} from "antd";
import {EyeOpenIcon} from "../Icon/EyeOpenIcon.tsx";
import {EyeClosedIcon} from "../Icon/EyeClosedIcon.tsx";
import type {InputDeepStylesType} from "../../types/DeepStylesTypes/InputDeepStylesType.ts";
import {mergeComponentStyles} from "../../utils/merge/mergeComponentStyles.ts";

export const PasswordInput = ({styles, ...props}: Omit<PasswordProps,"iconRender">) => {
    let customStyles = inputStyles;
    const st = styles as InputDeepStylesType
    if(inputStyles && st) {
        customStyles = mergeComponentStyles(inputStyles, st);
    }

    return (
        <Input.Password styles={customStyles} iconRender={v => v ? <EyeOpenIcon size={24}/> : <EyeClosedIcon size={24} />} {...props}/>
    )
}