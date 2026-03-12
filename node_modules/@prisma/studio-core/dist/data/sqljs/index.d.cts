import { Database } from 'sql.js';
import { L as Executor } from '../../adapter-DYzAiJd4.cjs';
import 'kysely';

declare function createSQLJSExecutor(database: Database): Executor;

export { createSQLJSExecutor };
