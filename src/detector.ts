/** All task state markers LogSeq recognises */
export type TaskMarker =
  | "TODO"
  | "DOING"
  | "DONE"
  | "WAITING"
  | "LATER"
  | "NOW"
  | "CANCELLED";

/**
 * A LogSeq datom tuple: [entityId, attribute, value, transactionId, added]
 * - entityId: numeric ID of the changed block
 * - attribute: e.g. ":block/marker", ":block/content"
 * - value: the attribute's value
 * - transactionId: numeric ID of the DB transaction
 * - added: true = this value was asserted; false = it was retracted
 */
export type Datom = [number, string, unknown, number, boolean];

export interface Transition {
  blockUuid: string;
  from: TaskMarker;
  to: TaskMarker;
}

/**
 * Scans the datoms from a DB change event and returns every block whose
 * task marker changed from one state to a different state.
 *
 * @param datoms  Raw datoms from logseq.DB.onChanged({ txData })
 * @param blocks  Blocks from the same event, used to map numeric IDs → UUIDs
 */
export function detectTransitionsFromDatoms(
  datoms: Datom[],
  blocks: Array<{ id: number; uuid: string }>
): Transition[] {
  // Collect old (retracted) and new (asserted) markers grouped by entity ID
  const byEntity = new Map<number, { from?: TaskMarker; to?: TaskMarker }>();

  for (const [entityId, attribute, value, , added] of datoms) {
    if (attribute !== ":block/marker") continue;
    if (!byEntity.has(entityId)) byEntity.set(entityId, {});
    const entry = byEntity.get(entityId)!;
    if (added) {
      entry.to = value as TaskMarker;
    } else {
      entry.from = value as TaskMarker;
    }
  }

  // Build a lookup from numeric block ID → UUID string
  const uuidByEntityId = new Map(blocks.map((b) => [b.id, b.uuid]));

  const transitions: Transition[] = [];
  for (const [entityId, { from, to }] of byEntity) {
    if (!from || !to || from === to) continue;
    const blockUuid = uuidByEntityId.get(entityId);
    if (!blockUuid) continue;
    transitions.push({ blockUuid, from, to });
  }
  return transitions;
}
