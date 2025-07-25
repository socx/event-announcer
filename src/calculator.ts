export function add(a: number, b: number) {
  return a + b;
}
export function subtract(a: number, b: number) {
  return a - b;
}
export function multiply(a: number, b: number) {
  return a * b;
}
export function divide(a: number, b: number) {  
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}
export function square(a: number) { 
  return a * a;
}
