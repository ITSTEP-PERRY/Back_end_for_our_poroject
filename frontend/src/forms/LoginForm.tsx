import {Checkbox, Flex, Form} from "antd";
import {TextInput} from "../Components/Inputs/TextInput.tsx";
import {PasswordInput} from "../Components/Inputs/PasswordInput.tsx";
import {Button} from "../Components/Buttons/Button.tsx";
import {inputErrorStyles, loginFormItemStyles, loginFormStyle, loginFormStyles} from "./css/loginFormStyles.ts";
import {useState} from "react";
import {colors} from "../theme/colors.ts";
import Text from "antd/es/typography/Text";
import {titleMainStyles, titleSecondStyles} from "../widgets/css/loginStyles.ts";
import Title from "antd/es/typography/Title";

export const LoginForm = () => {
    const [form] = Form.useForm();
    const [hasErrors, setHasErrors] = useState(false);

    const onFinishFailed = () => {
        setHasErrors(true);
    }

    return (
        <Form styles={loginFormStyles} form={form} onFinishFailed={onFinishFailed} style={{height: 520, width: 440}} >
            <Flex vertical gap={4} justify={"space-between"} style={loginFormStyle} align={"center"}>
                {/* Welcome title block*/}
                <Flex vertical align={"center"} gap={6}>
                    <Title styles={titleMainStyles}>Welcome back</Title>
                    <Title styles={titleSecondStyles}>Login into your account</Title>
                </Flex>
                <Flex vertical style={{width: "100%"}} justify={"center"}>
                    <Form.Item  name="username" rules={[{required: true, message: "Wrong or invalid email address"}]} style={loginFormItemStyles}>
                        <TextInput prefix="Email" placeholder="Enter your email" styles={hasErrors ? inputErrorStyles : undefined}/>
                    </Form.Item>
                    <Form.Item style={loginFormItemStyles}>
                        <PasswordInput prefix="Password" placeholder="Enter your password"/>
                    </Form.Item>
                    <Form.Item name="remember" valuePropName="checked" style={loginFormItemStyles}>
                        <Flex justify="space-between">
                            <Checkbox>Stay signed in</Checkbox>
                            <Text color={colors.darkText}>Forgot password?</Text>
                        </Flex>
                    </Form.Item>
                </Flex>
                <Button type="primary" htmlType="submit" style={{width: '100%'}}>
                    Log in
                </Button>
            </Flex>
        </Form>
    )
}