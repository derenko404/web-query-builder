import { faker } from '@faker-js/faker'

const getFakeUser = () => {
  const sex = faker.person.sexType()
  const firstName = faker.person.firstName(sex)
  const lastName = faker.person.lastName()
  const email = faker.internet.email({ firstName, lastName })
  const avatar = faker.image.avatar()
  const age = faker.number.int({
    min: 1,
    max: 99,
  })

  return {
    sex,
    firstName,
    lastName,
    email,
    avatar,
    age,
  }
}

export const createRandomRow = async (qb: any) => {
  const row = getFakeUser()

  await qb.from('users').insert(row).run()

  return {
    row,
  }
}

export const createRandomRows = async (qb: any, number = 10) => {
  const items = Array.from({ length: number })
  const promises: any[] = []

  for (const _ in items) {
    promises.push(async () => {
      const user = getFakeUser()
      await qb.from('users').insert(user).run()
      return user
    })
  }

  const rows = await Promise.all(promises.map((p) => p()))

  return {
    rows,
    count: promises.length,
  }
}

export const createRandomRowsWithPredefinedFields = async (
  qb: any,
  number = 10,
  fields: any[] = []
) => {
  const items = Array.from({ length: number })
  const promises: any[] = []

  items.forEach((_, i) => {
    promises.push(async () => {
      let user = getFakeUser()

      if (fields[i]) {
        user = {
          ...user,
          ...fields[i],
        }
      }

      await qb.from('users').insert(user).run()
      return user
    })
  })

  const rows = await Promise.all(promises.map((p) => p()))

  return {
    rows,
    count: promises.length,
  }
}
