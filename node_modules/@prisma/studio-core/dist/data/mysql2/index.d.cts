import { Pool } from 'mysql2/promise';
import { T as SequenceExecutor } from '../../adapter-DYzAiJd4.cjs';
import 'kysely';

declare function createMySQL2Executor(pool: Pool): SequenceExecutor;

export { createMySQL2Executor };
