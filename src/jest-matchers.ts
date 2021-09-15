import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'
import { leftOf, rightOf } from './either/either'
import { nothing } from './maybe/maybe'
import { Either } from './types'

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeRight(expected: any): CustomMatcherResult

			toBeLeft(expected: any): CustomMatcherResult

			toHaveBeenLastCalledWithRight(expected: any): CustomMatcherResult

			toHaveBeenLastCalledWithLeft(expected: any): CustomMatcherResult

			toBeNothing(): CustomMatcherResult

			toHaveBeenLastCalledWithNothing(): CustomMatcherResult
		}
	}
}

type AnyEither = Either<any, any>
type TestValues = { expected: AnyEither; received: AnyEither }

const getLastCallArgument = (mock: jest.Mock) => {
	const lastCall = mock.mock.calls[mock.mock.calls.length - 1]
	return lastCall ? lastCall[0] : undefined
}

const getReportHeader = (fnName: string, pass: boolean) => `${matcherHint(
	`${pass ? '.not' : ''}.${fnName}`,
	'received',
	'expected'
)}
`

const getExpectedMessage = (values: TestValues) => printExpected(values.expected.toString())

const getReceivedMessage = (values: TestValues) => `Received: ${printReceived(values.received.toString())}`

const getExpectedValueMessage = (pass: boolean, values: TestValues) =>
	`Expected value${pass ? ' not ' : ' '}to be: ${getExpectedMessage(values)}`

const getExpectedSpyMessage = (pass: boolean, values: TestValues) =>
	`Expected spy${pass ? ' not ' : ' '}to have been last called with: ${getExpectedMessage(values)}`

const getValueCheckResults = (fnName: string, values: TestValues, pass: boolean) => ({
	pass,
	message: () => `${getReportHeader(fnName, pass)}
${getExpectedValueMessage(pass, values)}
${getReceivedMessage(values)}`,
})

const getSpyCheckResults = (fnName: string, values: TestValues, pass: boolean) => ({
	pass,
	message: () => `${getReportHeader(fnName, pass)}
${getExpectedSpyMessage(pass, values)}
${getReceivedMessage(values)}`,
})

const isRight = (values: TestValues) => values.received.equals(values.expected)

const isLeft = (values: TestValues) => values.received.equals(values.expected)

const toBeRight = <T>(received: AnyEither, expected: T) => {
	const values: TestValues = { expected: rightOf(expected), received: rightOf(received) }
	const pass = isRight(values)
	return getValueCheckResults('toBeRight', values, pass)
}

const toBeLeft = <T>(received: AnyEither, expected: T) => {
	const values: TestValues = { expected: leftOf(expected), received: leftOf(received) }
	const pass = isLeft(values)
	return getValueCheckResults('toBeLeft', values, pass)
}

const toBeNothing = (received: AnyEither) => toBeLeft(received, nothing())

const toHaveBeenLastCalledWithRight = <T>(received: jest.Mock, expected: T) => {
	const values: TestValues = {
		expected: rightOf(expected),
		received: rightOf(getLastCallArgument(received)),
	}
	const pass = isRight(values)
	return getSpyCheckResults('toHaveBeenLastCalledWithRight', values, pass)
}

const toHaveBeenLastCalledWithLeft = <T>(received: jest.Mock, expected: T) => {
	const values: TestValues = {
		expected: leftOf(expected),
		received: leftOf(getLastCallArgument(received)),
	}
	const pass = isLeft(values)
	return getSpyCheckResults('toHaveBeenLastCalledWithLeft', values, pass)
}

const toHaveBeenLastCalledWithNothing = (received: jest.Mock) => toHaveBeenLastCalledWithLeft(received, nothing())

expect.extend({
	toBeRight,
	toBeLeft,
	toBeNothing,
	toHaveBeenLastCalledWithRight,
	toHaveBeenLastCalledWithLeft,
	toHaveBeenLastCalledWithNothing,
})
