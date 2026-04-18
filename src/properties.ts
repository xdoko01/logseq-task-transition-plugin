/**
 * Adds or updates a block property via the LogSeq Editor API.
 *
 * @param blockUuid  UUID of the block to update
 * @param property   Property name (without "::" suffix), e.g. "started"
 * @param value      Property value string, e.g. "[[Apr 17th, 2026]] 12:05"
 * @param overwrite  If false, skip the update when the property already has a value
 */
export async function upsertProperty(
  blockUuid: string,
  property: string,
  value: string,
  overwrite: boolean
): Promise<void> {
  if (!overwrite) {
    const block = await logseq.Editor.getBlock(blockUuid, { includeChildren: false });
    if (block?.properties?.[property] != null) return;
  }
  await logseq.Editor.upsertBlockProperty(blockUuid, property, value);
}
