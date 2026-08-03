/**
 * Tiny runtime type-guard helpers — just enough so we don't need to add zod
 * as a dependency. Validates primitives and object shapes used by API routes.
 */
type Validator<T> = (v: unknown) => v is T;

export const z = {
  string(): Validator<string> {
    return (v): v is string => typeof v === 'string';
  },
  email(): Validator<string> {
    return (v): v is string =>
      typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  },
  number(): Validator<number> {
    return (v): v is number => typeof v === 'number' && !Number.isNaN(v);
  },
  boolean(): Validator<boolean> {
    return (v): v is boolean => typeof v === 'boolean';
  },
  array<T>(of: Validator<T>): Validator<T[]> {
    return (v): v is T[] => Array.isArray(v) && v.every((x) => of(x));
  },
  object<S extends Record<string, Validator<any>>>(shape: S) {
    return {
      safeParse(v: unknown):
        | { success: true; data: { [K in keyof S]: S[K] extends Validator<infer T> ? T : never } }
        | { success: false; error: string } {
        if (!v || typeof v !== 'object') return { success: false, error: 'not_object' };
        const out: any = {};
        for (const k of Object.keys(shape)) {
          const vv = (v as any)[k];
          if (!shape[k](vv)) return { success: false, error: `invalid_${k}` };
          out[k] = vv;
        }
        return { success: true, data: out };
      },
    };
  },
};
