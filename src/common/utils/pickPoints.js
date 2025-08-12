import { randomInt } from 'crypto';

const DEFAULT_POLICY = {
  jackpotProb: 0.001, // 0.1%
  jackpotPoints: 100_000,
  goldProb: 0.2, // 20%
  goldRange: { min: 1_000, max: 10_000 },
  silverRange: { min: 100, max: 900 },
};

function toThresholds({ jackpotProb, goldProb }) {
  const M = 1_000_000;

  if (jackpotProb < 0 || goldProb < 0 || jackpotProb + goldProb > 1) {
    throw new Error('Invalid probabilities: jackpotProb + goldProb must be <= 1 and non-negative.');
  }

  const jp = Math.round(jackpotProb * M);
  let gp = Math.round(goldProb * M);
  if (jp + gp > M) gp = M - jp; // 라운딩 엣지 클램프

  return { jackpotUpto: jp, goldUpto: jp + gp, M };
}

function randInRangeHundreds(min, max) {
  const effMin = Math.ceil(min / 100) * 100;
  const effMax = Math.floor(max / 100) * 100;
  if (effMin > effMax) {
    throw new Error(`Range cannot be aligned to 100s: [${min}, ${max}]`);
  }
  const steps = (effMax - effMin) / 100 + 1;
  const idx = randomInt(0, steps);
  return effMin + idx * 100;
}

function randInRange(min, max) {
  return randomInt(min, max + 1);
}

/**
 * 포인트 뽑기
 * @param {Partial<typeof DEFAULT_POLICY>} policy - 확률/범위를 덮어쓰기
 * @returns {number} 지급 포인트 금액(숫자만 반환)
 *
 * // 테스트 예시
 * pickPoints();                                   // 기본 확률
 * pickPoints({ jackpotProb: 0, goldProb: 1.0 });  // 골드 100%
 * pickPoints({ jackpotProb: 1.0, goldProb: 0 });  // 잭팟 100%
 * pickPoints({ jackpotProb: 0, goldProb: 0 });    // 실버 100%
 */
export function pickPoints(policy = {}) {
  const cfg = { ...DEFAULT_POLICY, ...policy };
  const { jackpotUpto, goldUpto, M } = toThresholds(cfg);
  const roll = randomInt(1, M + 1);

  if (roll <= jackpotUpto) {
    return cfg.jackpotPoints;
  }
  if (roll <= goldUpto) {
    return randInRangeHundreds(cfg.goldRange.min, cfg.goldRange.max);
  }

  return randInRangeHundreds(cfg.silverRange.min, cfg.silverRange.max);
}
