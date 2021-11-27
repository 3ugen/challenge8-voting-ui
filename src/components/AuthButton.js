import React from 'react';
import {PrimaryButton, Stack} from "@fluentui/react";

const stackTokens = {childrenGap: 15};
const AuthButton = ({msg, auth, align}) => {
  return (
    <Stack horizontal tokens={stackTokens} horizontalAlign={align}>
      <PrimaryButton text={msg} onClick={auth} allowDisabledFocus/>
    </Stack>
  );
};

export default AuthButton;