# Web Query Builder

`web-query-builder` is a lightweight JavaScript library designed for browser-based data querying across different storage types, including

-   Local Storage
-   IndexedDB,
-   Session Storage

It provides a simple and unified API for building complex queries using a fluent, SQL-like syntax, making it easier to retrieve and manipulate data stored in the browser.

With `web-query-builder`, you can effortlessly perform operations such as

-   filtering
-   sorting
-   selecting data

all within the browser environment. Whether you're working with Local Storage for quick data access, IndexedDB for handling larger datasets, or Session Storage for temporary data, `web-query-builder` simplifies the process with a consistent interface.

### Key Features

-   Unified API for querying data across `LocalStorage`, `IndexedDB`, and `SessionStorage`.
-   SQL-like Syntax for constructing complex queries with a simple, fluent interface.
-   Asynchronous Operations to handle data efficiently without blocking the main thread.
-   Flexibility to work with various storage types depending on the needs of your web application.

## Installation

### npm

```
npm install --save web-query-builder
```

# Table of Contents

-   [Introduction](#web-query-builder)

    -   [Overview of web-query-builder](#overview-of-web-query-builder)
    -   [Key Features](#key-features)
    -   [Installation](#installation)

-   [Schema](#schema)

    -   [Defining a Schema](#defining-a-schema)
    -   [Supported Data Types](#supported-data-types)
    -   [Schema Validation](#schema-validation)
    -   [Example: Creating a Schema](#example-creating-a-schema)

-   [Adapters](#adapters)

    -   [Overview of Storage Adapters](#overview-of-storage-adapters)

    -   [LocalStorageAdapter](#localstorageadapter)

        -   [Introduction to LocalStorageAdapter](#introduction-to-localstorageadapter)
        -   [Setting Up LocalStorageAdapter](#setting-up-localstorageadapter)
        -   [Basic Operations (Create, Read, Update, Delete)](#basic-operations-create-read-update-delete)
        -   [Data Persistence and Limitations](#data-persistence-and-limitations)
        -   [Example: Using LocalStorageAdapter](#example-using-localstorageadapter)

    -   [IndexedDbAdapter](#indexdbadapter)
        -   [Introduction to IndexedDbAdapter](#introduction-to-indexeddbadapter)
        -   [Setting Up IndexedDbAdapter](#setting-up-indexeddbadapter)
        -   [Basic Operations (Create, Read, Update, Delete)](#basic-operations-create-read-update-delete)
        -   [IndexedDB Features and Limitations](#indexeddb-features-and-limitations)
        -   [Example: Using IndexedDbAdapter](#example-using-indexeddbadapter)

-   [QueryBuilder](#querybuilder)

    -   [Overview of QueryBuilder](#overview-of-querybuilder)
    -   [Building Queries with QueryBuilder](#building-queries-with-querybuilder)
    -   [Supported Query Operations](#supported-query-operations)
    -   [Chaining Queries](#chaining-queries)
    -   [Example: Complex Queries with QueryBuilder](#example-complex-queries-with-querybuilder)
    -   [Performance Considerations](#performance-considerations)

-   [API Reference](#api-reference)
    -   [Detailed API Documentation for Each Component](#detailed-api-documentation-for-each-component)

## Schema

The **Schema** in `web-query-builder` is used to define tables and validate data structures, ensuring that all data stored in the browser's storage conforms to the specified format. The schema leverages **vallibot** under the hood, a powerful data validation library, to provide robust data validation mechanisms.

### Key Points

-   **Defining a Schema**: A schema is defined using the `Schema` class, which allows you to create tables and specify the structure and data types of each table's fields.
-   **Data Validation**: Each schema validates the data being stored, ensuring type safety and consistency across different storage types (LocalStorage, IndexedDB, Session Storage).
-   **Using vallibot**: The schema uses `vallibot` to define and validate data types, providing an easy-to-use API for specifying complex data structures.
-   **Example: Creating a Schema**:
    ```javascript
    const schema = new Schema().createTables((v) => ({
        users: v.object({
            id: v.number(),
            name: v.string(),
        }),
        emails: v.object({
            userId: v.number(),
            content: v.string(),
        }),
    }))
    ```
    This example demonstrates how to create a schema with two tables: `users` and `emails`. Each table is defined as an object with specific fields (`id`, `name`, `userId`, `content`), and their respective data types (`number`, `string`).

### Additional Details

-   **Supported Data Types**: The schema supports various data types such as `number`, `string`, `boolean`, etc., using vallibot's validation functions.
-   **Schema Validation**: Automatic validation of data against the defined schema rules when performing operations like insert, update, or query.
-   **Updating Schemas**: Schemas can be updated to accommodate new fields or changes in the data structure without breaking existing data.

## Adapters

Adapters in `web-query-builder` provide a unified way to interact with various browser storage types, such as LocalStorage and IndexedDB. Each adapter implements the `StorageAdapter` interface, ensuring consistent methods for connecting, retrieving, storing, updating, and deleting data across different storage options.

### Overview of Storage Adapters

The `StorageAdapter` interface defines a standard structure that all storage adapters must implement. This ensures a consistent API for working with different storage types in the browser.

```typescript
export interface StorageAdapter {
    connect(): Promise<this>
    get(key: string, qo: Options): Promise<GetStorageResult>
    set(key: string, value: any): Promise<SetStorageResult>
    update(key: string, value: any, qo: Options): Promise<UpdateStorageResult>
    delete(key: string, qo: Options): Promise<DeleteStorageResult>
}
```

### LocalStorageAdapter

#### Introduction to LocalStorageAdapter

The **LocalStorageAdapter** is an implementation of the `StorageAdapter` interface that interacts with the browser's LocalStorage. This adapter is suitable for simple, lightweight storage needs, such as saving user settings or session data.

#### Setting Up LocalStorageAdapter

To use the `LocalStorageAdapter`, initialize it and call the `connect` method to establish the connection:

```typescript
const localStorageAdapter = new LocalStorageAdapter()
await localStorageAdapter.connect()
```

#### Basic Operations (Create, Read, Update, Delete)

-   **Create (Set)**: Store data in LocalStorage.
    ```typescript
    await localStorageAdapter.set('key', value)
    ```
-   **Read (Get)**: Retrieve data from LocalStorage.
    ```typescript
    const result = await localStorageAdapter.get('key', options)
    ```
-   **Update**: Modify existing data in LocalStorage.
    ```typescript
    await localStorageAdapter.update('key', updatedValue, options)
    ```
-   **Delete**: Remove data from LocalStorage.
    ```typescript
    await localStorageAdapter.delete('key', options)
    ```

#### Data Persistence and Limitations

LocalStorage provides simple key-value storage in the browser with a maximum size limit (usually around 5MB). It is synchronous, which can block the main thread for large operations, making it suitable for smaller datasets.

#### Example: Using LocalStorageAdapter

```typescript
const localStorageAdapter = new LocalStorageAdapter()
await localStorageAdapter.connect()

// Setting data
await localStorageAdapter.set('user', { id: 1, name: 'John Doe' })

// Getting data
const user = await localStorageAdapter.get('user')

// Updating data
await localStorageAdapter.update('user', { name: 'Jane Doe' })

// Deleting data
await localStorageAdapter.delete('user')
```

### IndexedDbAdapter

#### Introduction to IndexedDbAdapter

The **IndexedDbAdapter** is an implementation of the `StorageAdapter` interface that interacts with IndexedDB, a more advanced browser storage option. This adapter is ideal for handling large amounts of structured data and supports complex queries and transactions.

#### Setting Up IndexedDbAdapter

To use the `IndexedDbAdapter`, initialize it with a `schema`, `dbName`, and `version`, and call the `connect` method to establish the connection:

```typescript
const schema = new Schema().createTables((v) => ({
    users: v.object({
        id: v.number(),
        name: v.string(),
    }),
    emails: v.object({
        userId: v.number(),
        content: v.string(),
    }),
}))

const indexedDbAdapter = new IndexedDbAdapter(schema, 'myDatabase', 2)
await indexedDbAdapter.connect()
```

#### Basic Operations (Create, Read, Update, Delete)

-   **Create (Set)**: Store data in IndexedDB.
    ```typescript
    await indexedDbAdapter.set('key', value)
    ```
-   **Read (Get)**: Retrieve data from IndexedDB.
    ```typescript
    const result = await indexedDbAdapter.get('key', options)
    ```
-   **Update**: Modify existing data in IndexedDB.
    ```typescript
    await indexedDbAdapter.update('key', updatedValue, options)
    ```
-   **Delete**: Remove data from IndexedDB.
    ```typescript
    await indexedDbAdapter.delete('key', options)
    ```

#### IndexedDB Features and Limitations

IndexedDB offers asynchronous, non-blocking storage with more advanced capabilities than LocalStorage, such as:

-   Large storage capacity, suitable for big datasets.
-   Indexed access for faster querying.
-   Supports transactions and complex queries.

However, IndexedDB has a more complex API and requires a longer setup time compared to LocalStorage.

#### Example: Using IndexedDbAdapter

```typescript
const schema = new Schema().createTables((v) => ({
    users: v.object({
        id: v.number(),
        name: v.string(),
    }),
    emails: v.object({
        userId: v.number(),
        content: v.string(),
    }),
}))

const indexedDbAdapter = new IndexedDbAdapter(schema, 'myDatabase', 2)
await indexedDbAdapter.connect()

// Setting data
await indexedDbAdapter.set('user', { id: 1, name: 'John Doe' })

// Getting data
const user = await indexedDbAdapter.get('user')

// Updating data
await indexedDbAdapter.update('user', { name: 'Jane Doe' })

// Deleting data
await indexedDbAdapter.delete('user')
```

## QueryBuilder

The `QueryBuilder` is a core component of the `web-query-builder` library, designed to simplify the process of interacting with browser storage systems. It provides a fluent and intuitive API for constructing and executing queries across different storage types, such as LocalStorage and IndexedDB.

### Introduction to QueryBuilder

The `QueryBuilder` allows you to perform various database operations, such as inserting, selecting, updating, and deleting records. It integrates with storage adapters and schemas to provide a seamless querying experience.

### Setting Up QueryBuilder

To use the `QueryBuilder`, you need to initialize it with a storage adapter and a schema. The adapter handles the underlying storage operations, while the schema defines the structure of the data you are working with.

```typescript
const adapter = await new LocalStorageAdapter().connect()
const qb = new QueryBuilder(adapter, schema)
```

### Basic Operations

#### Insert

Use the `insert` method to add new records to a table. This method takes the data to be inserted and performs the operation.

```typescript
await qb.from('users').insert({ id: 1, name: 'test' }).run()
```

#### Select

The `select` method retrieves data from a table.
You can specify the fields to be retrieved and apply ordering if needed.
You can use '*' with = operator `(.where('name', '=', '*Doe'))`.

```typescript
await qb.from('users').select('id').orderBy('id', 'DESC').run()
```

#### Update

To modify existing records, use the `update` method. This method allows you to change specific fields of records that match the given conditions.

```typescript
await qb.from('users').update({ name: 'updated' }).where('id', '>', 1).run()
```

#### Delete

Use the `delete` method to remove records from a table based on specified conditions. You can chain multiple conditions to refine the deletion criteria.

```typescript
await qb
    .from('emails')
    .delete()
    .where('userId', '>', 1)
    .where('content', '=', 'test')
    .run()
```

### Summary

The `QueryBuilder` provides a powerful and user-friendly API for managing data in browser storage systems. By integrating with storage adapters and schemas, it enables you to perform complex queries and operations with ease, making it a versatile tool for web development.

## API Reference

The `web-query-builder` library provides a set of components for interacting with browser storage systems. This section details the API for the `StorageAdapter`, `QueryBuilder`, and `Schema` classes.

### StorageAdapter Interface

The `StorageAdapter` interface defines the methods required for storage adapters. It ensures a consistent API for interacting with different storage systems.

```typescript
export interface StorageAdapter {
    connect(): Promise<this>
    get(key: string, qo: Options): Promise<GetStorageResult>
    set(key: string, value: any): Promise<SetStorageResult>
    update(key: string, value: any, qo: Options): Promise<UpdateStorageResult>
    delete(key: string, qo: Options): Promise<DeleteStorageResult>
}
```

-   **connect()**: Establishes a connection to the storage system.
-   **get(key: string, qo: Options)**: Retrieves the value associated with the specified key.
-   **set(key: string, value: any)**: Stores a value under the specified key.
-   **update(key: string, value: any, qo: Options)**: Updates the value for the specified key based on the given options.
-   **delete(key: string, qo: Options)**: Deletes the value associated with the specified key.

### QueryBuilder Class

The `QueryBuilder` class facilitates constructing and executing queries. It is initialized with a storage adapter and a schema.

```typescript
class QueryBuilder {
    private adapter: StorageAdapter
    private schema: Schema

    from(tableName: string): Query
}
```

-   **constructor(adapter: StorageAdapter, schema: Schema)**: Initializes the `QueryBuilder` with a storage adapter and schema.
-   **from(tableName: string)**: Specifies the table to query. Returns an instance of the `Query` class for the given table.

### Schema Class

The `Schema` class is used to define and validate the structure of tables in the database.

```typescript
export class Schema {
    public validator: Record<Record<string, any>>

    createTables(
        callback: (v: Valibot) => Record<string, Valibot.ObjectSchema>
    ): Schema

    validate(key: string, input: unknown): boolean
}
```

-   **createTables(callback: (v: Valibot) => Record<string,Valibot.ObjectSchema>)**: Defines tables and their schemas. Returns the updated `Schema` instance.
-   **validate(key: string, input: unknown)**: Validates the input data against the schema for the specified table. Returns `true` if the validation is successful, otherwise `false`.
