#!/usr/bin/env bash
# https://docs.near.org/docs/tutorials/contracts/nfts/minting-nfts

./build.sh && \
export ID=challenge8-voting.3ugen.testnet && \
near delete $ID 3ugen.testnet && \
sleep 1 && \
near create-account $ID --masterAccount 3ugen.testnet --initialBalance 6 && \
sleep 1 && \
near deploy $ID --wasmFile ./res/voting.wasm && \
sleep 1 && \
near call $ID new '{"proposal_names": ["alice", "bob"]}' --accountId 3ugen.testnet && \
sleep 1 && \
near view $ID winning_proposal && \
sleep 1 && \
echo "!!! call add_right_to_vote" && \
near call $ID add_right_to_vote '{}' --accountId 3ugen.testnet && \
sleep 1 && \
echo "!!! call vote" && \
near call $ID vote '{"proposal_id": "alice"}' --accountId 3ugen.testnet && \
sleep 1 && \
echo "!!! call winning_proposal" && \
near view $ID winning_proposal
sleep 1 && \
echo "!!! call winning_proposal" && \
near view $ID winning_proposal '{"count": 1}'
sleep 1 && \
near call $ID add_proposal '{"proposal_id": "eve"}' --accountId 3ugen.testnet && \
echo "!!! call vote" && \
near call $ID vote '{"proposal_id": "eve"}' --accountId 3ugen.testnet && \
echo "!!! call winning_proposal" && \
near view $ID winning_proposal
