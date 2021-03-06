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


import "./tokens/Token.sol";
import "./tokens/TokenLogic.sol";


contract OpenFundTokenLogic is TokenLogic {

    constructor (
        address token_,
        address tokenData_,
        address rolesContract,
        address[] initialWallets,
        uint256[] initialBalances)
        TokenLogic(token_, tokenData_, rolesContract) public
    {
        if (tokenData_ == address(0x0)) {
            uint256 totalSupply;
            require(initialBalances.length == initialWallets.length);
            for (uint256 i = 0; i < initialWallets.length; i++) {
                data.setBalances(initialWallets[i], initialBalances[i]);
                token.triggerTransfer(address(0x0), initialWallets[i], initialBalances[i]);
                totalSupply = Math.add(totalSupply, initialBalances[i]);
            }
            data.setSupply(totalSupply);
        }
    }

}


contract OpenFundToken is Token {
    constructor (string name_, string symbol_, address rolesContract) public Token(name_, symbol_, rolesContract) {
        // you shouldn't create logic here, because this contract would be the owner.
    }

}
