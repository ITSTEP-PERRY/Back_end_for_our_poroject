import type {DeepStylesType} from "antd/es/_util/hooks/useMergeSemantic/semanticType";
import type {CSSProperties} from "react";

export type FormDeepStylesType =  DeepStylesType<{
    root?: CSSProperties
    label?: CSSProperties
    content?: CSSProperties
    help?: CSSProperties
    helpItem?: CSSProperties
    extra?: CSSProperties
} | undefined>