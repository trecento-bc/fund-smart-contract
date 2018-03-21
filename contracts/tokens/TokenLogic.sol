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

pragma solidity ^0.4.17;

import "../Math.sol";
import "../authority/Roles.sol";
import "./Token.sol";
import "./TokenData.sol";
import "./ERC223_receiving_contract.sol";

interface TokenLogicI {
    // we have slightly different interface then ERC20, because
    function totalSupply() public view returns (uint256 supply);
    function balanceOf( address who ) public view returns (uint256 value);
    function allowance( address owner, address spender ) public view returns (uint256 _allowance);
    function transferFrom( address from, address to, uint256 value) public returns (bool ok);
    // ERC20 assumes that msg.sender is the owner, but because logic contract is
    // behind a proxy we need to add the owner parameter.
    function transfer( address owner, address to, uint256 value) public returns (bool ok);
    function approve( address owner, address spender, uint256 value ) public returns (bool ok);

    function setToken(address token_) public;
    function mintFor(address dest, uint256 wad) public;
    function burn(address src, uint256 wad) public;
}


contract TokenLogicEvents {
    event WhiteListAddition(bytes32 listName);
    event AdditionToWhiteList(bytes32 listName, address guy);
    event WhiteListRemoval(bytes32 listName);
    event RemovalFromWhiteList(bytes32 listName, address guy);
}


contract TokenLogic is TokenLogicEvents, TokenLogicI, SecuredWithRoles {

    TokenData public data;
    Token public token;     // facade: Token.sol:Token

    /* White lists are used to restrict who can transact with whom.
     * Since we can't iterate over the mapping we need to store the keys separaterly in the
     *   listNames
     */
    bytes32[] public listNames;
    mapping (address => mapping (bytes32 => bool)) public whiteLists;
    // by default there is no need for white listing addresses, anyone can transact freely
    bool public freeTransfer = true;

    function TokenLogic(
        address token_,
        address tokenData_,
        address rolesContract) public SecuredWithRoles("TokenLogic", rolesContract)
    {
        require(token_ != address(0x0));
        require(rolesContract != address(0x0));

        token = Token(token_);
        if (tokenData_ == address(0x0)) {
            data = new TokenData(this, msg.sender);
        } else {
            data = TokenData(tokenData_);
        }
    }

    modifier tokenOnly {
        assert(msg.sender == address(token));
        _;
    }

    /* check that freeTransfer is true or that the owner is involved or both sender and recipient are in the same whitelist*/
    modifier canTransfer(address src, address dst) {
        require(freeTransfer || src == owner || dst == owner || sameWhiteList(src, dst));
        _;
    }

    function listNamesLen() public view returns (uint256) {
        return listNames.length;
    }

    function listExists(bytes32 listName) public view returns (bool) {
        var (, ok) = indexOf(listName);
        return ok;
    }

    function indexOf(bytes32 listName) public view returns (uint8, bool) {
        for (uint8 i = 0; i < listNames.length; i++) {
            if (listNames[i] == listName) {
                return (i, true);
            }
        }
        return (0, false);
    }

    function replaceLogic(address newLogic) public onlyOwner {
        token.setLogic(TokenLogicI(newLogic));
        data.setTokenLogic(newLogic);
        selfdestruct(owner);
    }

    /* creating a removeWhiteList would be too onerous. Therefore it does not exist*/
    function addWhiteList(bytes32 listName) public onlyRole("admin") {
        require(! listExists(listName));
        require(listNames.length < 256);
        listNames.push(listName);
        WhiteListAddition(listName);
    }

    function removeWhiteList(bytes32 listName) public onlyRole("admin") {
        var (i, ok) = indexOf(listName);
        require(ok);
        if (i < listNames.length - 1) {
            listNames[i] = listNames[listNames.length - 1];
        }
        delete listNames[listNames.length - 1];
        --listNames.length;
        WhiteListRemoval(listName);
    }

    function addToWhiteList(bytes32 listName, address guy) public onlyRole("userManager") {
        require(listExists(listName));

        whiteLists[guy][listName] = true;
        AdditionToWhiteList(listName, guy);
    }

    function removeFromWhiteList(bytes32 listName, address guy) public onlyRole("userManager") {
        require(listExists(listName));

        whiteLists[guy][listName] = false;
        RemovalFromWhiteList(listName, guy);
    }

    function setFreeTransfer(bool isFree) public onlyOwner {
        freeTransfer = isFree;
    }

    function setToken(address token_) public onlyOwner {
        token = Token(token_);
    }

    function totalSupply() public view returns (uint256) {
        return data.supply();
    }

    function balanceOf(address src) public view returns (uint256) {
        return data.balances(src);
    }

    function allowance(address src, address spender) public view returns (uint256) {
        return data.approvals(src, spender);
    }

    function transfer(address src, address dst, uint wad) public tokenOnly canTransfer(src, dst)  returns (bool) {
        data.setBalances(src, Math.sub(data.balances(src), wad));
        data.setBalances(dst, Math.add(data.balances(dst), wad));
        return true;
    }

    function transferFrom(address src, address dst, uint256 wad) public tokenOnly canTransfer(src, dst)  returns (bool) {
        // balance and approval check is not needed because sub(a, b) will throw if a<b
        data.setApprovals(src, dst, Math.sub(data.approvals(src, dst), wad));
        data.setBalances(src, Math.sub(data.balances(src), wad));
        data.setBalances(dst, Math.add(data.balances(dst), wad));

        return true;
    }

    function approve(address src, address dst, uint256 wad) public tokenOnly returns (bool) {
        data.setApprovals(src, dst, wad);
        return true;
    }

    function mintFor(address dst, uint256 wad) public tokenOnly {
        data.setBalances(dst, Math.add(data.balances(dst), wad));
        data.setSupply(Math.add(data.supply(), wad));
    }

    function burn(address src, uint256 wad) public tokenOnly {
        data.setBalances(src, Math.sub(data.balances(src), wad));
        data.setSupply(Math.sub(data.supply(), wad));
    }

    // internal functions //

    function sameWhiteList(address src, address dst) internal view returns(bool) {
        for (uint8 i = 0; i < listNames.length; i++) {
            bytes32 listName = listNames[i];
            if (whiteLists[src][listName] && whiteLists[dst][listName]) {
                return true;
            }
        }
        return false;
    }
}
