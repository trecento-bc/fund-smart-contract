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

import "./tokens/Token.sol";



contract ExchangeToken is Token {
    // you can't create logic here, because this contract would be the owner.
    function ExchangeToken(string name_, string symbol_, address rolesContract) Token(name_, symbol_, rolesContract) public {}
}
