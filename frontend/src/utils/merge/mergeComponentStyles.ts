import type {NestedStyles} from "../../types/NestedStyles.ts";

export const mergeComponentStyles = <T extends NestedStyles>(base: T, incoming: T) => {
    const target = { ...incoming } as T;

    Object.keys(base).forEach((key) => {
        const k = key as keyof T;
        target[k] = {
            ...base[k],
            ...(incoming ? incoming[k] : {}),
        } as T[keyof T];
    });

    return target;
};