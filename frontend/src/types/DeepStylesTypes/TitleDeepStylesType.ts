import type {DeepStylesType} from "antd/es/_util/hooks/useMergeSemantic/semanticType";
import type {CSSProperties} from "react";

export type TitleDeepStylesType = DeepStylesType<{
    root?: CSSProperties
    actions?: CSSProperties
    action?: CSSProperties
    textarea?: CSSProperties
} | undefined>