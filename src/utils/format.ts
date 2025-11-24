export function formatCurrencyBR(value: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch (e) {
    // Fallback
    return `R$ ${value.toFixed(2)}`;
  }
}

export default formatCurrencyBR;
