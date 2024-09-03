import * as v from 'valibot'

type Valibot = typeof v

export type InferSchemaType<
  Tables extends Record<string, v.ObjectSchema<any, any>>,
> = {
  [K in keyof Tables]: v.InferOutput<Tables[K]>
}

export class Schema<T extends Record<string, v.ObjectSchema<any, any>>> {
  // @ts-ignore
  public validator: T

  createTables<R extends Record<string, v.ObjectSchema<any, any>>>(
    callback: (v: Valibot) => R
  ): Schema<R> {
    const compiledSchema = callback(v)

    this.validator = compiledSchema as unknown as T

    return this as any
  }

  validate<K extends keyof T>(key: K, input: unknown) {
    const { success, issues } = v.safeParse(this.getValidatorFor(key), input)

    return {
      isValid: success,
      issues,
    }
  }

  private getValidatorFor<K extends keyof T>(key: K) {
    return this.validator[key]
  }
}
