import { DifficultyAttributes, ModBitwise, PerformanceCalculator, Ruleset, ScoreInfo } from 'osu-classes';
import { StandardModCombination } from '../Mods';
import { StandardDifficultyAttributes } from './Attributes/StandardDifficultyAttributes';

export class StandardPerformanceCalculator extends PerformanceCalculator {
  readonly attributes: StandardDifficultyAttributes;

  private _mods: StandardModCombination;

  private _accuracy = 0;
  private _scoreMaxCombo = 0;
  private _countGreat = 0;
  private _countOk = 0;
  private _countMeh = 0;
  private _countMiss = 0;

  private _effectiveMissCount = 0;

  constructor(ruleset: Ruleset, attributes: DifficultyAttributes, score: ScoreInfo) {
    super(ruleset, attributes, score);

    this.attributes = attributes as StandardDifficultyAttributes;
    this._mods = (score?.mods as StandardModCombination) ?? new StandardModCombination();
    this._accuracy = this._score.accuracy;
    this._scoreMaxCombo = this._score.maxCombo;
    this._countGreat = this._score.statistics.great;
    this._countOk = this._score.statistics.ok;
    this._countMeh = this._score.statistics.meh;
    this._countMiss = this._score.statistics.miss;
    this._effectiveMissCount = this._calculateEffectiveMissCount();
  }

  calculate(): number {
    /**
     * This is being adjusted to keep the final pp value scaled around what it used to be when changing things.
     */
    let multiplier = 1.12;

    /**
     * Custom multipliers for NoFail and SpunOut.
     */
    if (this._mods.has(ModBitwise.NoFail)) {
      multiplier *= Math.max(0.90, 1.0 - 0.02 * this._effectiveMissCount);
    }

    if (this._mods.has(ModBitwise.SpunOut)) {
      multiplier *= 1.0 - Math.pow(this.attributes.spinnerCount / this._totalHits, 0.85);
    }

    if (this._mods.has(ModBitwise.Relax)) {
      /**
       * As we're adding Oks and Mehs to an approximated number of combo breaks 
       * the result can be higher than total hits in specific scenarios 
       * (which breaks some calculations) so we need to clamp it.
       */
      const counts = this._effectiveMissCount + this._countOk + this._countMeh;

      this._effectiveMissCount = Math.min(counts, this._totalHits);

      multiplier *= 0.6;
    }

    const aimValue = this._computeAimValue();
    const speedValue = this._computeSpeedValue();
    const accuracyValue = this._computeAccuracyValue();
    const flashlightValue = this._computeFlashlightValue();

    const totalValue = Math.pow(
      Math.pow(aimValue, 1.1) +
      Math.pow(speedValue, 1.1) +
      Math.pow(accuracyValue, 1.1) +
      Math.pow(flashlightValue, 1.1), 1.0 / 1.1,
    ) * multiplier;

    return totalValue;
  }

