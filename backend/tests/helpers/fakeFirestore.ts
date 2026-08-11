/**
 * Minimal in-memory stand-in for the Firestore Admin SDK, covering only what the
 * app's services use: collection/doc get-set-update-delete, single-field '=='
 * where clauses, limit, batches, and runTransaction (including create-if-absent).
 * Not a Firestore emulator — good enough for service-level unit tests.
 */

type DocData = Record<string, unknown>;

type FirestoreLikeError = Error & { code: number };

function notFoundError(id: string): FirestoreLikeError {
  const err = new Error(`No document to update: ${id}`) as FirestoreLikeError;
  err.code = 5; // NOT_FOUND
  return err;
}

function alreadyExistsError(id: string): FirestoreLikeError {
  const err = new Error(`Document already exists: ${id}`) as FirestoreLikeError;
  err.code = 6; // ALREADY_EXISTS
  return err;
}

class FakeDocRef {
  constructor(
    public readonly store: Map<string, DocData>,
    public readonly id: string
  ) {}

  async get() {
    const data = this.store.get(this.id);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => (data ? { ...data } : undefined),
    };
  }

  async set(data: DocData) {
    this.store.set(this.id, { ...data });
  }

  async update(data: DocData) {
    const existing = this.store.get(this.id);
    if (!existing) throw notFoundError(this.id);
    this.store.set(this.id, { ...existing, ...data });
  }

  async delete() {
    this.store.delete(this.id);
  }
}

class FakeQuery {
  constructor(
    protected store: Map<string, DocData>,
    protected filters: Array<{ field: string; value: unknown }> = [],
    protected limitCount?: number
  ) {}

  where(field: string, _op: '==', value: unknown): FakeQuery {
    return new FakeQuery(this.store, [...this.filters, { field, value }], this.limitCount);
  }

  limit(n: number): FakeQuery {
    return new FakeQuery(this.store, this.filters, n);
  }

  private matching(): Array<[string, DocData]> {
    let entries = [...this.store.entries()];
    for (const filter of this.filters) {
      entries = entries.filter(([, data]) => data[filter.field] === filter.value);
    }
    if (this.limitCount != null) entries = entries.slice(0, this.limitCount);
    return entries;
  }

  async get() {
    const entries = this.matching();
    return {
      empty: entries.length === 0,
      docs: entries.map(([id, data]) => ({
        id,
        data: () => ({ ...data }),
        ref: new FakeDocRef(this.store, id),
      })),
    };
  }
}

class FakeCollection extends FakeQuery {
  doc(id: string): FakeDocRef {
    return new FakeDocRef(this.store, id);
  }
}

class FakeTransaction {
  async get(refOrQuery: FakeDocRef | FakeQuery) {
    return refOrQuery.get();
  }

  set(ref: FakeDocRef, data: DocData) {
    void ref.set(data);
    return this;
  }

  create(ref: FakeDocRef, data: DocData) {
    if (ref.store.has(ref.id)) throw alreadyExistsError(ref.id);
    ref.store.set(ref.id, { ...data });
    return this;
  }

  update(ref: FakeDocRef, data: DocData) {
    void ref.update(data);
    return this;
  }

  delete(ref: FakeDocRef) {
    void ref.delete();
    return this;
  }
}

class FakeBatch {
  private ops: Array<() => void> = [];

  set(ref: FakeDocRef, data: DocData) {
    this.ops.push(() => void ref.set(data));
    return this;
  }

  update(ref: FakeDocRef, data: DocData) {
    this.ops.push(() => void ref.update(data));
    return this;
  }

  delete(ref: FakeDocRef) {
    this.ops.push(() => void ref.delete());
    return this;
  }

  async commit() {
    for (const op of this.ops) op();
  }
}

export class FakeFirestore {
  private collections = new Map<string, Map<string, DocData>>();

  collection(name: string): FakeCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return new FakeCollection(this.collections.get(name)!);
  }

  batch(): FakeBatch {
    return new FakeBatch();
  }

  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    return fn(new FakeTransaction());
  }
}
