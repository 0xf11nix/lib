import Web3 from 'web3'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { ChainTypes, swapper } from '@shapeshiftoss/types'
import { ZrxSwapper } from '..'
import { ZrxError } from '../..'
import { DEFAULT_SLIPPAGE } from './utils/constants'
import { buildQuoteTx } from '../zrx/buildQuoteTx/buildQuoteTx'
import { executeQuote } from '../zrx/executeQuote/executeQuote'
import { getZrxQuote } from './getQuote/getQuote'
import { FOX, WETH, BTC } from './utils/test-data/assets'
import { getUsdRate } from './utils/helpers/helpers'
import { getMinMax } from './getMinMax/getMinMax'

jest.mock('./utils/helpers/helpers')
jest.mock('../zrx/executeQuote/executeQuote', () => ({
  executeQuote: jest.fn()
}))

jest.mock('../zrx/buildQuoteTx/buildQuoteTx', () => ({
  buildQuoteTx: jest.fn()
}))

jest.mock('./getQuote/getQuote', () => ({
  getZrxQuote: jest.fn()
}))

jest.mock('./getMinMax/getMinMax', () => ({
  getMinMax: jest.fn()
}))

const setupQuote = () => {
  const sellAmount = '1000000000000000000'
  const sellAsset = FOX
  const buyAsset = WETH

  const quoteInput = {
    sellAsset,
    buyAsset,
    sellAmount,
    slippage: DEFAULT_SLIPPAGE
  }
  return { quoteInput, buyAsset, sellAsset }
}

describe('ZrxSwapper', () => {
  const input = <swapper.GetQuoteInput>{}
  const quote = <swapper.Quote>{}
  const wallet = <HDWallet>{}
  const web3 = <Web3>{}
  const adapterManager = <ChainAdapterManager>{}
  const zrxSwapperDeps = { web3, adapterManager }

  it('calls getZrxQuote on getQuote', async () => {
    const { quoteInput } = setupQuote()
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    await zrxSwapper.getQuote(quoteInput)
    expect(getZrxQuote).toHaveBeenCalled()
  })
  it('returns Zrx type', () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const type = zrxSwapper.getType()
    expect(type).toBe(swapper.Type.Zrx)
  })
  it('handles ZrxError message', () => {
    const message = 'test error'
    const error = new ZrxError(message)
    expect(error.message).toBe(`ZrxError:${message}`)
  })
  it('getAvailableAssets filters out all non-ethereum assets', () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const availableAssets = zrxSwapper.getAvailableAssets([BTC, FOX, WETH])
    expect(availableAssets).toStrictEqual([FOX, WETH])
  })
  it('canTradePair fails on non-eth chains', () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const canTradePair = zrxSwapper.canTradePair(BTC, WETH)
    expect(canTradePair).toBeFalsy()
  })
  it('canTradePair succeeds on eth chains', () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const canTradePair = zrxSwapper.canTradePair(FOX, WETH)
    expect(canTradePair).toBeTruthy()
  })
  it('calls buildQuoteTx on swapper.buildQuoteTx', async () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const args = { input, wallet }
    await zrxSwapper.buildQuoteTx(args)
    expect(buildQuoteTx).toHaveBeenCalled()
  })
  it('calls executeQuote on swapper.executeQuote', async () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const args = { quote, wallet }
    await zrxSwapper.executeQuote(args)
    expect(executeQuote).toHaveBeenCalled()
  })
  it('gets default pair', () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const pair = zrxSwapper.getDefaultPair()
    expect(pair).toHaveLength(2)
    pair.forEach((asset) => {
      expect(asset.chain).toBe(ChainTypes.Ethereum)
    })
  })
  it('calls getUsdRate on swapper.getUsdRate', async () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    await zrxSwapper.getUsdRate(FOX)
    expect(getUsdRate).toHaveBeenCalled()
  })
  it('calls getMinMax on swapper.getMinMax', async () => {
    const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
    const { quoteInput } = setupQuote()
    await zrxSwapper.getMinMax(quoteInput)
    expect(getMinMax).toHaveBeenCalled()
  })
})
