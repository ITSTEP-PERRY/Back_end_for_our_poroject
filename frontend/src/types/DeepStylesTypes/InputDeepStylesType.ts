import * as React from "react";
import type {DeepStylesType} from "antd/es/_util/hooks/useMergeSemantic/semanticType";

export type InputDeepStylesType =  DeepStylesType<{
    root?: React.CSSProperties
    prefix?: React.CSSProperties
    suffix?: React.CSSProperties
    clear?: React.CSSProperties
    input?: React.CSSProperties
    count?: React.CSSProperties
} | undefined>