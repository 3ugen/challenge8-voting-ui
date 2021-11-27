#!/bin/bash

./build.sh && \
export NEAR_ACCT=hello-name.3ugen.testnet && \
near delete $NEAR_ACCT 3ugen.testnet && \
sleep 1 && \
near create-account $NEAR_ACCT --masterAccount 3ugen.testnet --initialBalance 10 && \
sleep 1 && \
near deploy $NEAR_ACCT --wasmFile ./res/hello_name.wasm && \
sleep 1 && \
echo "Keys before:" && \
near keys $NEAR_ACCT && \
sleep 1 && \
echo "!!! call init contract" && \
near call $NEAR_ACCT init '{}' --accountId 3ugen.testnet && \
sleep 1 && \
echo "!!! call get_number" && \
near view $NEAR_ACCT get_number && \
sleep 1 && \
echo "!!! call add_hello [new message]" && \
near call $NEAR_ACCT add_hello '{
  "hello": "welcome new user"
}' --accountId 3ugen.testnet && \
sleep 1 && \
echo "!!! call hello [username]" && \
near call $NEAR_ACCT hello '{
  "username": "dolly"
}' --accountId 3ugen.testnet && \
sleep 1 && \
echo "!!! call hello [username]" && \
near call $NEAR_ACCT hello '{
  "username": "molly"
}' --accountId 3ugen.testnet



#echo "Keys after"
#near keys $NEAR_ACCT
#near view $NEAR_ACCT get_unsolved_puzzles
#near view $NEAR_ACCT debug_get_puzzle '{"pk": "ed25519:CpqWpFLps6zNNXSwn9ZYgvTgSVQ598fn1kWXgjcA2uLp"}'
