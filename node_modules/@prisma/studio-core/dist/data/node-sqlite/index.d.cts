import { DatabaseSync } from 'node:sqlite';
import { L as Executor } from '../../adapter-DYzAiJd4.cjs';
import 'kysely';

declare function createNodeSQLiteExecutor(database: DatabaseSync): Executor;

export { createNodeSQLiteExecutor };
