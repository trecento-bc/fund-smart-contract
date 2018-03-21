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

var TokenLogic = artifacts.require('TokenLogic')
var Token = artifacts.require('Token')
let helpers = require('./helpers.js')
let utils = require('./utils')

contract('Token', function (accounts) {
  let token
  let logic
  let totalSupply = 1e26
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    token = await Token.deployed()
    logic = await TokenLogic.at(await token.logic())
  })

  it('grants roles to account 0', async () => {
    await utils.addRole('minter', token, accounts[0])
    await utils.addRole('userManager', logic, accounts[0])
    await utils.addRole('admin', logic, accounts[0])

    assert.ok(await token.senderHasRole('minter'))
    assert.ok(await logic.senderHasRole('admin'))
    assert.ok(await logic.senderHasRole('userManager'))
  })

  it('has a reference to TokenLogic which has a reference back', () => {
    return token.logic()
      .then(l => assert.equal(l, logic.address))
      .then(() => logic.token())
      .then(t => assert.equal(t, token.address))
  })

  it('has accounts[0] as owner', () => {
    return token.owner()
      .then(owner => assert.equal(owner, accounts[0], 'accounts[0] is the owner'))
  })

  it('has been created with a supply of ' + totalSupply, () => {
    return token.totalSupply()
      .then(supply => assert.equal(supply.toNumber(), totalSupply,
        'wrong initial token state'))
  })

  it('doesn\'t accept payment of 1 ETH and doesn\'t change total supply', () => {
    let a1balance = 0
    return token.balanceOf(accounts[1])
      .then((b) => {
        a1balance = b
        return helpers.sendTransaction({from: accounts[1], to: token.address, value: b})
      })
      .then(() => assert.fail('Previous statement should fails'))
      .catch(err => assert(err.message.indexOf('transaction: revert') >= 0,
                           err.msg))
      .then(() => Promise.all([
        token.balanceOf(accounts[1]),
        token.totalSupply(),
        helpers.getBalance(token.address)]))
      .then(res => {
        assert.equal(res[0].toNumber(), a1balance, 'sender token balance doesn\'t change')
        assert.equal(res[1].toNumber(), totalSupply, 'token total supply doesn\'t change')
        assert.equal(res[2].toNumber(), 0, '0 ETH balance in the contract')
      })
  })

  it('owner can mint tokens', () => {
    return token.totalSupply()
      .then(ts => token.mintFor(accounts[0], ts))
      .then(tx => {
        fs.appendFile('gas.csv', 'token;mint;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([token.balanceOf(accounts[0]), token.totalSupply()])
      })
      .then(res => {
        assert.equal(res[0].toNumber(), totalSupply * 2, '2e26 tokens were minted')
        assert.equal(res[1].toNumber(), totalSupply * 2, '2e26 tokens are owned by owner')
        totalSupply = res[1].toNumber()
      })
  })

  it('transfers tokens', () => {
    return token.transfer(accounts[1], 1e25, {from: accounts[0]})
      .then(tx => {
        fs.appendFile('gas.csv', 'token;transfer;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          token.balanceOf(accounts[0]),
          token.balanceOf(accounts[1]),
          token.totalSupply()])
      })
      .then(res => {
        assert.equal(res[0].toNumber(), 19e25, '1e25 tokens were transfered 19e25 remaining')
        assert.equal(res[1].toNumber(), 1e25, '1e17 tokens were received')
        assert.equal(res[2].toNumber(), totalSupply, 'total supply didn\'t change')
      })
  })

  it('makes transfers impossible for non white listed addresses when owner is not involved and freeTransfer == false', () => {
    return logic.setFreeTransfer(false)
      .then(tx => logic.freeTransfer())
      .then(ft => {
        assert.isNotOk(ft)
        return token.transfer(accounts[3], 5e24, {from: accounts[1]})
      })
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })

  it('allows transfers from owner', () => {
    return token.transfer(accounts[2], 1e25, {from: accounts[0]})
      .then(tx => {
        fs.appendFile('gas.csv', 'token;tansfer;' + tx.receipt.gasUsed + '\n', fscb)
        return token.balanceOf(accounts[2])
      })
      .then(bal => assert.equal(bal.toNumber(), 1e25, 'accounts[1] balance has been updated'))
  })

  it('allows transfer between white list buddies', async () => {
    let tx
    tx = await logic.addWhiteList(web3.fromAscii('listOne'))
    fs.appendFile('gas.csv', 'TokenLogic;addWhiteList;' + tx.receipt.gasUsed + '\n', fscb)
    assert.equal(web3.toAscii(await logic.listNames(0)).substring(0, 7), 'listOne')

    tx = await logic.addToWhiteList('listOne', accounts[2])
    fs.appendFile('gas.csv', 'TokenLogic;addToWhiteList;' + tx.receipt.gasUsed + '\n', fscb)

    tx = await logic.addToWhiteList('listOne', accounts[3])
    fs.appendFile('gas.csv', 'TokenLogic;addToWhiteList;' + tx.receipt.gasUsed + '\n', fscb)

    assert.ok(await logic.whiteLists(accounts[2], 'listOne'), 'accounts[2] is white listed')
    assert.ok(await logic.whiteLists(accounts[3], 'listOne'), 'accounts[3] is white listed')

    tx = await token.transfer(accounts[3], 5e24, {from: accounts[2]})
    fs.appendFile('gas.csv', 'Token;tansfer;' + tx.receipt.gasUsed + '\n', fscb)

    assert.equal((await token.balanceOf(accounts[2])).toNumber(), 5e24, '5e24 tokens were transfered 5e24 remaining')
    assert.equal((await token.balanceOf(accounts[3])).toNumber(), 5e24, '5e24 tokens were received')
  })

  it('disallows transfer to non white listed accounts', () => {
    return token.transfer(accounts[4], 1e24, {from: accounts[3]})
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })

  it('disallows transfer from non white listed accounts', () => {
    return token.transfer(accounts[3], 1e24, {from: accounts[4]})
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })

  it('allows transfer between white list buddies with two lists', () => {
    return logic.addWhiteList('listTwo')
      .then(tx => {
        fs.appendFile('gas.csv', 'logic;addWhiteList;' + tx.receipt.gasUsed + '\n', fscb)
        token.transfer(accounts[4], 1e25, {from: accounts[0]})
        return logic.listNames(1)
      })
      .then(listName => {
        assert.equal(web3._extend.utils.toAscii(listName).substring(0, 7), 'listTwo')
        return Promise.all([
          logic.addToWhiteList('listTwo', accounts[4]),
          logic.addToWhiteList('listTwo', accounts[5])
        ])
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'logic;addToWhiteList;' + tx[0].receipt.gasUsed + '\n', fscb)
        fs.appendFile('gas.csv', 'logic;addToWhiteList;' + tx[1].receipt.gasUsed + '\n', fscb)
        return Promise.all([
          logic.whiteLists(accounts[4], 'listTwo'),
          logic.whiteLists(accounts[5], 'listTwo')
        ])
      })
      .then(res => {
        assert.ok(res[0], 'accounts[4] is white listed')
        assert.ok(res[1], 'accounts[5] is white listed')
        return token.transfer(accounts[5], 5e24, {from: accounts[4]})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'token;tansfer;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          token.balanceOf(accounts[4]),
          token.balanceOf(accounts[5])])
      })
      .then(res => {
        assert.equal(res[0].toNumber(), 5e24, '5e24 tokens were transfered 5e24 remaining')
        assert.equal(res[1].toNumber(), 5e24, '5e24 tokens were received')
      })
  })

  it('disallows transfer between different white listed accounts', () => {
    return token.transfer(accounts[3], 1e24, {from: accounts[4]})
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })

  it('disallows transfer between accounts which have been unwhite listed', () => {
    return logic.removeFromWhiteList('listTwo', accounts[4])
      .then(() => token.transfer(accounts[4], 1e24, {from: accounts[5]}))
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })

  it('throws when trying to add a member to a non existent list', () => {
    return logic.addToWhiteList('listThree', accounts[4])
      .then(() => assert.fail())
      .catch(error => assert(error.message.indexOf('transaction: revert') >= 0))
  })
})
