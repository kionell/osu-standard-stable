import {
  ControlPointInfo,
  BeatmapDifficultySection,
  DifficultyRange,
  IHitObject,
  IHasDuration,
} from 'osu-classes';

import { StandardHitObject } from './StandardHitObject';
import { StandardEventGenerator } from './StandardEventGenerator';
import { StandardHitWindows } from '../Scoring';

export class Spinner extends StandardHitObject implements IHitObject, IHasDuration {
  /**
   * The RPM required to clear the spinner at ODs [ 0, 5, 10 ].
   */
  private static readonly CLEAR_RPM_RANGE = [90, 150, 225] as const;
  
  /**
   * The RPM required to complete the spinner and receive full score at ODs [ 0, 5, 10 ].
   */
  private static readonly COMPLETE_RPM_RANGE = [250, 380, 430] as const;

  /**
   * The gap between spinner completion and the first bonus-awarding spin.
   */
  private static readonly BONUS_SPINS_GAP = 2;

  /**
   * Spinning doesn't match 1:1 with stable,
   * so let's fudge them easier for the time being.
   * This will be removed soon.
   * @deprecated
   */
  static STABLE_MATCHING_FUDGE = 0.6;

  /**
   * Close to 477rpm.
   * This will be removed soon.
   * @deprecated
   */
  static MAXIMUM_ROTATIONS = 8;

  /**
   * Number of spins required to finish the spinner without miss.
   */
  spinsRequired = 1;

  /**
   * The number of spins required to start receiving bonus score.
   * The first bonus is awarded on this spin count.
   */
  get spinsRequiredForBonus(): number {
    return this.spinsRequired + Spinner.BONUS_SPINS_GAP;
  }

  /**
   * Number of spins available to give bonus, beyond {@link spinsRequired}.
   */
  maximumBonusSpins = 1;

  /**
   * The time at which this spinner ends.
   */
  endTime = 0;

  hitWindows = StandardHitWindows.empty;

  get duration(): number {
    return this.endTime - this.startTime;
  }

  applyDefaultsToSelf(controlPoints: ControlPointInfo, difficulty: BeatmapDifficultySection): void {
    super.applyDefaultsToSelf(controlPoints, difficulty);

    /**
     * The average RPS required over the length of the spinner to clear the spinner.
     */
    const minRps = DifficultyRange.map(difficulty.overallDifficulty, ...Spinner.CLEAR_RPM_RANGE) / 60;

    /**
     * The RPS required over the length of the spinner to receive full score (all normal + bonus ticks).
     */
    const maxRps = DifficultyRange.map(difficulty.overallDifficulty, ...Spinner.COMPLETE_RPM_RANGE) / 60;

    const secondsDuration = this.duration / 1000;

    /**
     * Allow a 0.1ms floating point precision error in the calculation of the duration.
     */
    const DURATION_ERROR = 0.0001 as const;

    this.spinsRequired = Math.trunc(minRps * secondsDuration + DURATION_ERROR);
    this.maximumBonusSpins = Math.trunc(maxRps * secondsDuration + DURATION_ERROR) 
      - this.spinsRequired - Spinner.BONUS_SPINS_GAP;
      
    this.maximumBonusSpins = Math.max(0, this.maximumBonusSpins);
  }

  createNestedHitObjects(): void {
    this.nestedHitObjects = [];

    for (const nested of StandardEventGenerator.generateSpinnerTicks(this)) {
      this.nestedHitObjects.push(nested);
    }
  }

  clone(): this {
    const cloned = super.clone();

    cloned.spinsRequired = this.spinsRequired;
    cloned.maximumBonusSpins = this.maximumBonusSpins;
    cloned.endTime = this.endTime;

    return cloned;
  }
}
