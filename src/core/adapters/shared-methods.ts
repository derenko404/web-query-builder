import { Options } from '../query-options'
import { QUERY_OPERATOR_TO_FUNCTION } from '../utils'

export class SharedAdaptersMethods {
  protected createFilterFunctions(where: Options['where'] = []) {
    return where.map((w) =>
      QUERY_OPERATOR_TO_FUNCTION[w.operator](w.field, w.value)
    )
  }

  protected orderBy(rows: any[], field: string, order: 'ASC' | 'DESC' = 'ASC') {
    rows.sort((a: any, b: any) => {
      if (order === 'ASC') {
        //@ts-ignore
        return a[field] - b[field]
      } else {
        //@ts-ignore
        return b[field] - a[field]
      }
    })
  }

  protected limit(rows: any[], limit: number) {
    return rows.splice(0, limit)
  }
}
