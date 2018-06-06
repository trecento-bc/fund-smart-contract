// Copyright (c) 2018 Company Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.4.23;

import "../authority/Owned.sol";


contract TokenData is Owned {
    uint256 public supply;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public approvals;
    address logic;

    modifier onlyLogic {
        assert(msg.sender == logic);
        _;
    }

    constructor (address logic_, address owner_) public {
        logic = logic_;
        owner = owner_;
        balances[owner] = supply;
    }

    function setTokenLogic(address logic_) public onlyLogic {
        logic = logic_;
    }

    function setSupply(uint256 supply_) public onlyLogic {
        supply = supply_;
    }

    function setBalances(address guy, uint256 balance) public onlyLogic {
        balances[guy] = balance;
    }

    function setApprovals(address src, address guy, uint256 wad) public onlyLogic {
        approvals[src][guy] = wad;
    }


}
