import {
  ControlPointInfo,
  BeatmapDifficultySection,
  Vector2,
  SliderPath,
  HitSample,
  IHitObject,
  IHasPathWithRepeats,
  IHasGenerateTicks,
  IHasSliderVelocity,
} from 'osu-classes';

import { StandardEventGenerator } from './StandardEventGenerator';
import { StandardHitObject } from './StandardHitObject';
import { SliderHead } from './SliderHead';
import { SliderTail } from './SliderTail';
import { StandardHitWindows } from '../Scoring';
import { SliderTick } from './SliderTick';
import { SliderRepeat } from './SliderRepeat';

export class Slider extends StandardHitObject
  implements IHitObject, IHasPathWithRepeats, IHasSliderVelocity, IHasGenerateTicks {

  /**
   * This is obsolete and will be removed soon.
   * @deprecated
   */
  legacyLastTickOffset?: number;

  nestedHitObjects: StandardHitObject[] = [];

  hitWindows = StandardHitWindows.EMPTY;

  startPosition: Vector2 = new Vector2(0, 0);

  constructor(options?: Partial<Slider>) {
    super(options);

    if (typeof options?.legacyLastTickOffset === 'number') {
      this.legacyLastTickOffset = options.legacyLastTickOffset;
    }

    this.path = options?.path ?? new SliderPath();

    if (options?.lazyEndPosition) {
      this.lazyEndPosition = options.lazyEndPosition;
    }

    this.lazyTravelDistance = options?.lazyTravelDistance ?? 0;
    this.lazyTravelTime = options?.lazyTravelTime ?? 0;
    this.nodeSamples = options?.nodeSamples ?? [];
    this.tailSamples = options?.tailSamples ?? [];
    this._repeats = options?.repeats ?? 0;
    this.velocity = options?.velocity ?? 1;
    this.tickDistance = options?.tickDistance ?? 0;
    this.tickDistanceMultiplier = options?.tickDistanceMultiplier ?? 1;
    this.sliderVelocity = options?.sliderVelocity ?? 1;
    this.generateTicks = options?.generateTicks ?? true;
  }

  get startX(): number {
    this._updateHeadPosition();

    return this.startPosition.x;
  }

  set startX(value: number) {
    this.startPosition.x = value;
    this._updateHeadPosition();
  }

  get startY(): number {
    this._updateHeadPosition();

    return this.startPosition.y;
  }

  set startY(value: number) {
    this.startPosition.y = value;
    this._updateHeadPosition();
  }

  get endX(): number {
    this._updateTailPosition();

    return this.endPosition.x;
  }

  set endX(value: number) {
    this.endPosition.x = value;
    this._updateTailPosition();
  }

  get endY(): number {
    this._updateTailPosition();

    return this.endPosition.y;
  }

  set endY(value: number) {
    this.endPosition.y = value;
    this._updateTailPosition();
  }

  get endTime(): number {
    return this.startTime + this.spans * this.distance / this.velocity;
  }

  get duration(): number {
    return this.endTime - this.startTime;
  }

  get endPosition(): Vector2 {
    return this.startPosition.add(this.path.curvePositionAt(1, this.spans));
  }

  path: SliderPath = new SliderPath();

  get distance(): number {
    return this.path.distance;
  }

  set distance(value: number) {
    this.path.distance = value;
  }

  /**
   * The position of the cursor at the point of completion of this slider if it was hit
   * with as few movements as possible. This is set and used by difficulty calculation.
   */
  lazyEndPosition?: Vector2;

  /**
   * The distance travelled by the cursor upon completion of this slider if it was hit
   * with as few movements as possible. This is set and used by difficulty calculation.
   */
  lazyTravelDistance: number;

  /**
   * The time taken by the cursor upon completion of this slider if it was hit
   * with as few movements as possible. This is set and used by difficulty calculation.
   */
  lazyTravelTime: number;

  nodeSamples: HitSample[][];

  /**
   * The samples to be played when the slider tail is reached.
   * Because of the legacy last tick these samples can't be attached to the slider tail
   * otherwise they would play earlier than they're intended to.
   * 
   * For now, the samples are played by the slider itself at the correct end time.
   */
  tailSamples: HitSample[];

  private _repeats: number;

  get repeats(): number {
    return this._repeats;
  }

  set repeats(value: number) {
    this._repeats = value;
    this._updateHeadPosition();
    this._updateTailPosition();
  }

  get spans(): number {
    return this.repeats + 1;
  }

  get spanDuration(): number {
    return this.duration / this.spans;
  }

  /**
   * The computed velocity of this {@link Slider}.
   * This is the amount of path distance travelled in 1 ms.
   */
  velocity: number;

  /**
   * Spacing between {@link SliderTick}s of this {@link Slider}.
   */
  tickDistance: number;

  /**
   * Use {@link tickDistanceMultiplier} instead.
   * @deprecated
   */
  get tickRate(): number {
    return this.tickDistanceMultiplier;
  }

  /**
   * @deprecated
   */
  set tickRate(value: number) {
    this.tickDistanceMultiplier = value;
  }

  /**
   * An extra multiplier that affects the number of {@link SliderTick}s 
   * generated by this {@link Slider}.
   * An increase in this value increases {@link tickDistance}, 
   * which reduces the number of ticks generated.
   */
  tickDistanceMultiplier: number;

  sliderVelocity: number;
  generateTicks: boolean;

  get head(): SliderHead | null {
    const obj = this.nestedHitObjects.find((n) => n instanceof SliderHead);

    return obj as SliderHead || null;
  }

  get tail(): SliderTail | null {
    const obj = this.nestedHitObjects.find((n) => n instanceof SliderTail);

    return obj as SliderTail || null;
  }

  applyDefaultsToSelf(controlPoints: ControlPointInfo, difficulty: BeatmapDifficultySection): void {
    super.applyDefaultsToSelf(controlPoints, difficulty);

    const timingPoint = controlPoints.timingPointAt(this.startTime);

    /**
     * TODO: This should be revisited with the next rebalance deployment.
     * osu!lazer intentionally introduces floating point errors to match osu!stable.
     */
    const scoringDistance = StandardHitObject.BASE_SCORING_DISTANCE
      * difficulty.sliderMultiplier * this.sliderVelocity;

    this.velocity = scoringDistance / timingPoint.beatLength;
    this.tickDistance = this.generateTicks
      ? scoringDistance / difficulty.sliderTickRate * this.tickDistanceMultiplier
      : Infinity;
  }

  createNestedHitObjects(): void {
    this.nestedHitObjects = [];

    for (const nested of StandardEventGenerator.generateSliderTicks(this)) {
      this.nestedHitObjects.push(nested);
    }

    this._updateNestedSamples();
  }

  /**
   * Retrieves the samples at a particular node in a {@link Slider}.
   * @param nodeIndex The node to attempt to retrieve the samples at.
   * @returns The samples at the given node index, or default samples 
   * of this object if the given node doesn't exist.
   */
  getNodeSamples(nodeIndex: number): HitSample[] {
    return nodeIndex < this.nodeSamples.length
      ? this.nodeSamples[nodeIndex]
      : this.samples;
  }

  protected _updateNestedSamples(): void {
    const foundSample = this.samples.find((sample) => {
      return sample.name === HitSample.HIT_NORMAL;
    });

    /**
     * TODO: remove this when guaranteed sort is present for samples
     * (https://github.com/ppy/osu/issues/1933)
     */
    const firstSample = foundSample ?? this.samples[0] ?? null;

    const sampleList: HitSample[] = [];

    if (firstSample !== null) {
      sampleList.push(firstSample.with({ name: 'slidertick' }));
    }

    this.nestedHitObjects.forEach((nested) => {
      if (nested instanceof SliderTick) {
        nested.samples = sampleList;
      }

      if (nested instanceof SliderRepeat) {
        nested.samples = this.getNodeSamples(nested.repeatIndex + 1);
      }
    });

    if (this.head !== null) {
      this.head.samples = this.getNodeSamples(0);
    }

    this.tailSamples = this.getNodeSamples(this.repeats + 1);
  }

  private _updateHeadPosition(): void {
    if (this.head !== null) {
      this.head.startPosition = this.startPosition;
    }
  }

  private _updateTailPosition(): void {
    if (this.tail !== null) {
      this.tail.startPosition = this.endPosition;
    }
  }

  /**
   * Creates a deep copy of this slider.
   * @returns Cloned slider.
   */
  clone(): this {
    const cloned = super.clone();

    if (typeof this?.legacyLastTickOffset === 'number') {
      cloned.legacyLastTickOffset = this.legacyLastTickOffset;
    }

    if (this?.lazyEndPosition) {
      cloned.lazyEndPosition = this.lazyEndPosition;
    }

    cloned.lazyTravelDistance = this.lazyTravelDistance;
    cloned.lazyTravelTime = this.lazyTravelTime;
    cloned.path = this.path.clone();
    cloned.nodeSamples = this.nodeSamples.map((n) => n.map((s) => s.clone()));
    cloned.tailSamples = this.tailSamples;
    cloned.repeats = this.repeats;
    cloned.velocity = this.velocity;
    cloned.tickDistance = this.tickDistance;
    cloned.tickDistanceMultiplier = this.tickDistanceMultiplier;
    cloned.sliderVelocity = this.sliderVelocity;
    cloned.generateTicks = this.generateTicks;

    return cloned;
  }
}
