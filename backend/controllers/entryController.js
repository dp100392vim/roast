const Entry = require('../models/Entry');

exports.names = async (req, res) => {
    try {
        const names = await Entry.distinct('name');

        res.status(201).json(names);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Функция сохранения записи
exports.add = async (req, res) => {
    try {
        const { basic, start, middle, crack, end } = req.body;

        // Создаем новую запись с правильной структурой
        const newEntry = new Entry({
            type: basic.type ? 'espresso' : 'filter',
            weight: basic.weight,
            weather: basic.weather,
            batch: basic.batch,
            name: basic.name,
            roast: basic.roast,
            start: {
                exhaust: start.exhaust,
                environment: start.environment,
                gas: start.gas,
                hz: start.hz
            },
            middle: {
                time: middle.time,
                exhaust: middle.exhaust,
                beans: middle.beans,
                environment: middle.environment,
                gas: middle.gas,
                min: middle.min,
                off: middle.off,
                f_off: middle.f_off,
                hz: middle.hz
            },
            crack: {
                time: crack.time,
                exhaust: crack.exhaust,
                beans: crack.beans,
                environment: crack.environment,
                gas: crack.gas,
                min: crack.min,
                off: crack.off,
                f_off: crack.f_off,
                hz: crack.hz
            },
            end: {
                time: end.time,
                exhaust: end.exhaust,
                beans: end.beans,
                environment: end.environment,
                gas: end.gas,
                min: end.min,
                off: end.off,
                f_off: end.f_off,
                hz: end.hz
            }
        });

        const savedEntry = await newEntry.save();
        res.status(201).json({
            message: 'Entry saved successfully',
            data: savedEntry
        });
    } catch (error) {
        console.error('Error saving entry:', error);
        res.status(500).json({ error: error.message });
    }
};

// хелпер: перевод MM.SS → секунды
function mmssToSec(val) {
    // val может быть числом (7.00) или строкой ("7.00")
    const v = String(val);
    const parts = v.split('.');
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parts[1] !== undefined
        ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10)
        : 0;
    return minutes * 60 + seconds;
}
// Округление до шага (например, 0.5 или 5)
function roundStep(value, step) {
    if (typeof value !== 'number' || typeof step !== 'number' || step <= 0) {
        return value;
    }
    return Math.round(value / step) * step;
}

// Простой линейный регресс (метод наименьших квадратов)
// Возвращает { slope, intercept }
function linearRegression(xs, ys) {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sumXX = xs.reduce((a, b) => a + b * b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;
    return { slope, intercept };
}

// Форматируем секунды обратно в MM.SS (число)
function formatSec(totalSec) {
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.round(totalSec - minutes * 60);
    // Делаем дробную часть из двух цифр
    const secStr = String(seconds).padStart(2, '0');
    return parseFloat(`${minutes}.${secStr}`);
}
// целевые времена в секундах
const TARGETS = {
    light: { filter: { crack: mmssToSec(7.00), end: mmssToSec(8.15) } },
    medium: {
        espresso: { crack: mmssToSec(9.30), end: mmssToSec(12.00) },
        filter: { crack: mmssToSec(7.0), end: mmssToSec(8.35) }
    },
    dark: { espresso: { crack: mmssToSec(9.30), end: mmssToSec(13.20) } }
};

exports.getRecommendations = async (req, res) => {
    try {
        const { type, roast, weight, batch, name, weather } = req.query;
        const tgt = TARGETS[roast]?.[type] || {};
        console.log('tgt', TARGETS)
        if (!tgt.crack || !tgt.end) {
            return res.status(400).json({ error: 'Неподдерживаемая комбинация roast/type' });
        }

        // 1) Общий фильтр
        const baseFilter = { type, roast, batch: Number(batch) };
        const [all, groupA, groupB] = await Promise.all([
            Entry.find(baseFilter),
            Entry.find({ ...baseFilter, name }),
            Entry.find({ ...baseFilter, name: { $ne: name } })
        ]);
        const countA = groupA.length, countB = groupB.length, countAll = all.length;
        const weightName = countA > 10 ? 1 : countA / (countA + countB);

        // 2) Функция усреднения
        const avgStats = docs => {
            const sum = docs.reduce((acc, doc) => {
                ['start', 'middle', 'crack', 'end'].forEach(stage => {
                    Object.entries(doc[stage]).forEach(([k, v]) => {
                        if (typeof v === 'number') {
                            acc[stage][k] = (acc[stage][k] || 0) + v;
                        }
                    });
                });
                return acc;
            }, { start: {}, middle: {}, crack: {}, end: {} });

            // перевод в средние
            ['start', 'middle', 'crack', 'end'].forEach(stage => {
                Object.keys(sum[stage]).forEach(k => {
                    sum[stage][k] /= docs.length;
                });
            });
            return sum;
        };

        const rec = {
            start: {},
            middle: {},
            crack: {}
        };


        const avgA = countA ? avgStats(groupA) : null;
        const avgAll = countAll ? avgStats(all) : null;

        // 3) Взвешенные рекомендации по стадиям
        function mix(stage, param) {
            if (weightName === 1) return avgA[stage][param];
            const a = avgA?.[stage]?.[param] || 0;
            const b = avgAll[stage][param] || 0;
            return weightName * a + (1 - weightName) * b;
        }
        // 4) Скорректировать по весу

        const avgWeightAll = all.reduce((s, d) => s + d.weight, 0) / countAll;
        ['start', 'middle', 'crack'].forEach(stage => {
            rec[stage].gas_raw = mix(stage, 'gas');
            rec[stage].hz_raw = mix(stage, 'hz');

            // масштабирование по весу
            rec[stage].gas_scaled = rec[stage].gas_raw * (weight / avgWeightAll);
            rec[stage].hz_scaled = rec[stage].hz_raw * (weight / avgWeightAll);
        });

        // 5) Учёт погоды (пример для exhaust)
        // 5) Учёт погоды (пример для exhaust → gas)
        const wDocs = await Entry.find({
            batch: { $gt: 1 },
            weather: { $gte: weather - 2, $lte: weather + 2 }
        });
        if (wDocs.length >= 15) {
            const xs = wDocs.map(d => d.weather);
            const ys = wDocs.map(d => d.start.exhaust);
            const { slope } = linearRegression(xs, ys);
            const avgW = xs.reduce((a, b) => a + b, 0) / xs.length;
            // Правильное присваивание
            rec.start.gas_final = rec.start.gas_scaled - slope * (weather - avgW);
        }

        // 6) Построение профиля по этапам
        const profile = {};
        ['start', 'middle', 'crack', 'end'].forEach(stage => {
            profile[stage] = {};

            if (stage !== 'end') {
                // gas: либо финальный, либо скейленый
                const gasVal = (stage === 'start' && rec.start.gas_final != null)
                    ? rec.start.gas_final
                    : rec[stage].gas_scaled;
                profile[stage].gas = roundStep(gasVal, 0.5);

                // hz всегда из скейленого
                profile[stage].hz = roundStep(rec[stage].hz_scaled, 5);
            }

            // температуры
            ['exhaust', 'environment', 'beans'].forEach(t => {
                const val = mix(stage, t);
                if (val != null) profile[stage][t] = +val.toFixed(1);
            });

            // время
            if (stage === 'crack' || stage === 'end') {
                const target = stage === 'crack' ? tgt.crack : tgt.end;
                profile[stage].time = formatSec(target);
            }
        });

     
        console.log('profile', profile)

        return res.json({ profile });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
