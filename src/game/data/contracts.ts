import { CONTRACT_BALANCE } from './balance'
import type { Contract } from '../types'
import { text } from '../translations'

export const CONTRACTS: Contract[] = CONTRACT_BALANCE.map((contract) => ({
  ...contract,
  name: text.data.contracts[contract.id].name,
}))
