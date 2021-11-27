use near_sdk::{AccountId, Balance, env, near_bindgen};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::serde::{Deserialize, Serialize};

#[global_allocator]
static ALLOC: near_sdk::wee_alloc::WeeAlloc = near_sdk::wee_alloc::WeeAlloc::INIT;

// This declares a new complex type which will
// be used for variables later.
// It will represent a single voter.
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Voter {
    weight: u128,
    is_voted: bool,
    delegated_to: AccountId,
    vote: Balance,
}

// This is a type for a single proposal.
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Eq, Ord, PartialOrd, PartialEq, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Proposal {
    name: AccountId,
    // short name (up to 32 bytes)
    vote_count: Balance, // number of accumulated votes
}

/// @title Voting with delegation.
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct VotingContract {
    // A dynamically-sized array of `Proposal` structs.
    proposals: Vector<Proposal>,
    // This declares a state variable that
    // stores a `Voter` struct for each possible address.
    voters: LookupMap<AccountId, Voter>,
    chairperson: AccountId,
    is_finished: bool,
}

impl Default for VotingContract {
    fn default() -> Self {
        env::panic(b"Voting contract should be initialized before usage")
    }
}

/// Create a new ballot to choose one of `proposalNames`.
#[near_bindgen]
impl VotingContract {
    #[init]
    pub fn new(proposal_names: Vec<AccountId>) -> Self {
        env::log(format!("chairperson: {}", env::current_account_id()).as_bytes());
        // For each of the provided proposal names,
        // create a new proposal object and add it
        // to the end of the array.
        let mut proposals = Vector::new(b'p');
        let proposals_vec: Vec<Proposal> = proposal_names
            .iter()
            .map(|x| Proposal { name: x.to_string(), vote_count: 0 })
            .collect();
        proposals.extend(proposals_vec);
        /*for item in proposal_names.iter_mut() {
            proposals.insert(item, &Proposal { name: item.to_string(), vote_count: 0 })
        }*/
        VotingContract {
            proposals,
            voters: LookupMap::new(b'v'),
            chairperson: env::current_account_id(),
            is_finished: false,
        }
    }

    // Give `voter` the right to vote on this ballot.
    // May only be called by `chairperson`.
    pub fn give_right_to_vote(&mut self, voter_id: AccountId) {
        // If the first argument of `require` evaluates
        // to `false`, execution terminates and all
        // changes to the state and to Ether balances
        // are reverted.
        // It is often a good idea to use `require` to check if
        // functions are called correctly.
        let account_id = env::predecessor_account_id();
        if account_id.eq(&self.chairperson) {
            self.voters.insert(&voter_id, &Voter {
                weight: 1,
                is_voted: false,
                delegated_to: account_id,
                vote: 1,
            });
        }
    }

    pub fn add_right_to_vote(&mut self) {
        let account_id = env::predecessor_account_id();
        self.voters.insert(&account_id, &Voter {
            weight: 1,
            is_voted: false,
            delegated_to: account_id.clone(),
            vote: 1,
        });
    }

    pub fn add_proposal(&mut self, proposal_id: AccountId) {
        let mut is_exist = false;

        for proposal in self.proposals.iter() {
            if proposal.name.eq(&proposal_id) {
                is_exist = true;
            }
        }
        if !is_exist {
            self.proposals.push(&Proposal { name: proposal_id, vote_count: 0 });
        }
    }

    /// Ending voting
    pub fn stop_voting(&mut self) {
        let account_id = env::predecessor_account_id();
        if account_id.eq(&self.chairperson) {}
        self.is_finished = true;
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the first three of the winner
    pub fn winning_proposal(&self, count: Option<u64>) -> Vec<Proposal> {
        let mut winning = Vec::new();
        let mut n = self.proposals.len();
        let count = count.unwrap_or_default();
        if (count > 0) && (count < n) {
            n = count;
        }

        // self.proposals[0..n].to_vec()
        for i in 0..n {
            winning.push(Proposal { name: self.proposals.get(i).unwrap().name, vote_count: self.proposals.get(i).unwrap().vote_count })
        }
        winning
    }

    pub fn check_votes(&self, name: AccountId) -> Option<Proposal> {
        env::log(format!("account: {}", name).as_bytes());
        for item in self.proposals.iter() {
            if item.name.eq(&name) {
                return Some(Proposal { name: item.name.clone(), vote_count: item.vote_count });
            }
        }
        None
    }

    /// Give your vote (including votes delegated to you)
    /// to proposal `proposals[proposal].name`.
    pub fn vote(&mut self, proposal_id: AccountId) -> Result<(), String> {
        // check right to account_id
        let account_id = env::predecessor_account_id();
        let mut voter: Voter;
        if self.voters.get(&account_id).is_some() {
            voter = self.voters.get(&account_id).unwrap();
            voter.is_voted = true;
            self.voters.insert(&account_id, &voter);
            let mut index: u64 = 0;
            let mut vote_count = 0;
            let mut is_found = false;
            for item in self.proposals.iter() {
                if item.name.eq(&proposal_id) {
                    vote_count = item.vote_count + (voter.vote * voter.weight);
                    is_found = true;
                    break;
                }
                index = index + 1;
            }
            if is_found {
                self.proposals.replace(index, &Proposal { name: proposal_id.clone(), vote_count });
                let mut sorted_vec = self.proposals.to_vec();
                sorted_vec.sort_by(|a, b| b.vote_count.cmp(&a.vote_count));
                self.proposals.clear();
                self.proposals.extend(sorted_vec);
            }
            Ok(())
        } else {
            Err("voter not found, please register".to_string())
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use near_sdk::{testing_env, VMContext};
    use near_sdk::MockedBlockchain;

    use super::*;

    fn robert() -> AccountId {
        "robert.testnet".to_string()
    }

    fn mike() -> AccountId {
        "mike.testnet".to_string()
    }

    // part of writing unit tests is setting up a mock context
    // this is a useful list to peek at when wondering what's available in env::*
    fn get_context(predecessor_account_id: String, storage_usage: u64) -> VMContext {
        VMContext {
            current_account_id: "alice.testnet".to_string(),
            signer_account_id: "jane.testnet".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id,
            input: vec![],
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view: false,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn start_vote() {
        let context = get_context(robert(), 0);
        testing_env!(context);
        let contract = VotingContract::new(vec!["alice".to_string(), "bob".to_string()]);
        let res = contract.check_votes("alice".to_string());
        // println!("result: {:?}", res.unwrap());
    }

    #[test]
    fn give_right_to_vote() {
        let context = get_context(mike(), 0);
        testing_env!(context);
        let mut contract = VotingContract::new(vec!["alice".to_string(), "bob".to_string()]);
        contract.give_right_to_vote(mike());
        contract.vote("alice".to_string());
        let res = contract.check_votes("alice".to_string());
        // println!("result: {:?}", res.unwrap());
    }
}
