var bip39 = require('../')
var Buffer = require('safe-buffer').Buffer
var download = require('../util/wordlists').download
var WORDLISTS = {
  chinese_simplified: require('../wordlists/chinese_simplified.json'),
  chinese_traditional: require('../wordlists/chinese_traditional.json'),
  english: require('../wordlists/english.json'),
  french: require('../wordlists/french.json'),
  italian: require('../wordlists/italian.json'),
  spanish: require('../wordlists/spanish.json'),
  korean: require('../wordlists/korean.json'),
  custom: require('./wordlist.json')
}

var vectors = require('./vectors.json')
var test = require('tape')

function testVector (description, wordlist, password, v, i) {
  var ventropy = v[0]
  var vmnemonic = v[1]
  var vseedHex = v[2]

  test('for ' + description + '(' + i + '), ' + ventropy, function (t) {
    t.plan(5)

    t.equal(bip39.mnemonicToEntropy(vmnemonic, wordlist), ventropy, 'mnemonicToEntropy returns ' + ventropy.slice(0, 40) + '...')
    t.equal(bip39.mnemonicToSeedHex(vmnemonic, password), vseedHex, 'mnemonicToSeedHex returns ' + vseedHex.slice(0, 40) + '...')
    t.equal(bip39.entropyToMnemonic(ventropy, wordlist), vmnemonic, 'entropyToMnemonic returns ' + vmnemonic.slice(0, 40) + '...')

    function rng () { return Buffer.from(ventropy, 'hex') }
    t.equal(bip39.generateMnemonic(undefined, rng, wordlist), vmnemonic, 'generateMnemonic returns RNG entropy unmodified')
    t.equal(bip39.validateMnemonic(vmnemonic, wordlist), true, 'validateMnemonic returns true')
  })
}

vectors.english.forEach(function (v, i) { testVector('English', undefined, 'TREZOR', v, i) })
vectors.custom.forEach(function (v, i) { testVector('Custom', WORDLISTS.custom, undefined, v, i) })

test('invalid entropy', function (t) {
  t.plan(3)

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from('', 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for empty entropy')

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from('000000', 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for entropy that\'s not a multitude of 4 bytes')

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from(new Array(1028 + 1).join('00'), 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for entropy that is larger than 1024')
})

test('generateMnemonic can vary entropy length', function (t) {
  var words = bip39.generateMnemonic(160).split(' ')

  t.plan(1)
  t.equal(words.length, 15, 'can vary generated entropy bit length')
})

test('generateMnemonic requests the exact amount of data from an RNG', function (t) {
  t.plan(1)

  bip39.generateMnemonic(160, function (size) {
    t.equal(size, 160 / 8)
    return Buffer.allocUnsafe(size)
  })
})

test('validateMnemonic', function (t) {
  t.plan(5)

  t.equal(bip39.validateMnemonic('sleep kitten'), false, 'fails for a mnemonic that is too short')
  t.equal(bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten'), false, 'fails for a mnemonic that is too short')
  t.equal(bip39.validateMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about end grace oxygen maze bright face loan ticket trial leg cruel lizard bread worry reject journey perfect chef section caught neither install industry'), false, 'fails for a mnemonic that is too long')
  t.equal(bip39.validateMnemonic('turtle front uncle idea crush write shrug there lottery flower risky shell'), false, 'fails if mnemonic words are not in the word list')
  t.equal(bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'), false, 'fails for invalid checksum')
})

test('exposes standard wordlists', function (t) {
  t.plan(2)
  t.same(bip39.wordlists.EN, WORDLISTS.english)
  t.equal(bip39.wordlists.EN.length, 2048)
})

test('verify wordlists from https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md', function (t) {
  download().then(function (wordlists) {
    Object.keys(wordlists).forEach(function (name) {
      t.same(WORDLISTS[name], wordlists[name])
    })

    t.end()
  })
})
