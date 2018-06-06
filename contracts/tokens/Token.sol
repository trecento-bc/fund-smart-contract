// Copyright (c) 2018 Company Inc.
// Copyright (C) 2015, 2016, 2017  DappHub, LLC
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

import "../authority/Roles.sol";
import "./TokenLogic.sol";


interface TokenI {
    function totalSupply() external view returns (uint256 supply);
    function balanceOf( address who ) external  view returns (uint256 value);
    function allowance( address owner, address spender ) external view returns (uint256 _allowance);
    function burn( uint256 wad ) external;
    function triggerTransfer(address src, address dst, uint256 wad) external;
    function transfer( address to, uint256 value) external returns (bool ok);
    function transferFrom( address from, address to, uint256 value) external returns (bool ok);
    function approve( address spender, uint256 value ) external returns (bool ok);

    function mintFor(address recipient, uint256 wad) external;
}


contract TokenEvents {
    event LogBurn(address indexed src, uint256 wad);
    event LogMint(address indexed src, uint256 wad);
    event LogLogicReplaced(address newLogic);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


contract Token is TokenI, SecuredWithRoles, TokenEvents {
    string public symbol;
    string public name; // Optional token name
    uint8 public decimals = 18; // standard token precision. override to customize
    TokenLogicI public logic;

    constructor (string name_, string symbol_, address rolesContract) public SecuredWithRoles(name_, rolesContract) {
        // you can't create logic here, because this contract would be the owner.
        name = name_;
        symbol = symbol_;
    }

    modifier logicOnly {
        require(address(logic) == address(0x0) || address(logic) == msg.sender);
        _;
    }

    function totalSupply() public view returns (uint256) {
        return logic.totalSupply();
    }

    function balanceOf( address who ) public view returns (uint256 value) {
        return logic.balanceOf(who);
    }

    function allowance(address owner, address spender ) public view returns (uint256 _allowance) {
        return logic.allowance(owner, spender);
    }

    function triggerTransfer(address src, address dst, uint256 wad) public logicOnly {
        emit Transfer(src, dst, wad);
    }

    function setLogic(address logic_) public logicOnly {
        assert(logic_ != address(0));
        logic = TokenLogicI(logic_);
        emit LogLogicReplaced(logic);
    }

    /**
     * @dev Transfer the specified amount of tokens to the specified address.
     *      Invokes the `tokenFallback` function if the recipient is a contract.
     *      The token transfer fails if the recipient is a contract
     *      but does not implement the `tokenFallback` function
     *      or the fallback function to receive funds.
     */
    function transfer(address dst, uint256 wad) public stoppable returns (bool) {
        bool retVal = logic.transfer(msg.sender, dst, wad);
        if (retVal) {
            uint codeLength;
            assembly {
                // Retrieve the size of the code on target address, this needs assembly .
                codeLength := extcodesize(dst)
            }
            if (codeLength>0) {
                ERC223ReceivingContract receiver = ERC223ReceivingContract(dst);
                bytes memory empty;
                receiver.tokenFallback(msg.sender, wad, empty);
            }

            emit Transfer(msg.sender, dst, wad);
        }
        return retVal;
    }

    function transferFrom(address src, address dst, uint256 wad) public stoppable returns (bool) {
        bool retVal = logic.transferFrom(src, dst, wad);
        if (retVal) {
            uint codeLength;
            assembly {
                // Retrieve the size of the code on target address, this needs assembly .
                codeLength := extcodesize(dst)
            }
            if (codeLength>0) {
                ERC223ReceivingContract receiver = ERC223ReceivingContract(dst);
                bytes memory empty;
                receiver.tokenFallback(src, wad, empty);
            }

            emit Transfer(src, dst, wad);
        }
        return retVal;
    }

    function approve(address guy, uint256 wad) public stoppable returns (bool) {
        bool ok = logic.approve(msg.sender, guy, wad);
        if (ok)
            emit Approval(msg.sender, guy, wad);
        return ok;
    }

    function pull(address src, uint256 wad) public stoppable returns (bool) {
        return transferFrom(src, msg.sender, wad);
    }

    function mintFor(address recipient, uint256 wad) public stoppable onlyRole("minter") {
        logic.mintFor(recipient, wad);
        emit LogMint(recipient, wad);
        emit Transfer(address(0x0), recipient, wad);
    }

    function burn(uint256 wad) public stoppable {
        logic.burn(msg.sender, wad);
        emit LogBurn(msg.sender, wad);
    }

    function setName(string name_) public roleOrOwner("admin") {
        name = name_;
    }
}
