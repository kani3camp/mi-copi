export interface MockInsertCall {
  table: unknown;
  values: unknown[];
  conflictUpdates: unknown[];
}

export function createMockDb(selectResults: Array<unknown | Error>) {
  let selectIndex = 0;
  const insertCalls: MockInsertCall[] = [];

  const db = {
    select() {
      const next = selectResults[selectIndex++];
      return createQueryChain(next);
    },
    insert(table: unknown) {
      const call: MockInsertCall = {
        table,
        values: [],
        conflictUpdates: [],
      };
      insertCalls.push(call);

      return {
        values(value: unknown) {
          call.values.push(value);

          return {
            async onConflictDoUpdate(update: unknown) {
              call.conflictUpdates.push(update);
            },
          };
        },
      };
    },
  };

  return {
    db,
    insertCalls,
  };
}

function createQueryChain(result: unknown | Error) {
  const chain = (
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
  ) as Promise<unknown> & {
    from: () => typeof chain;
    where: () => typeof chain;
    orderBy: () => typeof chain;
    limit: () => Promise<unknown>;
  };

  chain.from = () => chain;
  chain.where = () => chain;
  chain.orderBy = () => chain;
  chain.limit = () => chain;

  return chain;
}
