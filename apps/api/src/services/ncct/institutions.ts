export function normalizeNcctInstitutionCode(code: string) {
  return code.trim().toUpperCase();
}

export function hasNcctInstitutionCodeConflict<T extends { id: string; code: string }>(
  code: string,
  institutions: T[],
  currentInstitutionId?: string
) {
  const normalizedCode = normalizeNcctInstitutionCode(code);
  return institutions.some(
    (institution) =>
      institution.id !== currentInstitutionId && normalizeNcctInstitutionCode(institution.code) === normalizedCode
  );
}
