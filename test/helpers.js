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

// wraps web3 sync/callback function into a Promise
function web3AsynWrapper (web3Fun) {
  return function (arg) {
    return new Promise((resolve, reject) => {
      web3Fun(arg, (e, data) => e ? reject(e) : resolve(data))
    })
  }
}

exports.sendTransaction = web3AsynWrapper(web3.eth.sendTransaction)
exports.getBalance = web3AsynWrapper(web3.eth.getBalance)
exports.getTransaction = web3AsynWrapper(web3.eth.getTransaction)
exports.getTransactionReceipt = web3AsynWrapper(web3.eth.getTransactionReceipt)
