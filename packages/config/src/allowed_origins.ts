const default_allowed_origins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:2720',
  'http://localhost:3200',
];

const from_env =
  process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

export const allowed_origins =
  from_env.length > 0 ? from_env : default_allowed_origins;

export function mergeAllowedOrigins(...originGroups: Array<string[]>) {
  return originGroups
    .flat()
    .filter(Boolean)
    .filter((origin, index, list) => list.indexOf(origin) === index);
}
