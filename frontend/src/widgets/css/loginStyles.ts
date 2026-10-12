import type {ModalDeepStylesType} from "../../types/DeepStylesTypes/ModalDeepStylesType.ts";
import type {TitleDeepStylesType} from "../../types/DeepStylesTypes/TitleDeepStylesType.ts";
import type {CSSProperties} from "react";

export const modalStyles: ModalDeepStylesType= {
    container: {
        padding: "24px",
        backgroundColor: '#F4FAFF',
        borderRadius: "8px",
        boxShadow: "none"
    },
}

export const titleMainStyles: TitleDeepStylesType = {
    root :{
        fontWeight: "600",
        fontSize: "40px",
        margin: "0",
    }
}

export const titleSecondStyles: TitleDeepStylesType = {
    root :{
        fontWeight: "400",
        fontSize: "24px",
        margin: "0",
    }
}

export const loginFormStyles: CSSProperties = {
    width: "100%",
}