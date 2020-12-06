import equal from 'fast-deep-equal/es6/react'
import { createAdtBuilder } from './utils/adt-builder'
import { Either, Left, LeftValue, Right, RightValue } from './types'

const builder = createAdtBuilder({})

const rightOf = <E, A>(value: RightValue<E, A>): Either<E, A> =>
	builder.flatten<A, Either<E, A>>(value).seal(
		(data): Right<E, A> => ({
			toString: () => `right(${data})`,
			isLeft: false,
			isRight: true,
			equals: (operand) =>
				operand.fold(
					() => false,
					(it) => equal(it, data)
				),
			map: (ifRight) => rightOf(ifRight(data)),
			mapLeft: () => rightOf(data),
			catch: () => rightOf(data),
			fold: <B>(_?: (value: E) => B, ifRight?: (value: A) => B) => (ifRight ? ifRight(data) : data),
			mapIf: (predicate, ifTrue) => (predicate(data) ? rightOf(ifTrue(data)) : rightOf(data)),
		})
	)

const leftOf = <E, A>(value: LeftValue<E, A>): Either<E, A> =>
	builder.flatten<E, Either<E, A>>(value).seal(
		(data): Left<E, A> => ({
			toString: () => `left(${data})`,
			isLeft: true,
			isRight: false,
			equals: (operand) =>
				operand.fold(
					(it) => equal(it, data),
					() => false
				),
			map: () => leftOf(data),
			mapLeft: (f) => leftOf(f(data)),
			catch: (ifLeft) => rightOf(ifLeft(data)),
			fold: <B>(ifLeft?: (value: E) => B) => (ifLeft ? ifLeft(data) : data),
			mapIf: () => leftOf(data),
		})
	)

export const right = <E = [Error, 'Please specify E type in right<E, A>'], A = never>(
	r: RightValue<E, A>
): Either<E, A> => rightOf(r)

export const left = <E = never, A = [Error, 'Please specify A type in left<E, A>']>(
	l: LeftValue<E, A>
): Either<E, A> => leftOf(l)

// TODO: add docs
export const ifElse = <E, A>(
	bool: boolean,
	ifFalse: () => LeftValue<E, A>,
	ifTrue: () => RightValue<E, A>
): Either<E, A> => (bool ? right(ifTrue()) : left(ifFalse()))
