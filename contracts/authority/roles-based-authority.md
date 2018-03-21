# Roles in the Company contracts

Every function in the Contracts can be constrained with a role by
inheriting the `SecuredWithRoles` constract.

## Modifiers

in order to restrict access to a function there are 3 modifiers

* onlyOwner - only the owner can execute a function
* onlyRole - only authorize members of a particular role to execute a function
* roleOrOwner - both the owner of the contract and members of a role have access

### Examples

these examples illustrate the usage of each modifier.

#### OnlyOwner



#### OnlyRole


#### RoleOrOwner

all other functions are either unrestricted or executable by a role or the owner.

## Roles


### Roles per contract

The defined roles in the contracts are:

* Roles: admin, restarter, stopper
* Token: admin, minter
* TokenLogic: admin, userManager

### Roles per function

* Owned.setOwner(address owner_) onlyOwner
* Roles.emergencyStop() roleOrOwner("stopper")
* Roles.restart() roleOrOwner("restarter")
* Roles.setRolesContract(address roles_) onlyOwner
* Roles.addContractRole(bytes32 ctrct, string roleName) roleOrOwner("admin")
* Roles.removeContractRole(bytes32 ctrct, string roleName) roleOrOwner("admin")
* Roles.grantUserRole(bytes32 ctrct, string roleName, address user) roleOrOwner("admin")
* Roles.revokeUserRole(bytes32 ctrct, string roleName, address user) roleOrOwner("admin")
* Token.setLogic(TokenLogicI logic_) onlyOwner returns(bool)
* Token.mintFor(address recipient, uint128 wad) stoppable onlyRole("minter")
* Token.setName(string name_) roleOrOwner("admin")
* TokenData.setTokenLogic(address logic_) onlyOwner
* TokenLogic.addWhiteList(bytes32 listName) onlyRole("admin")
* TokenLogic.addToWhiteList(bytes32 listName, address guy) onlyRole("userManager")
* TokenLogic.removeFromWhiteList(bytes32 listName, address guy) onlyRole("userManager")
* TokenLogic.setFreeTransfer(bool isFree) onlyOwner
* TokenLogic.setToken(address token_) onlyOwner
