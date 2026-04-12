//-----------------------------------------------
// 
//-----------------------------------------------
import { SenderError } from 'spacetimedb';
//-----------------------------------------------
// 
//-----------------------------------------------
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateRandomString(ctx: any, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    // ctx.random<number>() provides a deterministic float between 0 and 1
    const randomIndex = Math.floor(ctx.random() * ALPHABET.length);
    result += ALPHABET[randomIndex];
  }
  return result;
}
//-----------------------------------------------
// Example: prefix + random part
//-----------------------------------------------
export function generateUniqueId(ctx: any, prefix: string = "id"): string {
  const randomPart = generateRandomString(ctx, 24);
  // You can also include a tiny bit of time if you want (but keep it deterministic)
  return `${prefix}_${randomPart}`;
}

export function getAllMethods(obj: any): string[] {
  // Use Object.getOwnPropertyNames to get all property names (including non-enumerable ones, if necessary)
  return Object.getOwnPropertyNames(obj).filter(function (prop) {
    // Check if the property value is of type 'function'
    return typeof obj[prop] === 'function';
  });
}

// import * as TestDB from 'spacetimedb/server';
// const methods = getAllMethods(TestDB);
// console.log(TestDB);
//-----------------------------------------------
// 
//-----------------------------------------------
export function validateName(name: string) {
  if (!name) {
    throw new SenderError('Names must not be empty');
  }
}
//-----------------------------------------------
// 
//-----------------------------------------------
export function validateMessage(text: string) {
  if (!text) {
    throw new SenderError('Messages must not be empty');
  }
}
//-----------------------------------------------
// 
//-----------------------------------------------
export function degreeToRadians(degree:number) {
  return degree * (Math.PI / 180);
}
