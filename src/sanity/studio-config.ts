/** Public identifiers only. Never import the server token/environment module here. */
export function getStudioEnvironment(): { projectId: string; dataset: string } | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  if (!projectId || !/^[a-z0-9]{1,32}$/.test(projectId)) return null;
  if (!dataset || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset)) return null;
  return { projectId, dataset };
}
