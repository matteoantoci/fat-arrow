# => Fat Arrow &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/fat-arrow-ts.svg?style=flat)](https://www.npmjs.com/package/fat-arrow-ts) [![CircleCI Status](https://circleci.com/gh/matteoantoci/fat-arrow-ts.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/matteoantoci/fat-arrow-ts)

Fat Arrow is a library for Typed Functional Programming in TypeScript compatible with Node.js and all major browsers.

:warning: **Alpha release! API may change** :warning:

* [Installation](#installation)
* [Quick start](#quick-start)
* [Features](#features)
  + [Flattening](#flattening)
* [API](#api)
  + [Either](#either)
    - [`isRight`](#isright)
    - [`isLeft`](#isleft)
    - [`equals`](#equals)
    - [`fold`](#fold)
    - [`map`](#map)
    - [`mapIf`](#mapif)
    - [`mapLeft`](#mapleft)
    - [`catch`](#catch)
  + [Factory functions](#factory-functions)
    - [`right`](#right)
    - [`left`](#left)
    - [`maybe`](#maybe)
    - [`just`](#just)
    - [`none`](#none)
    - [`tryCatch`](#trycatch)
    - [`ok`](#ok)
    - [`error`](#error)
  + [Jest matchers](#jest-matchers)
    - [toBeRight](#toberight)
    - [toBeLeft](#tobeleft)
    - [toHaveBeenLastCalledWithRight](#tohavebeenlastcalledwithright)
    - [toHaveBeenLastCalledWithLeft](#tohavebeenlastcalledwithleft)
* [Examples](#examples)
    + [Tennis game](#tennis-game)
  
## Installation
  
```bash  
npm install fat-arrow-ts   
```

Optional: setup Jest custom matchers

```bash  
npm install --save-dev jest-matcher-utils
```

```ts
// In jest.config.ts

export default {
    setupFilesAfterEnv: [
      'fat-arrow-ts/jest-matchers'
    ],
}
```
  
## Quick start
  
```ts  
import { left, right, Either } from 'fat-arrow-ts';  
  
const getDivision = (numerator: number, denominator: number): Either<Error, number> => {  
    if (denominator === 0) {  
        return left(new Error('Division by zero!'))  
    }  
  
    return right(numerator / denominator)
}
  
const addTwo = (number: number) => number + 2  
  
const print = (value: Either<Error, number>) =>  
    value.fold(  
        (error) => console.error('Doh!', error.message),  
        (result) => console.log(`Result is ${result}. Hooray!`)  
    )  
  
print(getDivision(10, 0).map(addTwo)) // Doh! Division by zero!  
print(getDivision(10, 5).map(addTwo)) // Result is 4. Hooray!  
```  
  
## Features
  
### Flattening
  
Fat Arrow's factory functions and data types' methods support flattening to accept both TS native values and data types themselves; in the latter case, data types objects will be flattened.  
  
```ts  
import { right } from 'fat-arrow-ts';  
  
const myValue = right<Error, number>(5)  
  
console.log(right(myValue).equals(myValue)) // true  
```  
  
See the API documentation for more details on this topic.

## API

### Either

Here is the list of `Either<E, A>` type class properties and methods.

#### `isRight`

States if `Either<E, A>` is in _right_ state.

```ts
import { right } from 'fat-arrow-ts';  
  
const myValue = right<Error, number>(5)  
  
console.log(myValue.isRight) // true 
```

#### `isLeft`

States if `Either<E, A>` is in _left_ state.

```ts
import { left } from 'fat-arrow-ts';  
  
const myValue = left<Error, number>(new Error('Ouch!'))  
  
console.log(myValue.isLeft) // true 
```

#### `equals`

Takes an `Either<any, any>` in input and asserts if the passed value has the same state and **structural equality**.

```ts
import { right, left } from 'fat-arrow-ts';  
  
const aRightValue = right<object, object>({ foo: 'foo' })
console.log(aRightValue.equals(aRightValue)) // true

const anotherRightValue = right<object, object>({ bar: 'bar' })
console.log(anotherRightValue.equals(aRightValue)) // false

const aLeftValueWithSameContents = left<object, object>({ foo: 'foo' })
console.log(aLeftValueWithSameContents.equals(aRightValue)) // false

// Deep comparison
console.log(aRightValue.equals(right({ foo: 'foo' }))) // true
```

#### `fold`

It lets you handle or unwrap the raw value in your data type instances.

It comes with two overloaded call signatures
* `() => E | A`: will return the value as it is
* `(ifLeft: (left: E) => B, ifRight: (right: A) => B) => B`: will accept two callbacks that will let you trigger side effects or map the value before returning it.

```ts
import { right, left } from 'fat-arrow-ts';  
  
const aRightValue = right<Error, number>(5)

console.log(myValue.fold()) // 5

// Mapping values
const aLeftValue = left<Error, number>(new Error('Ouch!'))

console.log(aLeftValue.fold(e => 0, it => it)) // 0

// Triggering side effects
aLeftValue.fold(
  e => {
    // Only the left callback will be applied to the value
    console.error(e) // Error
  }, 
  it => {
    console.log(it)
  }
)
```

#### `map`

Takes a callback of type `(value: A) => B | Either<E, B>` and applies it to the _right_ value of your type class instances.

By default `map` method will try to convert the returned value to an `Either<E, B>` _right_ state so that you can also produce raw values from your callback.

Returning a _left_ value, you can switch to a _left_ state.

If you are used to ES Promises you may find a lot of similarities with the `.then()` method.

```ts
import { right, left } from 'fat-arrow-ts'; 
  
const myValue = right<Error, number>(5)
 
// Will be wrapped in a Either<Error, number>
const rightResult = myValue.map(
  it => it + 5
)

console.log(rightResult.isRight) // true 
console.log(rightResult.fold()) // 5

// Will be flattened to a Either<Error, number>
const sameRightResult = myValue.map(
  it => right<Error, number>(it + 5)
)

console.log(sameRightResult.isRight) // true 
console.log(sameRightResult.fold()) // 5

// You can return right values with a different type
const anotherRight = myValue.map(
  it => right<Error, string>('foo')
)

console.log(sameRightResult.isRight) // true 
console.log(sameRightResult.fold()) // 'foo'

// Will be flattened to a Either<Error, number> with left state
const leftResult = myValue.map(
  it => left<Error, number>(new Error())
) 

console.log(leftResult.isLeft) // true 
console.log(leftResult.fold()) // Error
```

#### `mapIf`

Works very similar to `map` but it also accepts a _predicate_ `(value: A) => boolean` as first parameter.

It will map your type class instances only if the predicate returns `true`.

```ts
import { right, left } from 'fat-arrow-ts'; 

const isFizzBuzz = (it: number) => it % 15 === 0
const isFizz = (it: number) => it % 3 === 0
const isBuzz = (it: number) => it % 5 === 0

const fizzBuzz = (i: number) =>
	right<string, number>(i)
		.mapIf(isFizzBuzz, () => left('FizzBuzz'))
		.mapIf(isFizz, () => left('Fizz'))
		.mapIf(isBuzz, () => left('Buzz'))
		.fold()

console.log(fizzBuzz(3)) // Fizz
console.log(fizzBuzz(5)) // Buzz
console.log(fizzBuzz(15)) // FizzBuzz
console.log(fizzBuzz(2)) // 2
```

#### `mapLeft`

Similar to `map`, it will let you apply callbacks of type `(value: E) => G | Either<G, A>` to the _left_ value of your type class instances.

By default `mapLeft` method will try to convert the returned value to an `Either<G, A>` _left_ state so that you can also produce raw values from your callback.

Returning a _right_ value, you can switch your type class instances to a _right_ state.

```ts
import { right, left } from 'fat-arrow-ts';
  
const myValue = left<Error, number>(new Error('Ouch!'))
 
// Will be wrapped in a Either<Error, number>
const leftResult = myValue.mapLeft(
  it => new Error(`Error was ${it.message}`)
)

console.log(leftResult.isLeft) // true 
console.log(leftResult.fold()) // Error

// Will be flattened to a Either<Error, number>
const sameLeftResult = myValue.mapLeft(
  it => left<Error, number>(new Error(`Error was ${it.message}`))
)

console.log(sameLeftResult.isLeft) // true 
console.log(sameLeftResult.fold()) // Error

// You can return left values with a different type
const anotherLeft = myValue.mapLeft(
  it => left<string, number>('foo')
)

console.log(anotherLeft.isLeft) // true 
console.log(anotherLeft.fold()) // 'foo'

// Will be flattened to a Either<Error, number> with right state
const rightResult = myValue.mapLeft(
  it => right<Error, number>(5)
)

console.log(rightResult.isRight) // true 
console.log(rightResult.fold()) // 5
```
  
#### `catch`

It takes a callback of type `(value: E) => A | Either<E, A>` and applies it to the _left_ value of your type class instances. 

The main difference with `mapLeft` is that it will try to convert the mapped value to a _right_ state.

As the name suggests, it works similarly to ES Promise `catch`. An optimal tool to recover from errors.

```ts
import { right } from 'fat-arrow-ts'; 

const aLeftValue = left<Error, string>(new Error('Ouch!'))

const recovered = aLeftValue.catch(e => {
  console.error(e)
  return 'Who cares!'
})

console.log(recovered.isRight) // true
console.log(recovered.fold()) // 'Who cares!'
```  
  
### Factory functions

Here is a list of factory function that will let you create data type objects
  
#### `right`
  
Takes a value in input and creates an `Either<E, A>` object with _right_ state.
  
```ts  
import { right } from 'fat-arrow-ts';  
  
const myValue = right<Error, number>(5)  
  
console.log(myValue.fold()) // 5  
  
// Flattening  
console.log(left(myValue).isRight) // true  
console.log(right(myValue).equals(myValue)) // true  
```  

#### `left`
  
Takes a value in input and creates an `Either<E, A>` object with _left_ state.
  
```ts  
import { left } from 'fat-arrow-ts';  
  
const myValue = left<Error, number>(new Error('Ouch!'))  
  
console.log(myValue.fold()) // Error  
  
// Flattening  
console.log(left(myValue).equals(myValue)) // true  
console.log(right(myValue).isLeft) // true  
```  
  
  
#### `maybe`

Takes a value in input and creates a `Maybe<A>` object, that is, an `Either<void, A>` object:
* if the input value is nullable (`null | undefined`) the produced object will have _left_ state;
* if the input value is non-nullable the produced object will have _right_ state.
  
```ts  
import { Maybe, maybe } from 'fat-arrow-ts';  
  
const myMap = new Map([  
    ['key1', 'value1'],  
    ['key2', 'value2'],  
])  
  
const getValue = (key: string): Maybe<string> => maybe(myMap.get(key))

//-- If value is right --//

const existing = getValue('key1')  
  
console.log(existing.fold()) // 'value1'  
console.log(existing.isRight) // true  
  
// Flattening  
console.log(maybe(existing).equals(existing)) // true  
console.log(maybe(existing).isRight) // true  

//-- If value is left --//
  
const missing = getValue('foo')  
  
console.log(missing.fold()) // undefined  
console.log(missing.isLeft) // true  
  
// Flattening  
console.log(maybe(missing).equals(missing)) // true  
console.log(maybe(missing).isLeft) // true  
```  
  
  
#### `just`
  
Takes a non-nullable value in input and creates a `Maybe<A>` object with _right_ state.
  
```ts  
import { just, none, maybe } from 'fat-arrow-ts';  
  
const myValue = just(5)  
  
console.log(myValue.fold()) // 5  
console.log(myValue.isRight) // true  
  
// Flattening  
console.log(maybe(myValue).equals(myValue)) // true  
console.log(just(myValue).equals(myValue)) // true  
```  
  
  
#### `none`
  
Creates a `Maybe<A>` object with _left_ state.
  
```ts  
import { just, none, maybe } from 'fat-arrow-ts';  
  
const myValue = none()  
  
console.log(myValue.fold()) // null 
console.log(myValue.isLeft) // true
console.log(myValue === none()) // true
  
// Flattening  
console.log(maybe(myValue).equals(myValue)) // true  
console.log(just(myValue).equals(myValue)) // true  
```

#### `tryCatch`
  
It takes a callback `() => A | Result<A>` in input that will be run safely. It returns a `Result<A>` that is an `Either<Error, A>`.
* if the callback runs correctly the result of the callback will be returned as a `Result<A>` with _right_ state
* if the callback throws an error, the `Error` will be returned as a `Result<A>` with _left_ state
  
```ts  
import { tryCatch } from 'fat-arrow-ts';

const getFullName = (name: string, surname: string): string => {
    if (name.length < 1 || name.surname < 1) {
        throw new Error()
    }
    return `${name} ${surname}` 
}

//-- If callback runs correctly --//

const result: Result<string> = tryCatch(() => getFullName('John', 'Doe'))

const myValue = result.map((it) => it.toUpperCase())
  
console.log(myValue.fold()) // JOHN DOE
console.log(myValue.isRight) // true
  
//-- If callback throws --//

const safeResult: Result<string> = tryCatch(() => getFullName('', ''))

const mySafeValue = safeResult.map((it) => it.toUpperCase())
  
console.log(mySafeValue.fold()) // Error
console.log(mySafeValue.isLeft) // true  
```

#### `ok`
  
Takes a value in input and creates a `Result<A>` object with _right_ state.
  
```ts  
import { ok } from 'fat-arrow-ts';  
  
const myValue = ok(5)  
  
console.log(myValue.fold()) // 5  
console.log(myValue.isRight) // true  
  
// Flattening  
console.log(ok(myValue).equals(myValue)) // true  
console.log(error(myValue).equals(myValue)) // true  
```

#### `error`
  
Takes a `string` or an `Error` (or its extensions) in input and creates a `Result<A>` object with _left_ state.
  
```ts  
import { error } from 'fat-arrow-ts';  
  
const myValue = error('Ouch!')  
  
console.log(myValue.fold().message) // 'Ouch!'  
console.log(myValue.isLeft) // true  
  
// Flattening  
console.log(error(myValue).equals(myValue)) // true  
console.log(ok(myValue).equals(myValue)) // true  
```

### Jest matchers

See [Installation](#installation) for setup.

#### toBeRight

Asserts if `expected` is _right_ and has the expected value. It accepts both raw values and data type instances.

```ts
import { right } from './either'
 
it('is right', () => {
    const actual = right<Error, number>(5)

    expect(actual).toBeRight(5);
})
```

#### toBeLeft

Asserts if `expected` is _left_ and has the expected value. It accepts both raw values and data type instances.

```ts
import { left } from './either'
 
it('is left', () => {
    const actual = left<Error, number>(new Error())

    expect(actual).toBeLeft(new Error());
})
```

#### toHaveBeenLastCalledWithRight

Asserts if a `jest.Mock` has been called last time with the expected _right_ value

```ts
it('is called with right', () => {
    const spy = jest.fn()

    runYourCode(spy)

    expect(spy).toHaveBeenLastCalledWithRight(5);
})
```

#### toHaveBeenLastCalledWithLeft

Asserts if a `jest.Mock` has been called last time with the expected _left_ value

```ts
it('is called with left', () => {
    const spy = jest.fn()

    runYourCode(spy)

    expect(spy).toHaveBeenLastCalledWithLeft(5);
})
```

## Examples

### Tennis game

See examples folder =)
