// Copyright (C) 2017  DappHub, LLC

// Licensed under the Apache License, Version 2.0 (the "License").
// You may not use this file except in compliance with the License.

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND (express or implied).

pragma solidity ^0.4.23;

import "./Owned.sol";


contract Stoppable is Owned {

    bool public stopped;

    modifier stoppable {
        assert (!stopped);
        _;
    }

    function emergencyStop() public onlyOwner  {
        stopped = true;
    }

    function disableStopping() public onlyOwner  {
        stopped = false;
    }
}
