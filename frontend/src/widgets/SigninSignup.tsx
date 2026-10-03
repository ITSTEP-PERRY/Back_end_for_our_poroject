import {Button} from "../Components/Buttons/Button.tsx";
import {Flex, Modal} from "antd";
import {useState} from "react";
import SignupImage from "../assets/images/SiginSignup.png"
import {loginFormStyles, modalStyles} from "./css/loginStyles.ts";
import {LoginForm} from "../forms/LoginForm.tsx";
import Text from "antd/es/typography/Text";
import Link from "antd/es/typography/Link";
export const SigninSignup = () => {
    const [open, setOpen] = useState(false);

    const toggleModel = () => setOpen(!open);

    return (
        <>
            <Button type={"primary"} onClick={toggleModel}>Login</Button>
            <Modal open={open} closeIcon={false} footer={null} className="module" width={1280} styles={modalStyles} >
                <Flex gap={4}>
                    <Flex vertical  style={loginFormStyles} align={"center"} justify={"center"} gap={16}>
                        <LoginForm />
                        <Text>Don't have an account? <Link>Sign Up</Link></Text>
                    </Flex>
                    <div>
                        <img src={SignupImage} alt="Sign up" />
                    </div>
                </Flex>
            </Modal>
        </>
    )
}