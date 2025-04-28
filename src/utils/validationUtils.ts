export const isValidUUID = (uuid: string | undefined | null): boolean => {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateUUIDOrNull = (uuid: string | undefined | null): string | null => {
  return isValidUUID(uuid) ? uuid : null;
};