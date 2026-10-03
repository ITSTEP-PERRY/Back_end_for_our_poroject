import type {DeepStylesType} from "antd/es/_util/hooks/useMergeSemantic/semanticType";
import * as React from "react";

export type ModalDeepStylesType = DeepStylesType<{
    root?: React.CSSProperties
    header?: React.CSSProperties
    body?: React.CSSProperties
    footer?: React.CSSProperties
    container?: React.CSSProperties
    title?: React.CSSProperties
    wrapper?: React.CSSProperties
    mask?: React.CSSProperties
    close?: React.CSSProperties
} | undefined>