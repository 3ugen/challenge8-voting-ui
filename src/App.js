import 'regenerator-runtime/runtime'
import React, {useState} from 'react'
import {
  IconButton,
  Image,
  loadTheme,
  Persona,
  PrimaryButton,
  Spinner,
  Stack,
  Text,
  ThemeProvider,
} from '@fluentui/react';
import Big from 'big.js'
import {logout} from './utils'
import {initializeIcons} from '@fluentui/font-icons-mdl2';
import {Icon} from '@fluentui/react/lib/Icon';
import getConfig from './config'
import AuthButton from "./components/AuthButton";
import AuthPage from "./components/AuthPage";
import {appTheme, boldStyle, stackStyles, stackTokens} from './Style.js'
import vote from "./vote.png";

initializeIcons();

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();


loadTheme(appTheme);

const {networkId} = getConfig()

const MyIcon = () => <Icon iconName="CompassNW"/>;

export default function App() {
  // use React Hooks to store greeting in component state
  const [amount, set_amount] = React.useState(0)
  const [accId, set_accId] = React.useState('')
  const [wallet_address, set_wallet_address] = React.useState('')
  const [isVoting, setIsVoting] = React.useState(false)

  const [winners, setWinners] = React.useState([])

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const [balance, setBalance] = useState('Your balance: 0 ANSR42 Token')
  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        set_accId(window.accountId)
        // window.contract is set by initContract in index.js
        window.contract.winning_proposal()
          .then(winning => {
            console.log(winning)
            setWinners([...winning])
          })
        window.contract.add_right_to_vote().then(res => {
          console.log(res)
        });
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return <AuthPage/>
  }


  const handleAddressChange = (msg) => {
    console.log(`new address: ${msg.target.value}`)
    let newMsg = msg.target.value;
    if (newMsg.length > 0) {
      set_wallet_address(newMsg)
    } else {
      set_wallet_address('')
    }
  }
  const handleTokenChange = (msg) => {
    console.log(`new ID: ${msg.target.value}`)
    let newMsg = msg.target.value;
    if (newMsg.length > 0) {
      if (!isNaN(newMsg)) {
        let amount = parseInt(msg.target.value, 10);
        if (amount > 10) {
          amount = 10
        }
        set_amount(amount)
      } else {
        set_amount(0)
      }
    } else {
      set_amount(0)
    }

  }

  const handleTokenClaim = () => {

    window.contract.ft_mint({
        receiver_id: window.accountId,
        amount: "10000"
      },
      BOATLOAD_OF_GAS,
      Big(1).times(10 ** 24).toFixed()
    )
      .then((res) => {
        console.log(`result: ${res}`)
        // setMintingState(2)
      })
  }

  const handleVote = (msg) => {
    console.log(`new ID: ${msg.target.value}`)

  }

  const handleTokenTransfer = () => {
    window.contract.storage_deposit(
      BOATLOAD_OF_GAS,
      Big(125).times(10 ** 16).toFixed()
    )
      .then(
        window.contract.ft_transfer(
          {
            receiver_id: wallet_address,
            amount: (amount * 1000).toString(),
          },
          BOATLOAD_OF_GAS,
          Big(1).times(1).toFixed()
        )
          .then((res) => {
            console.log(`result: ${res}`)
          })
      ).catch((e) => {
      console.log(`transaction error: ${e}`)
    })
  }


  const emojiIcon = {iconName: 'Emoji2'};
  const calloutProps = {gapSpace: 0};

  const hostStyles = {root: {display: 'inline-block'}};
  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <ThemeProvider theme={appTheme}>
      <Stack horizontal tokens={stackTokens} horizontalAlign="end">
        <Text variant="xxLarge" styles={boldStyle}>
          {accId}
        </Text>
        <AuthButton msg="Sign out" auth={logout} align={"end"}/></Stack>
      <Stack horizontalAlign="center" verticalAlign="center" verticalFill styles={stackStyles} tokens={stackTokens}>
        <Image src={vote} width="150" height="150"/>
        <Stack>
          <Text variant="xxLarge" styles={boldStyle}>
            Winner table:
          </Text>
          <PrimaryButton onClick={() => {
            if (window.walletConnection.isSignedIn()) {

              set_accId(window.accountId)
              // window.contract is set by initContract in index.js
              window.contract.winning_proposal()
                .then(winning => {
                  console.log(winning)
                  setWinners([...winning])
                })
            }
          }}
                         allowDisabledFocus disabled={false}
                         checked={false}>
            Update!
          </PrimaryButton>
          {winners.map((val, index) =>
            <Stack horizontal tokens={stackTokens} horizontalAlign="center">
              <Persona key={index.toString()}
                       text={val.name}
                       secondaryText={val.vote_count}
              />
              {/*<TooltipHost*/}
              {/*  content="Emoji"*/}
              {/*  // This id is used on the tooltip itself, not the host*/}
              {/*  // (so an element with this id only exists when the tooltip is shown)*/}
              {/*  id={useId('tooltip')}*/}
              {/*  calloutProps={calloutProps}*/}
              {/*/!*  styles={hoststyles}*!/*/}
              {/*/!*>*!/*/}
              {!isVoting &&
              <IconButton key={(index + 100).toString()} iconProps={emojiIcon} disabled={false} checked={false}
                          onClick={() => {
                            setIsVoting(true)
                            let id = val.name;
                            window.contract.vote(
                              {
                                proposal_id: id
                              }
                            ).then(res => {
                              console.log(res)
                              setIsVoting(false)
                            })
                          }}/>}
              {isVoting && <Spinner label="Transaction sending ..." ariaLive="assertive" labelPosition="right"/>}
              {/*</TooltipHost>*/}
            </Stack>
          )}
        </Stack>
      </Stack>
    </ThemeProvider>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'set_greeting' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
