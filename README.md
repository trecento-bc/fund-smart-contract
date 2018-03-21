# Company Smart Contracts

The repository contains Smart Contracts code, tests and dev envrionment.

## License

The code and all related work is protected. Please refer to the LICENSE file for details.

## User Wallets

You can setup the wallet using one of the two popular clients: MyEtherWallet and MetaMask.

#### Localhost parameters

Please refer to **truffle.js** for more information. `chainID` must be the same as `networkID`.


### MyEtherWallet

1. Install [chrome extension](https://chrome.google.com/webstore/detail/myetherwallet/nlbmnnijcnlegkjjpcfjclmcfggfefdm).
   Or: download latest [release](https://github.com/kvhnuke/etherwallet/releases) and open the index.html in your browser.
1. In the top right corner - click on the Network menu and _Add Custom Node_
1. Use above parameters for network address. Select `Custom`. Tick `Supports EIP-155` and put `Chain id` as specified above.
1. Generate private key or use existing one and in the main panel, add new wallet to easily manage transfers.

### MetaMask

1. Install Firefox or Chrome extension
1. In the top left corner use localhost (if you are running geth locally) or Custom RPC and use parameters form above.


NOTE: Latest Metamask has [problem](https://github.com/MetaMask/metamask-extension/issues/2015). with with private chains. There is an error with [Nonce computation](https://github.com/MetaMask/metamask-extension/issues/1999).


## Development

Dependencies:

* make
* git
* node
* yarn / npm
* truffle

Run the following command to setup the environment

    make setup-dev

### installing truffle

We are using truffle4 because we have problem with proper compilation in truffle3.

1. clone https://github.com/trufflesuite/truffle.git
2. checkout to `develop` branch
3. link `build/cli.bundled.js` in your bin.

```
cd <my projects>
git clone https://github.com/trufflesuite/truffle.git
cd truffle
git checkout develop
npm install
cd build
chmod a+x cli.bundled.js
cd ~/bin
ln -s ~/devchain/truffle/build/cli.bundled.js truffle4
```

### process

While development lint your code. If you editor doesn't support the solium linter then run:

    make watch-linter

Or if you want to lint only before commit:

    make lint

Make sure that you commit only tested and linted code:

    make lint test


## Code verification

### Etherscan

We use etherscan to verify the contracts on the mainnet and testnet.

**Note:** There is an [issue](https://github.com/trufflesuite/truffle/issues/456) with contract deployed using truffle. You have to use [verifyContract 2](https://etherscan.io/verifyContract2) instead of v1!

## Verification

+ http://securify.ch/
