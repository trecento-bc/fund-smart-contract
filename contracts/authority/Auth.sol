// Copyright (C) 2015, 2016, 2017  DappHub, LLC

// Licensed under the Apache License, Version 2.0 (the "License").
// You may not use this file except in compliance with the License.

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND (express or implied).

pragma solidity ^0.4.23;

import "./Owned.sol";


contract Authority {
    // the signature of a function is the result of keccak256("functionName(paramType1,paramtypeN)")
    function canCall(address src, address dst, bytes4 sig) public view returns (bool);
}


contract AuthEvents {
    event LogSetAuthority (address indexed authority);
    event LogSetOwner     (address indexed owner);
    event UnauthorizedAccess (address caller, bytes4 sig);
}


contract Auth is AuthEvents, Owned {
    Authority  public  authority;

    constructor() public {
        owner = msg.sender;
        emit LogSetOwner(msg.sender);
    }

    function setOwner(address owner_) public auth {
        owner = owner_;
        emit LogSetOwner(owner);
    }

    function setAuthority(Authority authority_) public auth {
        authority = authority_;
        emit LogSetAuthority(authority);
    }

    modifier auth {
        assert(isAuthorized(msg.sender, msg.sig));
        _;
    }

    function isAuthorized(address src, bytes4 sig) internal returns (bool) {
        if (src == address(this)
        || (src == owner && authority == Authority(0))
        || (authority != Authority(0) && authority.canCall(src, this, sig))) {
          return true;
        }
        emit UnauthorizedAccess(src, sig);
        return false;
    }
}
