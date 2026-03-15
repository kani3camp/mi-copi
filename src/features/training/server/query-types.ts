type QueryResult<Row> = PromiseLike<Row[]> & {
  from(table: unknown): QueryResult<Row>;
  where(condition: unknown): QueryResult<Row>;
  orderBy(...values: unknown[]): QueryResult<Row>;
  limit(count: number): QueryResult<Row>;
};

export interface SelectOnlyDb {
  select<Row extends object>(
    fields?: Record<string, unknown>,
  ): QueryResult<Row>;
}

export interface InsertValuesBuilder {
  onConflictDoUpdate(update: unknown): Promise<void>;
}

export interface InsertDb {
  insert(table: unknown): {
    values(value: unknown): InsertValuesBuilder;
  };
}
