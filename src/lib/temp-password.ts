/** Senha temporária documentada para RH (onboarding em massa). */
export function tempPasswordForCodigo(codigoFuncionario: number): string {
  return `METARH#${codigoFuncionario}`;
}

export function isValidNewPassword(plain: string): boolean {
  if (plain.length < 8) return false;
  if (!/[A-Za-z]/.test(plain)) return false;
  if (!/[0-9]/.test(plain)) return false;
  return true;
}
