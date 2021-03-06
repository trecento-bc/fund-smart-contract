// Copyright (c) 2017 Company Inc.
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

/* global web3 */

let utils = require('./utils')

var OpenFundTokenLogic = artifacts.require('OpenFundTokenLogic')
var TRC = artifacts.require('OpenFundToken')
var Roles = artifacts.require('Roles')


module.exports = function (deployer, network) {
  // logic has to be deployed separaterly because Token shouldn't be the owner of the logic

  const accounts = web3.eth.accounts
  const roles = Roles.at(Roles.address)

  
  
  function deployTRC () {
     deployer.deploy(TRC, 'TRC', 'TRC', Roles.address).then(function () {
    console.log("deployment log OpenFundToken address is", TRC.address);
    return TRC.address;
  	}).then(() => TRC.deployed())
      .then(s => {
        trc = s
        return deployer.deploy(
          OpenFundTokenLogic, trc.address, 0, Roles.address,
          [accounts[0], accounts[12], accounts[13], accounts[14], accounts[15]],
          [0, 0, 0, 0, 0])
      })
      .then(() => trc.setLogic(OpenFundTokenLogic.address))
      .then(() => utils.setRole(trc, roles, 'admin'))
      .then(() => utils.setRole(trc, roles, 'minter'))
      .then(() => trc.contractHash())
      .then(contractHash => roles.grantUserRole(contractHash, 'minter', accounts[0]))
  }

  return deployTRC()
  
}
