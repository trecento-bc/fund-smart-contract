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

var Token = artifacts.require('Token')
var TokenLogic = artifacts.require('TokenLogic')
var Roles = artifacts.require('Roles')
var utils = require('./utils')

module.exports = function (deployer, network) {
  if (network === 'mainnet') return

  const accounts = web3.eth.accounts
  const roles = Roles.at(Roles.address)

  var token, logic
  deployer.deploy(Token, 'TestCoin', 'TTC', Roles.address)
    .then(() => deployer.new(TokenLogic, Token.address, 0, Roles.address))
    .then(l => {
      logic = l
      return Token.deployed()
    })
    .then(t => {
      token = t
      return t.setLogic(logic.address)
    })
    .then(() => utils.setRole(token, roles, 'minter'))
    .then(() => token.contractHash())
    .then(contractHash => roles.grantUserRole(contractHash, 'minter', accounts[0]))
    .then(() => token.mintFor(accounts[0], 1e26))
}
