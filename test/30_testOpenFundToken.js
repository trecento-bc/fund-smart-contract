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

/* global web3 */

var OpenFundTokenLogic = artifacts.require('OpenFundTokenLogic')
var OpenFundToken = artifacts.require('OpenFundToken')
let helpers = require('./helpers.js')
let utils = require('./utils')

contract('OpenFundToken', function (accounts) {
  let token
  let logic
  let totalSupply = 1e26
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    token = await OpenFundToken.deployed()
    logic = await OpenFundTokenLogic.at(await token.logic())
  })

  it('grants roles to account 0', async () => {
    await utils.addRole('minter', token, accounts[0])
    await utils.addRole('userManager', logic, accounts[0])
    await utils.addRole('admin', logic, accounts[0])

    assert.ok(await token.senderHasRole('minter'))
    assert.ok(await logic.senderHasRole('admin'))
    assert.ok(await logic.senderHasRole('userManager'))
  })

  it('has a reference to OpenFundTokenLogic which has a reference back', () => {
    return token.logic()
      .then(l => assert.equal(l, logic.address))
      .then(() => logic.token())
      .then(t => assert.equal(t, token.address))
  })

  it('has accounts[0] as owner', () => {
    return token.owner()
      .then(owner => assert.equal(owner, accounts[0], 'accounts[0] is the owner'))
  })

  
})
