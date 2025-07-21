import { add, subtract, divide, multiply, square } from "../src/calculator";

it("adds 1 + 2 to equal 3", () => {
  expect(add(1, 2)).toBe(3);
});
it("subtracts 5 - 2 to equal 3", () => {
  expect(subtract(5, 2)).toBe(3);
});
it("multiplies 2 * 3 to equal 6", () => {   
  expect(multiply(2, 3)).toBe(6);
});
it("divides 6 / 2 to equal 3", () => {  
  expect(divide(6, 2)).toBe(3);
});

it("divides 6 / 0 to throw an error", () => { 
  expect(() => divide(6, 0)).toThrow("Cannot divide by zero");
});

it("divides 0 / 6 to equal 0", () => {
  expect(divide(0, 6)).toBe(0);
});
it("divides 0 / 6 to equal 0", () => {
  expect(divide(0, 6)).toBe(0);
});
it("divides 6 / 2 to equal 3", () => {
  expect(divide(6, 2)).toBe(3);
});


it("squares 3 to equal 9", () => {
  expect(square(3)).toBe(9);
});
it("squares 0 to equal 0", () => {
  expect(square(0)).toBe(0);
});
it("squares -3 to equal 9", () => {
  expect(square(3)).toBe(9);
});

it("squares 1 to equal 1", () => {
  expect(square(1)).toBe(1);
});
it("squares -1 to equal 1", () => {
  expect(square(-1)).toBe(1);
});
it("squares 2.5 to equal 6.25", () => {
  expect(square(2.5)).toBe(6.25);
});
it("squares -2.5 to equal 6.25", () => {
  expect(square(-2.5)).toBe(6.25);
});

it("squares 100 to equal 10000", () => {  
  expect(square(100)).toBe(10000);
});
