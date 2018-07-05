/*
 * "If you're still in doubt you're just hating"
 * - Rojikku
 */

'use strict';

process.title = 'knoxwallet';

process.on('unhandledRejection', (err, promise) => {
  throw err;
});

const assert = require('assert');
const consensus = require('bcoin/lib/protocol/consensus');

const FullNode = require('bcoin/lib/node/fullnode');
const walletdb = require('bcoin/lib/wallet/plugin');

const Proposal = require('bmultisig/lib/proposal');
const Cosigner = require('bmultisig/lib/cosigner');
const Multisig = require('bmultisig');

const MTX = require('bcoin/lib/primitives/mtx');
const Amount = require('bcoin/lib/btc/amount');

const HD = require('bcoin/lib/hd');
const MasterKey = require('bcoin/lib/wallet/masterkey');
const {Mnemonic} = HD;

/*
 * Multisig Constants
 */

const XPUB_PATH = 'm/44\'/0\'/0\'';
const xpub1 = getPubKey();
const xpub2 = getPubKey();

const OPTIONS1 = {
  m: 2,
  n: 2,
  id: 'tokensoft'
};

const OPTIONS2 = {
  m: 2,
  n: 2,
  id: 'amentum'
};

const PROPOSAL1 = {
  id: 1,
  name: 'amentum',
  m: 2,
  n: 2,
  author: 0
};

/*
 * Node Process for (Proof-of-Concept Purpose Only)
 */

const node = new FullNode({
  network: 'regtest',
  db: 'memory',
  prefix: '/home/rojikku/.bcoin',
  apiKey: 'tokensoft',
  nodes: '127.0.0.1',
  port: 48444,
  workers: true,
  env: true,
  logConsole: true,
  logLevel: 'debug',
  plugins: [walletdb]
});

const wdb = node.require('walletdb');

/*
 * Node Process
 * @const {node}
 * @returns {Promise}
 */

(async function open() {
  await node.open();
})().then(async function createAccouts() {
    const MULTISIG = Multisig.init(wdb);
    const MSDB = MULTISIG.msdb;
    await MULTISIG.open();
    await MULTISIG.http.open();

    consensus.COINBASE_MATURITY = 4;

    const cosigner1 = Cosigner.fromOptions({name: 'tokensoft'});
    const tokensoft = await MSDB.create(OPTIONS1, cosigner1, xpub1);

    const cosigner2 = Cosigner.fromOptions({name: 'amentum'});
    const amentum = await MSDB.create(OPTIONS2, cosigner2, xpub2);

    // Coordinate Order of these variables better.
    const joinKey = amentum.getJoinKey;
    await tokensoft.join(cosigner2, xpub2, joinKey);

    const account = await tokensoft.getAccount();
    const addr = account.receiveAddress();
    const recv = addr.toString();

  await node.miner.addAddress(recv);

  for (let i = 0; i < 5; i++) {
    const block = await node.miner.mineBlock();
    await node.chain.add(block);
  }

  const txoptions = {
    subtractFee: true,
    outputs: [{
      address: addr,
      value: Amount.fromBTC(10).toValue()
    }]
  };

  await tokensoft.createTX(txoptions);

  await tokensoft.createProposal('proposal', tokensoft.cosigners[0], txoptions);
  await tokensoft.getProposal('proposal');

  await tokensoft.getProposalMTX('proposal');


});

/*
 * Helpers
 */

function getPubKey() {
    return HD.PrivateKey.generate().derivePath(XPUB_PATH).toPublic();
}



