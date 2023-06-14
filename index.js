const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;

const rows = 10;
const columns = 22;

const unitWidth = width / columns;
const unitHeight = height / rows;
const smallerUnit = Math.min(unitWidth, unitHeight);

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine,
	options: {
		wireframes: false,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze Generation
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	};

	return arr;
};

const grid = Array(rows).fill(null).map(() => Array(columns).fill(false));

const verticals = Array(rows).fill(null).map(() => Array(columns - 1).fill(false));
const horizontals = Array(rows - 1).fill(null).map(() => Array(columns).fill(false));

const startRow = Math.floor(Math.random() * rows);
const startColumn = Math.floor(Math.random() * columns);

const stepThroughCell = (row, column) => {
	if (grid[row][column]) {
		return;
	};

	grid[row][column] = true;

	const neighbours = shuffle([
		[row - 1, column, 'up'],
		[row, column + 1, 'right'],
		[row + 1, column, 'down'],
		[row, column - 1, 'left']
	]);

	for (let neighbour of neighbours) {
		const [nextRow, nextColumn, direction] = neighbour;

		// Check if this neighbour is out of bounds
		if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= columns) {
			continue;
		};

		// Check if we already visited this neighbour
		if (grid[nextRow][nextColumn]) {
			continue;
		};

		// Remove wall
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		};

		stepThroughCell(nextRow, nextColumn);
	};
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			(columnIndex + 0.5) * unitWidth,
			(rowIndex + 1) * unitHeight,
			unitWidth,
			5,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: 'red'
				}
			}
		);

		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			(columnIndex + 1) * unitWidth,
			(rowIndex + 0.5) * unitHeight,
			5,
			unitHeight,
			{
				isStatic: true,
				label: 'wall',
				render: {
					fillStyle: 'red'
				}
			}
		);

		World.add(world, wall);
	});
});

// Goal
const goal = Bodies.rectangle(
	width - unitWidth / 2,
	height - unitHeight / 2,
	smallerUnit * 0.7,
	smallerUnit * 0.7,
	{
		isStatic: true,
		label: 'goal',
		render: {
			fillStyle: 'green'
		}
	}
);

World.add(world, goal);

// Ball
const ball = Bodies.circle(
	unitWidth / 2,
	unitHeight / 2,
	smallerUnit / 2 * 0.7,
	{
		label: 'ball',
		render: {
			fillStyle: 'blue'
		}
	}
);

World.add(world, ball);

document.addEventListener('keydown', event => {
	const { x, y } = ball.velocity;

	if (event.key === 'w' || event.key === 'ArrowUp') {
		Body.setVelocity(ball, { x, y: y - 5 });
	};
	
	if (event.key === 'a' || event.key === 'ArrowLeft') {
		Body.setVelocity(ball, { x: x - 5, y });
	};
	
	if (event.key === 's' || event.key === 'ArrowDown') {
		Body.setVelocity(ball, { x, y: y + 5 });
	};
	
	if (event.key === 'd' || event.key === 'ArrowRight') {
		Body.setVelocity(ball, { x: x + 5, y });
	};
});

// Win condition
Events.on(engine, 'collisionStart', event => {
	event.pairs.forEach(collision => {
		const labels = ['ball', 'goal'];

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			document.querySelector('.winner').classList.remove('hidden');
			world.gravity.y = 1;
			world.bodies.forEach(body => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				};
			});
		};
	});
});