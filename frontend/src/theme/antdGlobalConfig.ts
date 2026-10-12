import {type ThemeConfig} from "antd";
import {colors} from "./colors.ts";

export const config: ThemeConfig = {
    token: {
        colorPrimary: colors.primary,
        fontFamily: "Mulish",
        colorTextLightSolid: colors.darkText,
    },
    components:{
        Button: {
            lineWidth: 2.5,
            defaultHoverColor: colors.darkText,
            defaultActiveColor: colors.darkText,

        },
        Input: {
            colorTextLightSolid: colors.darkText,
            colorBorder: colors.inputBorder,
            hoverBorderColor: colors.inputBorder,
            activeBorderColor: colors.inputBorder,
            borderRadius: 4,
        },
        Checkbox: {
            colorWhite: colors.darkText,
            colorBorder: colors.inputBorder,
            lineWidth: 1.5,
            borderRadius: 2
        }
    }
}

