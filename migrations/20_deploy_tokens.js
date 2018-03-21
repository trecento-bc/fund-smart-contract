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

let utils = require('.//utils')

var TokenLogic = artifacts.require('TokenLogic')
var TecentoTokenLogic = artifacts.require('TecentoTokenLogic')
var TRC = artifacts.require('TecentoToken')
var TEX = artifacts.require('ExchangeToken')
var Roles = artifacts.require('Roles')


module.exports = function (deployer, network) {
  // logic has to be deployed separaterly because Token shouldn't be the owner of the logic

  var trc,tex
  const accounts = web3.eth.accounts
  const roles = Roles.at(Roles.address)

  
  function deployExchangeToken () {
    return deployer.deploy(TEX, 'TEX', 'TEX', Roles.address)
      .then(() => TEX.deployed())
      .then(b => {
        tex = b
        return deployer.deploy(TokenLogic, tex.address, 0, Roles.address)
      })
      .then(() => tex.setLogic(TokenLogic.address))
      .then(() => utils.setRole(tex, roles, 'admin'))
      .then(() => utils.setRole(tex, roles, 'minter'))
  }

  function deployTRC () {
    return deployer.deploy(TRC, 'TRC', 'TRC', Roles.address)
      .then(() => TRC.deployed())
      .then(s => {
        trc = s
        return deployer.deploy(
          TecentoTokenLogic, trc.address, 0, Roles.address,
          [accounts[0], accounts[12], accounts[13], accounts[14], accounts[15]],
          [1e25, 1e25, 2e25, 3e25, 3e25])
      })
      .then(() => trc.setLogic(TecentoTokenLogic.address))
      .then(() => utils.setRole(trc, roles, 'admin'))
  }

  return deployExchangeToken()
  .then(() => deployTRC())
}
