export class QueryResult {
  constructor(
    public error: Error | null = null,
    public count: number = 0
  ) {
    this.error = error
    this.count = count
  }
}

export class SelectQueryResult<Data> extends QueryResult {
  constructor(public data: Data[] = [] as any[]) {
    super()
    this.data = data
  }
}
