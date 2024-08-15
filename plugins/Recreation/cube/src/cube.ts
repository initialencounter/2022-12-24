import { getNativeBinding } from '../utils'
import envPaths from './envPath';
import { join } from 'path';
import { existsSync } from 'fs';

const version = '0.2.2'
const { platform, arch } = process

export declare class CubeCore {
  constructor()
  rotate(operations: string): void
  getStartTime(): number
  reset(): void
  getCube(): number[][][]
  getLastStep(): string
  scramble(steps: number): void
  getSvgBase64Png(): string
  getSvg(): string
  isSolved(): boolean
}

const [moduleName, _] = getNativeBinding(platform, arch);
const storingDir = join(envPaths('initencounter_cube').data, version);
const storingPath = join(storingDir, moduleName);
if (!existsSync(storingPath)){
  throw new Error('Cube native module not found: ' + storingPath);
}
export const Cube: CubeCore = require(storingPath).CubeCore