  private _computeAimValue(): number {
    let rawAim = this.attributes.aimStrain;

    if (this._mods.has(ModBitwise.TouchDevice)) {
      rawAim = Math.pow(rawAim, 0.8);
    }

    let aimValue = Math.pow(5.0 * Math.max(1.0, rawAim / 0.0675) - 4.0, 3.0) / 100000.0;

    /**
     * Longer maps are worth more.
     */
    const lengthBonus = 0.95 + 0.4 * Math.min(1.0, this._totalHits / 2000.0)
      + (this._totalHits > 2000 ? Math.log10(this._totalHits / 2000.0) * 0.5 : 0.0);

    aimValue *= lengthBonus;

    /**
     * Penalize misses by assessing # of misses relative to the total # of objects. 
     * Default a 3% reduction for any # of misses.
     */
    if (this._effectiveMissCount > 0) {
      const pow = Math.pow(this._effectiveMissCount / this._totalHits, 0.775);

      aimValue *= 0.97 * Math.pow(1 - pow, this._effectiveMissCount);
    }

    /**
     * Combo scaling.
     */
    if (this.attributes.maxCombo > 0) {
      const pow1 = Math.pow(this._scoreMaxCombo, 0.8);
      const pow2 = Math.pow(this.attributes.maxCombo, 0.8);

      aimValue *= Math.min(pow1 / pow2, 1.0);
    }

    let approachRateFactor = 0.0;

    if (this.attributes.approachRate > 10.33) {
      approachRateFactor = 0.3 * (this.attributes.approachRate - 10.33);
    }
    else if (this.attributes.approachRate < 8.0) {
      approachRateFactor = 0.1 * (8.0 - this.attributes.approachRate);
    }

    /**
     * Buff for longer maps with high AR.
     */
    aimValue *= 1.0 + approachRateFactor * lengthBonus;

    if (this._mods.has(ModBitwise.Hidden)) {
      /**
       * We want to give more reward for lower AR when it comes to aim and HD. 
       * This nerfs high AR and buffs lower AR.
       */
      aimValue *= 1.0 + 0.04 * (12.0 - this.attributes.approachRate);
    }

    /**
     * We assume 15% of sliders in a map are difficult 
     * since there's no way to tell from the performance calculator.
     */
    const estimateDifficultSliders = this.attributes.sliderCount * 0.15;

    if (this.attributes.sliderCount > 0) {
      const counts = this._countOk + this._countMeh + this._countMiss;
      const maxCombo = this.attributes.maxCombo - this._scoreMaxCombo;
      const min = Math.min(counts, maxCombo);

      const estimateSliderEndsDropped = Math.min(Math.max(min, 0), estimateDifficultSliders);
      const pow = Math.pow(1 - estimateSliderEndsDropped / estimateDifficultSliders, 3);
      const sliderNerfFactor = (1 - this.attributes.sliderFactor) * pow + this.attributes.sliderFactor;

      aimValue *= sliderNerfFactor;
    }

    aimValue *= this._accuracy;

    /**
     * It is important to also consider accuracy difficulty when doing that.
     */
    aimValue *= 0.98 + Math.pow(this.attributes.overallDifficulty, 2) / 2500;

    return aimValue;
  }

  private _computeSpeedValue(): number {
    const max = Math.max(1.0, this.attributes.speedStrain / 0.0675);
    let speedValue = Math.pow(5.0 * max - 4.0, 3.0) / 100000.0;

    /**
     * Longer maps are worth more.
     */
    const lengthBonus = 0.95 + 0.4 * Math.min(1.0, this._totalHits / 2000.0)
      + (this._totalHits > 2000 ? Math.log10(this._totalHits / 2000.0) * 0.5 : 0.0);

    speedValue *= lengthBonus;

    /**
     * Penalize misses by assessing # of misses relative to the total # of objects. 
     * Default a 3% reduction for any # of misses.
     */
    if (this._effectiveMissCount > 0) {
      const pow = Math.pow(this._effectiveMissCount / this._totalHits, 0.775);

      speedValue *= 0.97 * Math.pow(1 - pow, Math.pow(this._effectiveMissCount, 0.875));
    }

    /**
     * Combo scaling.
     */
    if (this.attributes.maxCombo > 0) {
      const pow1 = Math.pow(this._scoreMaxCombo, 0.8);
      const pow2 = Math.pow(this.attributes.maxCombo, 0.8);

      speedValue *= Math.min(pow1 / pow2, 1.0);
    }

    let approachRateFactor = 0;

    if (this.attributes.approachRate > 10.33) {
      approachRateFactor = 0.3 * (this.attributes.approachRate - 10.33);
    }

    /**
     * Buff for longer maps with high AR.
     */
    speedValue *= 1.0 + approachRateFactor * lengthBonus;

    if (this._mods.has(ModBitwise.Hidden)) {
      /**
       * We want to give more reward for lower AR when it comes to aim and HD. 
       * This nerfs high AR and buffs lower AR.
       */
      speedValue *= 1.0 + 0.04 * (12.0 - this.attributes.approachRate);
    }

    /**
     * Scale the speed value with accuracy and OD.
     */
    const pow1 = Math.pow(this.attributes.overallDifficulty, 2) / 750;
    const max2 = Math.max(this.attributes.overallDifficulty, 8);
    const pow2 = Math.pow(this._accuracy, (14.5 - max2) / 2);

    speedValue *= (0.95 + pow1) * pow2;

    /**
     * Scale the speed value with # of 50s to punish doubletapping.
     */
    let counts50 = 0;

    if (this._countMeh >= this._totalHits / 500.0) {
      counts50 = this._countMeh - this._totalHits / 500.0;
    }

    speedValue *= Math.pow(0.98, counts50);

    return speedValue;
  }

