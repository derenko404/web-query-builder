export { QUERY_OPERATOR_TO_FUNCTION } from './constants'
export type { FilterFunction, FilterFunctionCreator } from './constants'

export { QueryResult, SelectQueryResult } from './query-result'

export function pickFields<T extends Record<string, any>>(
  object: T,
  keys: (keyof T)[]
) {
  return keys.reduce((acc, key) => {
    if (key in object) {
      acc[key] = object[key]
    }
    return acc
  }, {} as T)
}

export function removeFields<T extends Record<string, any>>(
  object: T,
  keys: (keyof T)[]
): Omit<T, keyof T> {
  return Object.keys(object).reduce((acc, key) => {
    if (!keys.includes(key as keyof T)) {
      acc[key as keyof T] = object[key as keyof T]
    }
    return acc
  }, {} as T)
}
