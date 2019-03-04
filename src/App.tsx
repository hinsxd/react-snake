import React, { Component, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import styled, { css } from 'styled-components';
import './App.css';
type Coordinate = {
	row: number;
	col: number;
};

type Direction = Coordinate;

type Cell = Coordinate;

type Body = Cell & {
	hasFood: boolean;
};

type Mode = 'Normal' | 'Infinite';

const Container = styled.main`
	height: 100vh;
	max-width: 500px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
`;
const Row = styled.div`
	flex-shrink: 0;
	display: flex;
	width: 100%;
	flex-direction: row;
`;

const MetaBar = styled(Row)`
	justify-content: space-between;
	margin-bottom: 0.5rem;
	font-size: 1.5rem;
	font-weight: 500;
`;
const ButtonBar = styled(Row)`
	button {
		flex: 1;
		border: 1px solid #222;
		box-shadow: 0 0 5px #383838;
	}
`;
const SnakeField = styled.div`
	${(p: { size: number; mode: Mode }) => ``};
	flex: 0 0 500px;
	width: 500px;
	border: 2px #444 ${p => (p.mode === 'Normal' ? 'solid' : 'dashed')};
	box-shadow: 0 0 5px #666;
	display: grid;
	grid-template-columns: repeat(${p => p.size}, 1fr);
	grid-template-rows: repeat(${p => p.size}, 1fr);
	grid-gap: -1px;
`;

const Cell = styled.div`
	${(p: { cell: Coordinate }) => ``};
	grid-column: ${p => p.cell.col};
	grid-row: ${p => p.cell.row};
	position: relative;
`;
const Food = styled(Cell)`
	background-color: blue;
	border-radius: 50%;
`;

const Body = styled(Cell)`
	${(p: { cell: Coordinate & Body }) => ``};
	background-color: red;
	${p =>
		p.cell.hasFood &&
		css`
			background-color: darkred;
		`}
	&:first-of-type {
		background-color: purple;
	}
`;

const directions: { [x: string]: Direction } = {
	UP: { row: -1, col: 0 },
	DOWN: { row: 1, col: 0 },
	LEFT: { row: 0, col: -1 },
	RIGHT: { row: 0, col: 1 }
};

const initialSnake: Body[] = [
	{ row: 10, col: 10, hasFood: false },
	{ row: 10, col: 11, hasFood: false },
	{ row: 10, col: 12, hasFood: false },
	{ row: 10, col: 13, hasFood: false }
];

const useInterval = (callback: Function, delay: number | null) => {
	const savedCallback: { current: any } = useRef();

	// Remember the latest function.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current();
		}
		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
};

const App = () => {
	const size = 15;
	const [mode, setMode] = useState<Mode>('Normal');
	const [dead, setDead] = useState(false);
	const [score, setScore] = useState(0);
	const [level, setLevel] = useState(0);
	const [snake, setSnake] = useState(initialSnake);
	const [dir, setDir] = useState<Direction | null>(null);
	const [nextDir, setNextDir] = useState<Direction>(directions.LEFT);
	const [delay, setDelay] = useState(250);
	const [isRunning, setIsRunning] = useState(false);
	const randCoord = (): Coordinate => ({
		row: _.random(1, size, false),
		col: _.random(1, size, false)
	});
	const randFood = () => {
		let newFood: Coordinate = snake[2];
		do {
			newFood = randCoord();
		} while (
			snake.some(body => body.col === newFood.col && body.row === newFood.row)
		);
		return newFood;
	};
	const [food, setFood] = useState(randFood());

	const start = () => {
		setIsRunning(true);
	};
	const pause = () => {
		setIsRunning(false);
	};
	const reset = () => {
		setIsRunning(false);
		setDead(false);
		setSnake(initialSnake);
		setDir(directions.LEFT);
		setNextDir(directions.LEFT);
		setFood(randFood());
		setScore(0);
	};

	const die = () => {
		setDead(true);
		setIsRunning(false);
	};

	const walk = () => {
		setDir(nextDir);
		const head = snake[0];
		if (
			mode == 'Normal' &&
			!(
				_.inRange(head.row + nextDir.row, 1, size + 1) &&
				_.inRange(head.col + nextDir.col, 1, size + 1)
			)
		) {
			die();
			return;
		}

		const newRow = ((head.row + nextDir.row - 1 + size) % size) + 1;
		const newCol = ((head.col + nextDir.col - 1 + size) % size) + 1;
		const willEatFood = food.row === newRow && food.col === newCol;

		const newHead = {
			row: newRow,
			col: newCol,
			hasFood: willEatFood
		};
		if (willEatFood) {
			setFood(randFood());
			setScore(score + 1);
		}

		const newBody = snake.reduce((cells: Body[], cell, index, { length }) => {
			if (index !== length - 1) {
				return [...cells, cell];
			} else if (cell.hasFood) {
				return [...cells, { ...cell, hasFood: false }];
			}
			return cells;
		}, []);

		if (
			newBody.some(body => newHead.col === body.col && newHead.row === body.row)
		) {
			die();

			return;
		}
		setSnake([newHead, ...newBody]);
	};

	const changeDir = (keyCode: number) => {
		if (!isRunning) return;
		switch (keyCode) {
			case 37: //Left
				if (dir !== directions.RIGHT) return setNextDir(directions.LEFT);
				break;
			case 38: //Up
				if (dir !== directions.DOWN) return setNextDir(directions.UP);
				break;
			case 39: //Right
				if (dir !== directions.LEFT) return setNextDir(directions.RIGHT);
				break;
			case 40: //Down
				if (dir !== directions.UP) return setNextDir(directions.DOWN);
				break;
			default:
				break;
		}
		return;
	};

	useInterval(walk, isRunning ? delay : null);

	useEffect(() => {
		// Update level per 5 score
		setLevel(Math.floor(score / 5) + 1);
	}, [score]);

	useEffect(() => {
		// Update speed when level change
		setDelay(Math.round(250 / level));
	}, [level]);

	return (
		<Container onKeyDown={e => changeDir(e.keyCode)} tabIndex={0}>
			<h2>{mode} Snake</h2>
			<MetaBar>
				<span>Level: {level}</span>
				{dead && <span style={{ color: 'red' }}>You Died!</span>}
				<span>Score: {score}</span>
			</MetaBar>
			<SnakeField size={size} mode={mode}>
				{snake.map((cell, index) => (
					<Body key={index} cell={cell} />
				))}
				<Food cell={food} />
			</SnakeField>
			<ButtonBar>
				{mode == 'Normal' ? (
					<button onClick={() => setMode('Infinite')} disabled={isRunning}>
						<h2>Switch to Infinite Mode</h2>
					</button>
				) : (
					<button onClick={() => setMode('Normal')} disabled={isRunning}>
						<h2>Switch to Normal Mode</h2>
					</button>
				)}
			</ButtonBar>
			<ButtonBar>
				<button onClick={start} disabled={isRunning || dead}>
					Start
				</button>
				{/* <button onClick={pause}>Pause</button> */}
				<button onClick={reset} disabled={!isRunning && !dead}>
					Reset
				</button>
			</ButtonBar>
		</Container>
	);
};

export default App;