  private _computeAccuracyValue() {
    if (this._mods.has(ModBitwise.Relax)) {
      return 0.0;
    }

    /**
     * This percentage only considers HitCircles of any value - in this part 
     * of the calculation we focus on hitting the timing hit window.
     */
    let betterAccuracyPercentage = 0;
    const amountHitObjectsWithAccuracy = this.attributes.hitCircleCount;

    if (amountHitObjectsWithAccuracy > 0) {
      const greats = this._countGreat - (this._totalHits - amountHitObjectsWithAccuracy);

      betterAccuracyPercentage = greats * 6 + this._countOk * 2 + this._countMeh;
      betterAccuracyPercentage /= amountHitObjectsWithAccuracy * 6;
    }

    /**
     * It is possible to reach a negative accuracy with this formula. 
     * Cap it at zero - zero points.
     */
    betterAccuracyPercentage = Math.max(0, betterAccuracyPercentage);

    /**
     * Lots of arbitrary values from testing.
     * Considering to use derivation from perfect accuracy 
     * in a probabilistic manner - assume normal distribution.
     */
    let accuracyValue = Math.pow(1.52163, this.attributes.overallDifficulty)
      * Math.pow(betterAccuracyPercentage, 24) * 2.83;

    /**
     * Bonus for many hitcircles - it's harder to keep good accuracy up for longer.
     */
    accuracyValue *= Math.min(1.15, Math.pow(amountHitObjectsWithAccuracy / 1000.0, 0.3));

    if (this._mods.has(ModBitwise.Hidden)) {
      accuracyValue *= 1.08;
    }

    if (this._mods.has(ModBitwise.Flashlight)) {
      accuracyValue *= 1.02;
    }

    return accuracyValue;
  }

  private _computeFlashlightValue(): number {
    if (!this._mods.has(ModBitwise.Flashlight)) {
      return 0.0;
    }

    let rawFlashlight = this.attributes.flashlightRating;

    if (this._mods.has(ModBitwise.TouchDevice)) {
      rawFlashlight = Math.pow(rawFlashlight, 0.8);
    }

    let flashlightValue = Math.pow(rawFlashlight, 2.0) * 25.0;

    /**
     * Add an additional bonus for HDFL.
     */
    if (this._mods.has(ModBitwise.Hidden)) {
      flashlightValue *= 1.3;
    }

    /**
     * Penalize misses by assessing # of misses relative to the total # of objects. 
     * Default a 3% reduction for any # of misses.
     */
    if (this._effectiveMissCount > 0) {
      const pow1 = Math.pow(this._effectiveMissCount / this._totalHits, 0.775);
      const pow2 = Math.pow(this._effectiveMissCount, 0.875);

      flashlightValue *= 0.97 * Math.pow(1 - pow1, pow2);
    }

    /**
     * Combo scaling.
     */
    if (this.attributes.maxCombo > 0) {
      const pow1 = Math.pow(this._scoreMaxCombo, 0.8);
      const pow2 = Math.pow(this.attributes.maxCombo, 0.8);

      flashlightValue *= Math.min(pow1 / pow2, 1.0);
    }

    /**
     * Account for shorter maps having a higher ratio of 0 combo/100 combo flashlight radius.
     */
    flashlightValue *= 0.7 + 0.1 * Math.min(1.0, this._totalHits / 200.0)
      + (this._totalHits > 200 ? 0.2 * Math.min(1.0, (this._totalHits - 200) / 200.0) : 0.0);

    /**
     * Scale the flashlight value with accuracy "slightly".
     */
    flashlightValue *= 0.5 + this._accuracy / 2.0;

    /**
     * It is important to also consider accuracy difficulty when doing that.
     */
    flashlightValue *= 0.98 + Math.pow(this.attributes.overallDifficulty, 2) / 2500;

    return flashlightValue;
  }

  private _calculateEffectiveMissCount() {
    /**
     * Guess the number of misses + slider breaks from combo.
     */
    let comboBasedMissCount = 0;

    if (this.attributes.sliderCount > 0) {
      const fullComboThreshold = this.attributes.maxCombo - 0.1 * this.attributes.sliderCount;

      if (this._scoreMaxCombo < fullComboThreshold) {
        comboBasedMissCount = fullComboThreshold / Math.max(1.0, this._scoreMaxCombo);
      }
    }

    /**
     * Clamp misscount since it's derived from combo and can be higher 
     * than total hits and that breaks some calculations.
     */
    comboBasedMissCount = Math.min(comboBasedMissCount, this._totalHits);

    return Math.max(this._countMiss, Math.floor(comboBasedMissCount));
  }

  private get _totalHits(): number {
    return this._countGreat + this._countOk + this._countMeh + this._countMiss;
  }
}