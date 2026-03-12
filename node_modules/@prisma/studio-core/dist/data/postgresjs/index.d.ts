import { Sql } from 'postgres';
import { L as Executor } from '../../adapter-DYzAiJd4.js';
import 'kysely';

declare function createPostgresJSExecutor(postgresjs: Sql): Executor;

export { createPostgresJSExecutor };
