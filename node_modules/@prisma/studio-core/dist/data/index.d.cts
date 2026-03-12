import { A as AdapterIntrospectResult, S as SqlEditorDialect, a as AdapterSqlSchemaResult } from '../adapter-DYzAiJd4.cjs';
export { b as AbortError, c as Adapter, d as AdapterBaseOptions, e as AdapterCapabilities, f as AdapterDeleteDetails, g as AdapterDeleteOptions, h as AdapterDeleteResult, i as AdapterError, j as AdapterInsertDetails, k as AdapterInsertOptions, l as AdapterInsertResult, m as AdapterIntrospectOptions, n as AdapterQueryDetails, o as AdapterQueryOptions, p as AdapterQueryResult, q as AdapterRawDetails, r as AdapterRawOptions, s as AdapterRawResult, t as AdapterRequirements, u as AdapterSqlLintDetails, v as AdapterSqlLintDiagnostic, w as AdapterSqlLintOptions, x as AdapterSqlLintResult, y as AdapterSqlSchemaDetails, z as AdapterSqlSchemaOptions, B as AdapterUpdateDetails, C as AdapterUpdateOptions, D as AdapterUpdateResult, E as BigIntString, F as Column, G as ColumnFilter, H as DataType, I as DataTypeGroup, J as Either, K as ExecuteOptions, L as Executor, M as FilterGroup, N as FilterOperator, O as NumericString, Q as Query, P as QueryResult, R as Schema, T as SequenceExecutor, U as SortDirection, V as SortOrderItem, W as SqlFilter, X as SqlLintDetails, Y as SqlLintDiagnostic, Z as SqlLintResult, _ as Table, $ as applyInferredRowFilters, a0 as createAdapterError, a1 as getAbortResult } from '../adapter-DYzAiJd4.cjs';
export { F as FULL_TABLE_SEARCH_MAX_TEXT_COLUMNS, a as FULL_TABLE_SEARCH_MIN_QUERY_LENGTH, b as FULL_TABLE_SEARCH_MYSQL_LOCK_WAIT_TIMEOUT_SECONDS, c as FULL_TABLE_SEARCH_POSTGRES_LOCK_TIMEOUT_MS, d as FULL_TABLE_SEARCH_TIMEOUT_MESSAGE, e as FULL_TABLE_SEARCH_TIMEOUT_MS, f as FullTableSearchDialect, g as FullTableSearchExecutionState, h as FullTableSearchPlan, i as FullTableSearchPredicate, j as FullTableSearchTimeoutError, k as buildFullTableSearchPlan, l as createFullTableSearchExecutionState, m as executeQueryWithFullTableSearchGuardrails, n as getFullTableSearchExpression, o as isFullTableSearchRequest } from '../full-table-search-lTj-t9ys.cjs';
import 'kysely';

declare function getDate0(format: string): string;
declare const DEFAULT_STRING = "";
declare const DEFAULT_NUMERIC = 0;
declare const DEFAULT_BOOLEAN = false;
declare const DEFAULT_ARRAY_DISPLAY = "[]";
declare const DEFAULT_JSON = "{}";
declare const DEFAULT_ARRAY_VALUE = "{}";

declare function createSqlEditorSchemaFromIntrospection(args: {
    defaultSchema?: string;
    dialect: SqlEditorDialect;
    introspection: AdapterIntrospectResult;
}): AdapterSqlSchemaResult;
declare function createSqlEditorNamespace(introspection: AdapterIntrospectResult): Record<string, Record<string, string[]>>;
declare function createSqlEditorSchemaVersion(namespace: Record<string, Record<string, string[]>>): string;

interface SqlStatementSegment {
    from: number;
    statement: string;
    to: number;
}
declare function splitTopLevelSqlStatements(sql: string): SqlStatementSegment[];
declare function getTopLevelSqlStatementAtCursor(args: {
    cursorIndex: number;
    sql: string;
}): SqlStatementSegment | null;

export { AdapterIntrospectResult, AdapterSqlSchemaResult, DEFAULT_ARRAY_DISPLAY, DEFAULT_ARRAY_VALUE, DEFAULT_BOOLEAN, DEFAULT_JSON, DEFAULT_NUMERIC, DEFAULT_STRING, SqlEditorDialect, type SqlStatementSegment, createSqlEditorNamespace, createSqlEditorSchemaFromIntrospection, createSqlEditorSchemaVersion, getDate0, getTopLevelSqlStatementAtCursor, splitTopLevelSqlStatements };
