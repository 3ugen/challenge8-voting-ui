import React from 'react';
import {Image, Stack, Text, ThemeProvider} from "@fluentui/react";
import AuthButton from "./AuthButton";
import {login} from "../utils";
import vote from "../vote.png";
import {appTheme, boldStyle, stackStyles, stackTokens} from "../Style";

function AuthPage() {
  return (
    <ThemeProvider theme={appTheme}>
      <Stack horizontalAlign="center" verticalAlign="center" verticalFill styles={stackStyles} tokens={stackTokens}>
        {/*<img className="App-logo" src={answ42} alt="logo"/>*/}
        <Image src={vote} width="300" height="300"/>
        <Text variant="xxLarge" styles={boldStyle}>
          Welcome to Near! {"<br/>"} please vote for the candidate you trust!
        </Text>
        <Text variant="large">
          Go ahead and click the button below to try it out:
        </Text>
        <AuthButton msg={"Sign in"} auth={login} align={"center"}/>
      </Stack>
    </ThemeProvider>
  );
}

export default AuthPage;