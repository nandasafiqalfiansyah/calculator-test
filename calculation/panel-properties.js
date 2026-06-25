/**
 * Class Panel Properties is used to calculate the properties of panel CLT Layup.
 * Panel properties can calculate
 *  - Shear Analogy Method
 *  - Gamma Method
 * 
 * How to use : 
 * calculate(CLTLayup) => PanelProperties
 */

// Base class for panel properties
class PanelProperties {
    /**
     * @param {CLTLayupType} cltLayup
     * @returns {PanelPropertiesType}
     */
    calculate(cltLayup) {
        throw new Error('Subclass must implement calculate method');
    }

    /**
     * Factory method to get the appropriate calculator
     * @param {string} method - 'shear-analogy' or 'gamma'
     * @returns {PanelProperties}
     */
    static getCalculator(method) {
        switch (method) {
            case 'shear-analogy':
                return new ShearAnalogyMethod();
            case 'gamma':
                return new GammaMethod();
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }
}

class ShearAnalogyMethod extends PanelProperties {
    /**
     * Calculate panel properties using Shear Analogy method
     * @param {CLTLayupType} cltLayup
     * @returns {PanelPropertiesType}
     */
    calculate(cltLayup) {
        const result = new PanelPropertiesType();
        result.method = 'shear-analogy';
        result.layupName = cltLayup.name;
        result.totalThickness = cltLayup.getTotalThickness();

        const layers = cltLayup.getLayers();
        const n = layers.length;
        const beff = cltLayup.beff;

        // Calculate centroid (neutral axis position from bottom)
        let sumArea = 0;
        let sumAreaY = 0;
        let yPos = 0; // position from bottom

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const yCenter = yPos + layer.thickness / 2;
            sumArea += layer.thickness;
            sumAreaY += layer.thickness * yCenter;
            yPos += layer.thickness;
        }

        const neutralAxis = sumAreaY / sumArea;

        // Calculate properties for each layer
        let totalEI = 0;
        yPos = 0;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const yCenter = yPos + layer.thickness / 2;
            const a = yCenter - neutralAxis; // distance from neutral axis
            const ti = layer.thickness;
            const Ei = layer.E;

            // Local bending stiffness: beff * ti³ / 12
            const beff_ti3_12 = beff * Math.pow(ti, 3) / 12;

            // Steiner term: beff * ti * ai²
            const beff_ti_ai2 = beff * ti * Math.pow(a, 2);

            // Gamma = 1 for Shear Analogy (no reduction)
            const gamma = 1;

            // EI = Ei * (beff_ti3_12 + gamma * beff_ti_ai2)
            const EI = Ei * (beff_ti3_12 + gamma * beff_ti_ai2);
            totalEI += EI;

            const layerProp = new CLTLayerPropertiesType(
                layer,
                yCenter,
                a,
                beff_ti3_12,
                beff_ti_ai2,
                gamma,
                EI
            );
            result.addLayerProperties(layerProp);

            yPos += layer.thickness;
        }

        result.EIeff = totalEI;
        return result;
    }
}

class GammaMethod extends PanelProperties {
    /**
     * Calculate panel properties using Gamma method
     * @param {CLTLayupType} cltLayup
     * @returns {PanelPropertiesType}
     */
    calculate(cltLayup) {
        const result = new PanelPropertiesType();
        result.method = 'gamma';
        result.layupName = cltLayup.name;
        result.totalThickness = cltLayup.getTotalThickness();

        const layers = cltLayup.getLayers();
        const n = layers.length;
        const beff = cltLayup.beff;
        const Lref = 5000; // Reference length in mm (from Excel)

        // Calculate centroid
        let sumArea = 0;
        let sumAreaY = 0;
        let yPos = 0;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const yCenter = yPos + layer.thickness / 2;
            sumArea += layer.thickness;
            sumAreaY += layer.thickness * yCenter;
            yPos += layer.thickness;
        }

        const neutralAxis = sumAreaY / sumArea;

        // Calculate gamma factors for each layer
        // γi = 1 / (1 + π² · Ei · Ai · si / (L² · GR,i,i+1 · beff))
        // where si = distance between centers of adjacent layers connected by perpendicular layer

        const gammas = [];
        for (let i = 0; i < n; i++) {
            const layer = layers[i];

            if (layer.orientation !== 0) {
                // Perpendicular layers - gamma = 0 (no Steiner contribution)
                gammas.push(0);
                continue;
            }

            // Find si: the distance between this parallel layer and the next parallel layer
            // through the perpendicular layer(s) between them
            let si = 0;
            let GR = 0;

            if (i === 0) {
                // Top layer - look down for first perpendicular layer connecting to next parallel layer
                for (let j = i + 1; j < n; j++) {
                    if (layers[j].orientation === 90) {
                        si = layers[j].thickness;
                        GR = layers[j].G;
                        break;
                    }
                }
            } else if (i === n - 1) {
                // Bottom layer - look up for first perpendicular layer connecting to previous parallel layer
                for (let j = i - 1; j >= 0; j--) {
                    if (layers[j].orientation === 90) {
                        si = layers[j].thickness;
                        GR = layers[j].G;
                        break;
                    }
                }
            } else {
                // Middle layer - find the nearest perpendicular layer
                for (let j = i - 1; j >= 0; j--) {
                    if (layers[j].orientation === 90) {
                        si = layers[j].thickness;
                        GR = layers[j].G;
                        break;
                    }
                    if (layers[j].orientation === 0) break;
                }
                if (si === 0) {
                    for (let j = i + 1; j < n; j++) {
                        if (layers[j].orientation === 90) {
                            si = layers[j].thickness;
                            GR = layers[j].G;
                            break;
                        }
                        if (layers[j].orientation === 0) break;
                    }
                }
            }

            if (si <= 0 || GR <= 0) {
                gammas.push(1);
                continue;
            }

            // Area per unit width: Ai = ti (mm²/mm)
            const Ai = layer.thickness;
            const Ei = layer.E;

            // γi = 1 / (1 + π² · Ei · Ai · si / (L² · GR · beff))
            const numerator = Math.PI * Math.PI * Ei * Ai * si;
            const denominator = Lref * Lref * GR * beff;
            const gamma = 1 / (1 + numerator / denominator);

            gammas.push(gamma);
        }

        // Calculate properties for each layer
        let totalEI = 0;
        yPos = 0;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const yCenter = yPos + layer.thickness / 2;
            const a = yCenter - neutralAxis;
            const ti = layer.thickness;
            const Ei = layer.E;
            const gamma = gammas[i];

            const beff_ti3_12 = beff * Math.pow(ti, 3) / 12;
            const beff_ti_ai2 = beff * ti * Math.pow(a, 2);
            const EI = Ei * (beff_ti3_12 + gamma * beff_ti_ai2);
            totalEI += EI;

            const layerProp = new CLTLayerPropertiesType(
                layer,
                yCenter,
                a,
                beff_ti3_12,
                beff_ti_ai2,
                gamma,
                EI
            );
            result.addLayerProperties(layerProp);

            yPos += layer.thickness;
        }

        result.EIeff = totalEI;
        return result;
    }
}