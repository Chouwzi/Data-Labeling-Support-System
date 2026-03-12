import { Sql } from 'postgres';
import { L as Executor } from '../../adapter-DYzAiJd4.cjs';
import 'kysely';

declare function createPostgresJSExecutor(postgresjs: Sql): Executor;

export { createPostgresJSExecutor };
