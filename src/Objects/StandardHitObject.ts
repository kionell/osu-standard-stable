import {
  ControlPointInfo,
  BeatmapDifficultySection,
  Vector2,
  HitObject,
  IHasPosition,
  IHasComboInformation,
  HitWindows,
  DifficultyRange,
} from 'osu-classes';

import { StandardHitWindows } from '../Scoring';

export abstract class StandardHitObject extends HitObject implements IHasPosition, IHasComboInformation {
  /**
   * The radius of hit objects (ie. the radius of a Circle).
   */
  static OBJECT_RADIUS = 64;

  /**
   * Scoring distance with a speed-adjusted beat length of 1 second
   * (ie. the speed slider balls move through their track).
   */
  static BASE_SCORING_DISTANCE = 100;

  /**
   * Minimum preempt time at AR=10.
   */
  static PREEMPT_MIN = 450;

  timePreempt: number;
  timeFadeIn: number;

  hitWindows: HitWindows = new StandardHitWindows();

  isNewCombo = false;
  comboOffset = 0;
  currentComboIndex = 0;
  comboIndex = 0;
  comboIndexWithOffsets = 0;
  lastInCombo = false;

  constructor(options?: Partial<StandardHitObject>) {
    super(options);

    this.timePreempt = options?.timePreempt ?? 600;
    this.timeFadeIn = options?.timeFadeIn ?? 400;
    this.isNewCombo = options?.isNewCombo ?? false;
    this.comboOffset = options?.comboOffset ?? 0;
    this.currentComboIndex = options?.currentComboIndex ?? 0;
    this.comboIndex = options?.comboIndex ?? 0;
    this.comboIndexWithOffsets = options?.comboIndexWithOffsets ?? 0;
    this.lastInCombo = options?.lastInCombo ?? false;
    this.stackHeight = options?.stackHeight ?? 0;
    this.scale = options?.scale ?? 0.5;
  }

  get stackedStartPosition(): Vector2 {
    return this.startPosition.add(this.stackedOffset);
  }

  get endPosition(): Vector2 {
    return this.startPosition;
  }

  get endX(): number {
    return this.endPosition.x;
  }

  set endX(value: number) {
    this.endPosition.x = value;
  }

  get endY(): number {
    return this.endPosition.y;
  }

  set endY(value: number) {
    this.endPosition.y = value;
  }

  get stackedEndPosition(): Vector2 {
    return this.endPosition.add(this.stackedOffset);
  }

  private _stackHeight = 0;

  get stackHeight(): number {
    return this._stackHeight;
  }

  set stackHeight(value: number) {
    this._stackHeight = value;

    const stackOffset = Math.fround(
      Math.fround(this._stackHeight * this._scale) * Math.fround(-6.4),
    );

    this._stackOffset.x = this._stackOffset.y = stackOffset;

    this.nestedHitObjects.forEach((n) => {
      (n as StandardHitObject).stackHeight = this._stackHeight;
    });
  }

  private _stackOffset = new Vector2(0, 0);

  /**
   * Use {@link stackOffset} instead.
   * @deprecated
   */
  get stackedOffset(): Vector2 {
    return this.stackOffset;
  }

  /**
   * @deprecated
   */
  set stackedOffset(value: Vector2) {
    this.stackOffset = value;
  }

  get stackOffset(): Vector2 {
    return this._stackOffset;
  }

  set stackOffset(value: Vector2) {
    this._stackOffset = value;
  }

  get radius(): number {
    return StandardHitObject.OBJECT_RADIUS * this._scale;
  }

  private _scale = 0.5;

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = value;

    const stackOffset = Math.fround(
      Math.fround(this._stackHeight * this._scale) * Math.fround(-6.4),
    );

    this._stackOffset.x = this._stackOffset.y = stackOffset;
  }

  applyDefaultsToSelf(controlPoints: ControlPointInfo, difficulty: BeatmapDifficultySection): void {
    super.applyDefaultsToSelf(controlPoints, difficulty);

    this.timePreempt = Math.fround(
      DifficultyRange.map(difficulty.approachRate, 1800, 1200, 450),
    );

    this.timeFadeIn = 400 * Math.min(1, this.timePreempt / StandardHitObject.PREEMPT_MIN);

    /**
     * Closest approximation:
     * 23.0400009155273 + (7 - CS) * 4.47999954223635
     */
    const scale = Math.fround(Math.fround(0.7) * Math.fround(difficulty.circleSize - 5));

    /**
     * TODO: This should be revisited with the next rebalance deployment.
     * Current scale calculation lacks an optional fudge that was present in the osu!stable.
     * That difference can potentially lead to errors in the difficulty calculation.
     */
    this.scale = Math.fround(Math.fround(1 - Math.fround(scale / 5)) / 2);
  }

  /**
   * Creates a deep copy of this standard hit object.
   * @returns Cloned standard hit object.
   */
  clone(): this {
    const cloned = super.clone();

    cloned.timePreempt = this.timePreempt;
    cloned.timeFadeIn = this.timeFadeIn;
    cloned.stackHeight = this.stackHeight;
    cloned.scale = this.scale;
    cloned.isNewCombo = this.isNewCombo;
    cloned.comboOffset = this.comboOffset;
    cloned.currentComboIndex = this.currentComboIndex;
    cloned.comboIndex = this.comboIndex;
    cloned.comboIndexWithOffsets = this.comboIndexWithOffsets;
    cloned.lastInCombo = this.lastInCombo;

    return cloned;
  }
}
