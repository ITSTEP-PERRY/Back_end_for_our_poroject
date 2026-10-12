import {Input, type InputProps} from "antd";
import {inputStyles} from "./css/inputStyles.ts";
import {mergeComponentStyles} from "../../utils/merge/mergeComponentStyles.ts";
import type {InputDeepStylesType} from "../../types/DeepStylesTypes/InputDeepStylesType.ts";


export const TextInput = ({styles, ...props}: InputProps) => {
    let customStyles = inputStyles;
    const st = styles as InputDeepStylesType
    if(inputStyles && st) {
        customStyles = mergeComponentStyles(inputStyles, st);
    }
    return (
        <Input styles={customStyles} {...props}/>
    )
}