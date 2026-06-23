export const GRID = { COLS: 16, ROWS: 19 };

export const CELL_PX = 32;
export const WALL_PX = 32;

export const BLOCK_ROWS = 5;
export const TOP_WALL_ROWS = 2;
export const BLOCK_GAP_ROWS = 1;
export const BLOCK_START_ROW = TOP_WALL_ROWS + BLOCK_GAP_ROWS;
export const BLOCK_ROW_COLORS = [
  'RedBlock',
  'BrownBlock',
  'YellowBlock',
  'GreenBlock',
  'BlueBlock',
];

export const WHITE_BLOCK = 'WhiteBlock';

export const CANVAS_WIDTH = GRID.COLS * CELL_PX + WALL_PX * 2;
export const CANVAS_HEIGHT = GRID.ROWS * CELL_PX + WALL_PX;

export const PLAYFIELD_LEFT = WALL_PX;
export const PLAYFIELD_TOP = 0;
export const PLAYFIELD_WIDTH = GRID.COLS * CELL_PX;
export const PLAYFIELD_HEIGHT = GRID.ROWS * CELL_PX;
export const PLAYFIELD_RIGHT = PLAYFIELD_LEFT + PLAYFIELD_WIDTH;
export const PLAYFIELD_BOTTOM = PLAYFIELD_TOP + PLAYFIELD_HEIGHT;

export const ASSET_PATH = 'art/';
export const AUDIO_PATH = 'audio/';
export const MUSIC = {
  FILE: 'music.mp3',
  VOLUME: 0.05,
};
export const SPRITE_NAMES = [
  'Walls',
  'Ball',
  'Paddle_Left',
  'Paddle_Center',
  ...BLOCK_ROW_COLORS,
  'PurpleBlock',
  'WhiteBlock',
];

export const PADDLE = {
  END_WIDTH: 24,
  CENTER_TILE_WIDTH: 96,
  CENTER_TILES: 0,
  WIDTH: 100,
  HEIGHT: 20,
  SPEED: 420,
  ROWS_FROM_BOTTOM: 1,
  HIT_SHAKE: {
    AMPLITUDE_PX: 10,
    DURATION_MS: 120,
    MAX_ROTATION_RAD: 0.12,
  },
};

export const BALL = {
  SIZE: 16,
  RADIUS: 8,
  SPEED: 320,
  LAUNCH_ANGLE: -Math.PI / 2 + 0.25,
  BLOCK_HIT_SPEED_BOOST: 0.1,
  TRAIL_LENGTH: 80,
};

export const BLOCK_SPEED_BY_TYPE = Object.fromEntries(
  BLOCK_ROW_COLORS.map((type, index) => {
    const tier = BLOCK_ROW_COLORS.length - index;
    return [type, Math.round(BALL.SPEED * (1 + BALL.BLOCK_HIT_SPEED_BOOST * tier))];
  }),
);

export const BLOOM = {
  BLUR_PX: 10,
  INTENSITY: 1.5,
};

export const JUICE = {
  BLOCK_CLEAR: {
    FLASH_MS: 120,
    FLASH_INTERVAL_MS: 40,
    REMOVE_DELAY_MS: 80,
  },
  SHAKE: {
    DURATION_MS: 180,
    AMPLITUDE: 4,
  },
  PARTICLES: {
    COUNT: 6,
    SPEED: 140,
    LIFE_MS: 350,
    SIZE: 3,
  },
  SFX: {
    WALL: { GAIN: 0.11, DURATION: 0.11 },
    PADDLE: { GAIN: 0.16, DURATION: 0.1 },
  },
};

export const BLOCK_TINTS = {
  RedBlock: '#c44',
  BrownBlock: '#a65',
  YellowBlock: '#ca4',
  GreenBlock: '#4a4',
  BlueBlock: '#48c',
  PurpleBlock: '#84c',
  WhiteBlock: '#ccc',
};

export const UI = {
  TITLE: 'Breakout',
  SUBTITLE: 'A Classic',
};

export const COLORS = {
  OVERLAY_BG: 'rgba(0, 0, 0, 0.55)',
  TEXT: '#ffffff',
  PARTICLE_WALL: '#888888',
  PARTICLE_PADDLE: '#555555',
  BALL_TRAIL: '58, 58, 58',
};

export const LIVES = {
  START: 3,
};

export const SCORE = {
  BY_BLOCK_TYPE: {
    RedBlock: 50,
    BrownBlock: 40,
    YellowBlock: 30,
    GreenBlock: 20,
    BlueBlock: 10,
  },
};

export const LIFE_LOST = {
  FREEZE_MS: 450,
  RED_FLASH_MS: 450,
  SHAKE_DURATION_MS: 450,
  SHAKE_AMPLITUDE: 9,
  POPUP_HOLD_MS: 450,
  POPUP_ANIM_MS: 500,
  POPUP_MS: 1400,
};

export const GAME_STATE = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  LIFE_LOST: 'LIFE_LOST',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER',
};

export const INPUT_MODE = {
  KEYBOARD: 'keyboard',
  POINTER: 'pointer',
};

export const INPUT_KEYS = {
  LEFT: ['ArrowLeft'],
  RIGHT: ['ArrowRight'],
  LAUNCH: [' ', 'Enter'],
  RESTART: ['r', 'R'],
};

export const OVERLAY_TEXT = {
  READY: 'Press Space or Click to Launch',
  VICTORY: 'You Win! Press R to Restart',
  GAME_OVER: 'Game Over — Press R to Restart',
};
