import type {FormDeepStylesType} from "../../types/DeepStylesTypes/FormDeepStylesType.ts";
import type {InputDeepStylesType} from "../../types/DeepStylesTypes/InputDeepStylesType.ts";
import {colors} from "../../theme/colors.ts";
import type {CSSProperties} from "react";

export const loginFormStyles: FormDeepStylesType = {
    help: {
        padding: "0 20px",
    },
}
export const loginFormStyle: CSSProperties = {
    height: "100%",
}
export const loginFormItemStyles:CSSProperties = {
    margin: "0",
}

export const inputErrorStyles: InputDeepStylesType = {
    root: {
        borderColor: colors.inputBorder,
    },
    prefix: {
        color: colors.destructive,
    }
}