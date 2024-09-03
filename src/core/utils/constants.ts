import { QueryOperator } from '../types'

export type FilterFunction = (row: any) => boolean
export type FilterFunctionCreator = (
  field: string,
  value: any
) => FilterFunction

export const QUERY_OPERATOR_TO_FUNCTION: Record<
  QueryOperator,
  FilterFunctionCreator
> = {
  '=': (field, value) => (row) => {
    if (typeof value === 'string' && value.includes('*')) {
      const partsToSearch = value.split('*').filter(Boolean)

      return partsToSearch.every((part) => row[field].includes(part))
    }

    return row[field] === value
  },
  '>=': (field, value) => (row) => {
    return row[field] >= value
  },
  '<=': (field, value) => (row) => {
    return row[field] <= value
  },
  '>': (field, value) => (row) => {
    return row[field] > value
  },
  '<': (field, value) => (row) => {
    return row[field] < value
  },
}
