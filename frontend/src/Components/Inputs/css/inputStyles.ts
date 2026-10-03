import type {InputDeepStylesType} from "../../../types/DeepStylesTypes/InputDeepStylesType.ts";
import {colors} from "../../../theme/colors.ts";

export const inputStyles: InputDeepStylesType = {
    root: {
        margin: "20px 0 10px 0px",
        padding: '12px 20px',
        width: '100%',
    },
    count: {
        position: 'absolute',
            width: 'fit-content',
            padding: '0 4px',
            top: 35,
            right: 10,
            backgroundColor: '#fff',
            fontFamily: "Mulish",
            fontWeight: "400",
            fontSize: '14px',
            color: colors.darkText,
    },
    prefix: {
        position: 'absolute',
            width: 'fit-content',
            padding: '0 4px',
            top: -13,
            left:  "20px",
            backgroundColor: '#fff',
            fontFamily: "Mulish",
            fontSize: '16px',
            fontWeight: "400",
            color: colors.darkText,
    },
    input: {
        fontSize: '18px',
    }
}